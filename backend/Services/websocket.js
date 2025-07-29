import { Server } from 'socket.io';
import mysql from 'mysql2';
import pool from '../config/db.js';
import ZongJi from 'zongji';

class ProductionWebSocket {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            pingInterval: 10000,
            pingTimeout: 5000
        });

        this.setupConnection();
        this.setupDatabaseListener();

        // Add connection tracking
        this.activeSockets = new Set();
    }

    setupConnection() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 Client Connected: ${socket.id}`);
            this.activeSockets.add(socket.id);

            socket.on('disconnect', () => {
                console.log(`🔌 Client Disconnected: ${socket.id}`);
                this.activeSockets.delete(socket.id);
                console.log(`Active clients: ${this.activeSockets.size}`);
            });

            socket.on('error', (err) => {
                console.error(`❌ Socket Error (${socket.id}):`, err);
            });
        });
    }

    async setupDatabaseListener() {
        try {
            console.log("🔍 Starting database listener setup...");

            // 1. Verify table exists
            const [rows] = await pool.query("SHOW TABLES LIKE 'BeltEntries'");
            console.log("📋 Tables found:", rows);
            if (rows.length === 0) throw new Error("BeltEntries table not found");

            // 2. Create ZongJi instance with debug
            console.log("ℹ️ Configuring ZongJi for database:", process.env.DB_NAME);
            const zongji = new ZongJi({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME, // Make sure this matches exactly
                serverId: 12345 // Use a fixed ID for debugging
            });

            // 3. Enhanced event logging
            zongji.on('ready', () => {
                console.log("✅ ZongJi ready - Connected to database:", process.env.DB_NAME);
            });

            zongji.on('binlog', (event) => {
                console.log("📢 RAW BINLOG EVENT DETECTED");
                console.log("- Event Type:", event.getEventName());
                console.log("- Table ID:", event.tableId);

                const tableMap = event.tableMap[event.tableId];
                if (tableMap) {
                    console.log("- Database:", tableMap.databaseName);
                    console.log("- Table:", tableMap.tableName);
                }

                if (tableMap?.tableName === 'BeltEntries') {
                    console.log("🔥 BELTENTRIES CHANGE DETECTED");
                    this.io.emit('dataChanged', {
                        table: 'BeltEntries',
                        timestamp: Date.now(),
                        action: event.getEventName()
                    });
                }
            });
            // 4. Start with detailed config
            console.log("🚀 Starting ZongJi listener...");
            await zongji.start({
                startAtEnd: false, // Crucial - reads from beginning of binlog
                includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows'],
                includeSchema: {
                    'Lotte': ['BeltEntries'] // Explicit database and table name
                }
            });

            console.log("🎧 ZongJi now actively listening for changes");

        } catch (err) {
            console.error('❌ SETUP FAILED:', err);
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                code: err.code
            });

            if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('⚠️ Permission denied - verify MySQL user has:');
                console.error('1. REPLICATION SLAVE privilege');
                console.error('2. REPLICATION CLIENT privilege');
                console.error('3. Full access to target database');
            }

            setTimeout(() => this.setupDatabaseListener(), 5000);
        }
    }
}
export default ProductionWebSocket;