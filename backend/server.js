import express from 'express';
import pool from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import User from './models/User.js';
import userRoutes from './routes/userRoutes.js';
import Belt from './models/Belt.js';
import Product from './models/Product.js';
import Unit from './models/Unit.js';
import BeltEntries from './models/BeltEntries.js';
import ProductionRecord from './models/ProductionRecord.js';
import ProductionWebSocket from './Services/websocket.js';
import bcrypt from 'bcryptjs';
import { spawn } from 'child_process';
import Stream from 'stream';
dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());

async function createAdminUserIfNotExists() {
  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [process.env.ADMIN_EMAIL]
    );

    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      await pool.query(
        `INSERT INTO users 
        (name, email, password, contact, role, is_email_verified) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          process.env.ADMIN_NAME,
          process.env.ADMIN_EMAIL,
          hashedPassword,
          process.env.ADMIN_CONTACT,
          'admin',
          true
        ]
      );
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

async function initializeApplication() {
  try {
    // 1. First establish database connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();

    // 2. Initialize all database schemas
    await initializeAllSchemas();

    // 3. Create admin user if not exists
    await createAdminUserIfNotExists();


    const server = app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });

    // 5. Initialize WebSocket server with the HTTP server instance
    new ProductionWebSocket(server);

    // 6. Set up routes (after server is ready)
    app.use('/api/users', userRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });

  } catch (err) {
    console.error('❌ Application initialization failed:', err);
    process.exit(1);
  }
}

async function initializeAllSchemas() {
  try {
    // Initialize in proper dependency order
    await Unit.initSchema();
    await Product.initSchema();
    await Belt.initSchema();
    await BeltEntries.initSchema();
    await ProductionRecord.initSchema();
    await User.initSchema();

    console.log('✅ All database schemas initialized');
  } catch (err) {
    console.error('❌ Schema initialization failed:', err);
    throw err;
  }
}
const streamSessions = {};

// MJPEG proxy endpoint
app.get("/stream", (req, res) => {
  const rtspUrl = req.query.url;

  if (!rtspUrl) return res.status(400).send("RTSP URL required");

  console.log(`📡 Requesting stream: ${rtspUrl}`);

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    Pragma: "no-cache",
  });

  const ffmpeg = spawn("ffmpeg", [
    "-rtsp_transport",
    "tcp",
    "-i",
    rtspUrl,
    "-f",
    "image2pipe",
    "-q:v",
    "5",
    "-update",
    "1",
    "-r",
    "5", // 5 FPS
    "-"
  ]);

  let buffer = Buffer.alloc(0);

  ffmpeg.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    // Look for JPEG end marker (FFD9)
    let frameEnd = buffer.indexOf(Buffer.from([0xff, 0xd9]));
    while (frameEnd !== -1) {
      const frame = buffer.slice(0, frameEnd + 2);
      buffer = buffer.slice(frameEnd + 2);

      res.write(`--frame\r\n`);
      res.write("Content-Type: image/jpeg\r\n\r\n");
      res.write(frame);
      res.write("\r\n");

      frameEnd = buffer.indexOf(Buffer.from([0xff, 0xd9]));
    }
  });

  ffmpeg.stderr.on("data", (data) => {
    console.error(`FFmpeg STDERR: ${data}`);
  });

  ffmpeg.on("close", () => {
    console.log("FFmpeg closed");
    res.end();
  });

  req.on("close", () => {
    console.log("Client disconnected, killing FFmpeg");
    ffmpeg.kill("SIGKILL");
  });
});
// Add after body parser middleware
app.use('/mjpeg', express.static('mjpeg_cache'));

// Start the application
initializeApplication();