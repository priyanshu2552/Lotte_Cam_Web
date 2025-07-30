import { Server } from 'socket.io';
import pool from '../config/db.js';

class ProductionWebSocket {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            pingInterval: 25000,
            pingTimeout: 20000,
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000,
                skipMiddlewares: true
            }
        });

        this.setupConnection();
        this.setupDatabasePolling();
        this.activeSockets = new Set();
        this.lastCheckTime = new Date();
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

    async setupDatabasePolling() {
        try {
            console.log("🔍 Starting database polling setup...");
            
            // Verify table exists
            const [rows] = await pool.query("SHOW TABLES LIKE 'BeltEntries'");
            if (rows.length === 0) {
                throw new Error("BeltEntries table not found");
            }
            
            // Start polling every 1 second
            setInterval(() => this.checkForDatabaseChanges(), 1000);
            
            console.log("✅ Database polling started successfully");
        } catch (err) {
            console.error('❌ Polling setup failed:', err);
            setTimeout(() => this.setupDatabasePolling(), 5000);
        }
    }

    async checkForDatabaseChanges() {
        try {
            // Query for changes since last check
            const [results] = await pool.query(
                `SELECT * FROM BeltEntries 
                 WHERE Updated > ? 
                 ORDER BY Updated DESC 
                 LIMIT 1`,
                [this.lastCheckTime]
            );
            
            if (results.length > 0) {
                // Update the last check time to the newest record's update time
                this.lastCheckTime = new Date(results[0].Updated);
                
                console.log("🔄 Detected database changes:", {
                    count: results.length,
                    latestChange: this.lastCheckTime
                });
                
                // Emit event to all connected clients
                this.io.emit('dataChanged', { 
                    action: 'update',
                    data: results[0],
                    timestamp: this.lastCheckTime
                });
            }
        } catch (err) {
            console.error('❌ Error checking for database changes:', err);
        }
    }
}

export default ProductionWebSocket;