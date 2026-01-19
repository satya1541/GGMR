import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertDeviceSchema } from "@shared/schema";
import { MQTTService } from "./mqtt";
import { metadataService } from "./metadata";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // MQTT Service
  const mqttService = new MQTTService(wss);
  await mqttService.syncDevices();

  wss.on("connection", (ws) => {
    // console.log("Client connected to WebSocket");
    ws.on("close", () => {
      // console.log("Client disconnected");
    });
  });

  // API Routes
  app.get("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const devices = await storage.getDevices(user.id, user.role);
    res.json(devices);
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const updatedUser = await storage.updateUser(user.id, req.body);
    // Update the session user
    req.login(updatedUser, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(updatedUser);
    });
  });

  app.post("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const result = insertDeviceSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(result.error);
      return;
    }
    const device = await storage.createDevice({ ...result.data, ownerId: user.id });
    await mqttService.syncDevices(); // Sync new MQTT connection
    res.json(device);
  });

  app.patch("/api/devices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const device = await storage.getDevice(id);
    if (!device) return res.sendStatus(404);

    const user = req.user as any;
    if (user.role !== "admin" && device.ownerId !== user.id) {
      return res.sendStatus(403);
    }

    const updated = await storage.updateDevice(id, req.body);
    await mqttService.syncDevices(); // Sync updated MQTT connection
    res.json(updated);
  });

  app.delete("/api/devices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const device = await storage.getDevice(id);
    if (!device) return res.sendStatus(404);

    const user = req.user as any;
    if (user.role !== "admin" && device.ownerId !== user.id) {
      return res.sendStatus(403);
    }

    await storage.deleteDevice(id);
    await mqttService.syncDevices(); // Cleanup MQTT connection
    res.sendStatus(200);
  });

  app.get("/api/devices/:id/readings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    // TODO: Verify user owns this device or is admin
    const readings = await storage.getReadings(id);
    res.json(readings);
  });

  app.get("/api/readings/types", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return full metadata objects (enriched by AI)
    const allMeta = metadataService.getAll();
    res.json(allMeta);
  });

  app.get("/api/readings/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 200;
    const readings = await storage.getRecentReadings(user.id, user.role, limit);
    res.json(readings);
  });

  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;

    // Fetch real data to generate notifications
    const devices = await storage.getDevices(user.id, user.role);
    const readings = await storage.getRecentReadings(user.id, user.role, 50);

    const notifications: any[] = [];
    let idCounter = 1;

    // 1. Check for Offline Devices
    devices.forEach(d => {
      if (d.status === 'offline') {
        notifications.push({
          id: idCounter++,
          type: 'alert',
          title: 'Device Offline',
          device: d.name,
          time: d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'
        });
      }
    });

    // 2. Check for High/Low Values (Simple Thresholds)
    readings.forEach(r => {
      let alertTitle = '';
      if (r.type.toLowerCase().includes('temp') && r.value > 80) alertTitle = 'High Temperature';
      if (r.type.toLowerCase().includes('hum') && r.value > 90) alertTitle = 'High Humidity';
      if (r.type.toLowerCase().includes('volt') && (r.value > 250 || r.value < 180)) alertTitle = 'Voltage Instability';

      const deviceName = devices.find(d => d.id === r.deviceId)?.name || `Device #${r.deviceId}`;

      if (alertTitle) {
        notifications.push({
          id: idCounter++,
          type: 'alert',
          title: alertTitle,
          device: deviceName,
          time: new Date(r.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    // 3. Add some recent "Online" info if recently seen
    const now = new Date();
    devices.forEach(d => {
      if (d.lastSeen && (now.getTime() - new Date(d.lastSeen).getTime()) < 1000 * 60 * 60) { // Saw in last hour
        // Avoid duplicates if we already have an alert for this device, strictly speaking we might want both but let's keep it clean
        // Actually, let's just add 'Device Sync'
        notifications.push({
          id: idCounter++,
          type: 'success',
          title: 'Device Sync',
          device: d.name,
          time: new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    // Sort by recent? The list is arbitrary, but let's just return what we have. 
    // Maybe limit to top 10 to avoid flooding the UI
    res.json(notifications.slice(0, 10));
  });

  return httpServer;
}
