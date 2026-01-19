import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

export const poolConnection = mysql.createPool({
    host: "40.192.42.60",
    port: 3306,
    user: "testing",
    password: "testing@2025",
    database: "DGMR",
});

export const db = drizzle(poolConnection, { schema, mode: "default" });
