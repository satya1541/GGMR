import mqtt from "mqtt";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { inferMetadata } from "./services/ai";
import { metadataService } from "./metadata";

export class MQTTService {
    private clients: Map<number, mqtt.MqttClient> = new Map();
    private wss: WebSocketServer | null = null;
    private authenticatedClients: Map<WebSocket, { userId: string; role: string }>;

    constructor(wss: WebSocketServer, authenticatedClients: Map<WebSocket, { userId: string; role: string }>) {
        this.wss = wss;
        this.authenticatedClients = authenticatedClients;
    }

    async syncDevices() {
        const devices = await storage.getDevices("system", "admin");

        // Reset all statuses to offline initially to clear stale simulation data
        for (const device of devices) {
            if (device.status !== "offline") {
                await storage.updateDeviceStatus(device.id, "offline");
            }
        }

        // Connect to new devices or update existing ones
        for (const device of devices) {
            if (!device.broker || !device.topic) continue;

            const existingClient = this.clients.get(device.id);
            if (!existingClient) {
                this.connectDevice(device);
            }
        }

        // Clean up removed devices (not strictly needed since we don't have DELETE yet but good practice)
        const deviceIds = new Set(devices.map(d => d.id));
        for (const [id, client] of Array.from(this.clients.entries())) {
            if (!deviceIds.has(id)) {
                client.end();
                this.clients.delete(id);
            }
        }
    }

    private connectDevice(device: any) {
        try {
            const options: mqtt.IClientOptions = {
                username: device.username || undefined,
                password: device.password || undefined,
                connectTimeout: 30000,
                reconnectPeriod: 10000,
                keepalive: 60,
            };

            // Map protocol selection to URL prefix
            let brokerUrl = device.broker;
            if (!brokerUrl.includes("://")) {
                // If it's a host:port string, we need to extract them to be safe
                const [host, port] = device.broker.split(":");
                const protocol = device.protocol?.toLowerCase() || "mqtt";

                let prefix = "mqtt://";
                if (protocol === "mqtts") prefix = "mqtts://";
                else if (protocol === "websocket" || protocol === "ws") prefix = "ws://";
                else if (protocol === "websocket secure" || protocol === "wss") prefix = "wss://";

                // Construct normalized URL
                brokerUrl = port ? `${prefix}${host}:${port}` : `${prefix}${host}`;
            }

            console.log(`[MQTT] Connecting Device ${device.id} (${device.name}) -> ${brokerUrl}`);
            const client = mqtt.connect(brokerUrl, options);

            client.on("connect", () => {
                console.log(`MQTT Connected: Device ${device.name} (${device.id}) to ${device.broker}`);
                client.subscribe(device.topic);
                storage.updateDeviceStatus(device.id, "connected");
            });

            // ... imports removed from here

            // ... inside MQTTService class

            client.on("message", async (topic, payload) => {
                try {
                    const data = JSON.parse(payload.toString());

                    // 1. Broadcast RAW message
                    this.broadcast({
                        type: "update",
                        deviceId: device.id,
                        data: {
                            status: "connected",
                            raw: data,
                            timestamp: new Date()
                        }
                    }, device.ownerId);

                    // 2. Extract Readings & Enrich with AI
                    const items = Array.isArray(data) ? data : [data];

                    for (const item of items) {
                        if (typeof item !== 'object' || item === null) continue;

                        let type = "";
                        let value = 0;
                        let unit = "";

                        // Case A: Standard schema
                        if (item.type && item.value !== undefined) {
                            type = item.type;
                            value = parseFloat(item.value);
                            unit = item.unit || "";
                        }
                        // Case B: Hardware schema (Key-Value)
                        else {
                            for (const [key, val] of Object.entries(item)) {
                                let processedValue = this.parseTelemetryValue(val);

                                if (processedValue !== null) {
                                    type = key.toLowerCase();
                                    value = processedValue;

                                    // Logic duplicated from above to handle MULTIPLE keys per object
                                    // Ideally we refactor this, but for minimal diff we just inline the handling here
                                    // OR better: We loop, process, and continue.
                                    // The current structure sets 'type'/'value' vars and then expects processing AFTER the loop.
                                    // That structure works for "Case A" (one item, one value) but fails for "Case B" (one item, many values).

                                    // REFACTORING: Move processing INSIDE the discovery loop

                                    // AI TRIGGER: Check if we know this type
                                    if (!metadataService.has(type)) {
                                        console.log(`[AI] New type discovered: "${type}". Registering placeholder...`);
                                        // Optimistic registration so it shows up in UI immediately
                                        metadataService.set(type, {
                                            originalKey: type,
                                            label: type, // Fallback label
                                            unit: "",
                                            description: "analyzing...",
                                            category: "other"
                                        });

                                        console.log(`[AI] Inferring metadata for: "${type}"...`);
                                        inferMetadata(type, value).then(meta => {
                                            console.log(`[AI] Inferred for ${type}:`, meta);
                                            metadataService.set(type, meta);
                                        }).catch(err => {
                                            console.error(`[AI] Failed to infer for ${type}:`, err);
                                            // Keep placeholder on error
                                        });
                                    }

                                    // BYPASS DB: Create in-memory reading object
                                    const reading = {
                                        id: Date.now(), // Temporary ID
                                        deviceId: device.id,
                                        type,
                                        value,
                                        unit: "",
                                        timestamp: new Date()
                                    };
                                    this.broadcast({ type: "update", deviceId: device.id, data: { status: "connected", reading } }, device.ownerId);
                                }
                            }
                            // prevent outer logic from running again for "Case B" since we handled it inside
                            continue;
                        }

                        if (type) {
                            // ... Existing logic for Case A (Standard format) ...
                            // AI TRIGGER: Check if we know this type
                            if (!metadataService.has(type)) {
                                console.log(`[AI] New type discovered: "${type}". Registering placeholder...`);
                                // Optimistic registration
                                metadataService.set(type, {
                                    originalKey: type,
                                    label: type,
                                    unit: "",
                                    description: "analyzing...",
                                    category: "other"
                                });

                                inferMetadata(type, value).then(meta => {
                                    console.log(`[AI] Inferred for ${type}:`, meta);
                                    metadataService.set(type, meta);
                                }).catch(err => {
                                    console.error(`[AI] Failed to infer for ${type}:`, err);
                                });
                            }

                            // BYPASS DB: Create in-memory reading object
                            const reading = {
                                id: Date.now(), // Temporary ID
                                deviceId: device.id,
                                type,
                                value,
                                unit,
                                timestamp: new Date()
                            };
                            this.broadcast({ type: "update", deviceId: device.id, data: { status: "connected", reading } }, device.ownerId);
                        }
                    }
                } catch (err) {
                    console.error(`Error parsing MQTT payload from device ${device.id}:`, err);
                }
            });

            client.on("error", (err) => {
                console.error(`MQTT Error: Device ${device.id}:`, err);
                storage.updateDeviceStatus(device.id, "error");
            });

            client.on("close", () => {
                storage.updateDeviceStatus(device.id, "offline");
            });

            this.clients.set(device.id, client);
        } catch (err) {
            console.error(`Failed to connect MQTT for device ${device.id}:`, err);
        }
    }

    private parseTelemetryValue(val: any): number | null {
        // Handle boolean values
        if (typeof val === 'boolean') {
            return val ? 1 : 0;
        }

        // Handle time strings (e.g. "HH:MM:SS" or "HH:MM") FIRST
        if (typeof val === 'string' && val.includes(':')) {
            const parts = val.split(':');
            if (parts.length >= 2) {
                const h = parseInt(parts[0]);
                const m = parseInt(parts[1]);
                const s = parts[2] ? parseInt(parts[2]) : 0;

                if (!isNaN(h) && !isNaN(m)) {
                    // Convert to decimal hours for charting (e.g. 13:30 -> 13.5)
                    return h + m / 60 + s / 3600;
                }
            }
        }

        // Handle generic numeric values as a fallback
        const numericVal = parseFloat(val as string);
        if (!isNaN(numericVal)) {
            return numericVal;
        }

        return null;
    }

    private broadcast(message: any, deviceOwnerId?: string) {
        if (!this.wss) return;
        const payload = JSON.stringify(message);

        this.wss.clients.forEach((client) => {
            if (client.readyState !== WebSocket.OPEN) return;

            // Get authenticated user info for this client
            const userInfo = this.authenticatedClients.get(client);
            if (!userInfo) return; // Skip unauthenticated clients

            // Send if: admin OR no device owner specified OR user owns the device
            if (userInfo.role === 'admin' || !deviceOwnerId || userInfo.userId === deviceOwnerId) {
                client.send(payload);
            }
        });
    }
}
