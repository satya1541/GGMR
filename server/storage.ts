import { type User, type InsertUser, type Device, type InsertDevice, type Reading, type InsertReading, users, devices, readings } from "@shared/schema";
import { db, poolConnection } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import session from "express-session";
import MySQLSessionStore from "express-mysql-session";

const MySQLStore = MySQLSessionStore(session);

export interface IStorage {
  sessionStore: session.Store;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, update: Partial<User>): Promise<User>;

  // Devices
  getDevices(userId: string, role: string): Promise<Device[]>; // Updated for RBAC
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice & { ownerId: string }): Promise<Device>;
  updateDevice(id: number, update: Partial<Device>): Promise<Device>;
  updateDeviceStatus(id: number, status: string): Promise<Device | null>;
  deleteDevice(id: number): Promise<void>;

  // Readings
  addReading(reading: InsertReading): Promise<Reading>;
  getReadings(deviceId: number): Promise<Reading[]>;
  getActiveReadingTypes(userId: string, role: string): Promise<string[]>;
  getRecentReadings(userId: string, role: string, limit?: number): Promise<Reading[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MySQLStore({
      expiration: 86400000,
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    }, poolConnection as any);
  }

  // ... existing user methods ...

  async getRecentReadings(userId: string, role: string, limit: number = 200): Promise<Reading[]> {
    if (role === 'admin') {
      return await db.select().from(readings).orderBy(desc(readings.timestamp)).limit(limit);
    }

    return await db.select({
      id: readings.id,
      deviceId: readings.deviceId,
      type: readings.type,
      value: readings.value,
      unit: readings.unit,
      timestamp: readings.timestamp
    })
      .from(readings)
      .innerJoin(devices, eq(readings.deviceId, devices.id))
      .where(eq(devices.ownerId, userId))
      .orderBy(desc(readings.timestamp))
      .limit(limit);
  }

  async getActiveReadingTypes(userId: string, role: string): Promise<string[]> {
    if (role === 'admin') {
      const result = await db.selectDistinct({ type: readings.type }).from(readings);
      return result.map(r => r.type);
    }

    // Join readings with devices to filter by owner
    const result = await db.selectDistinct({ type: readings.type })
      .from(readings)
      .innerJoin(devices, eq(readings.deviceId, devices.id))
      .where(eq(devices.ownerId, userId));

    return result.map(r => r.type);
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID(); // Application-side UUID generation for MySQL
    const user: User = {
      ...insertUser,
      id,
      role: "user",
      fullName: insertUser.fullName || null,
      location: insertUser.location || null,
      division: insertUser.division || "General", // Default division
      emailNotifications: true,
      pushNotifications: true,
      publicTelemetry: false,
      remoteDebugging: true,
      deviceFingerprinting: true,
    };
    await db.insert(users).values(user);
    return user;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User> {
    await db.update(users).set(update).where(eq(users.id, id));
    const updated = await this.getUser(id);
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async getDevices(userId: string, role: string): Promise<Device[]> {
    if (role === "admin") {
      return await db.select().from(devices);
    } else {
      return await db.select().from(devices).where(eq(devices.ownerId, userId));
    }
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device;
  }

  async createDevice(insertDevice: InsertDevice & { ownerId: string }): Promise<Device> {
    const [result] = await db.insert(devices).values(insertDevice);
    // MySQL insert result has insertId
    const id = result.insertId as number;

    // Fetch and return the created device
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    if (!device) throw new Error("Failed to create device");
    return device;
  }

  async updateDevice(id: number, update: Partial<Device>): Promise<Device> {
    await db.update(devices)
      .set(update)
      .where(eq(devices.id, id));

    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    if (!device) throw new Error("Device not found");
    return device;
  }

  async updateDeviceStatus(id: number, status: string): Promise<Device | null> {
    await db.update(devices)
      .set({ status, lastSeen: new Date() })
      .where(eq(devices.id, id));

    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    if (!device) {
      console.warn(`[Storage] Device ${id} not found during status update (likely deleted)`);
      return null;
    }
    return device;
  }

  async deleteDevice(id: number): Promise<void> {
    // Delete readings first (referential integrity)
    await db.delete(readings).where(eq(readings.deviceId, id));
    // Delete the device
    await db.delete(devices).where(eq(devices.id, id));
  }

  async addReading(insertReading: InsertReading): Promise<Reading> {
    const [result] = await db.insert(readings).values(insertReading);
    const id = result.insertId as number;

    const [reading] = await db.select().from(readings).where(eq(readings.id, id));
    if (!reading) throw new Error("Failed to add reading");
    return reading;
  }

  async getReadings(deviceId: number): Promise<Reading[]> {
    // Return last 100 readings
    return await db.select()
      .from(readings)
      .where(eq(readings.deviceId, deviceId))
      .orderBy(desc(readings.timestamp))
      .limit(100);
  }
}

export const storage = new DatabaseStorage();
