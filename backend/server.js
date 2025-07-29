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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

async function initializeApplication() {
  try {
    // 1. First establish database connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();

    // 2. Initialize all database schemas
    await initializeAllSchemas();

    // 3. Start the HTTP server
    const server = app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });

    // 4. Initialize WebSocket server with the HTTP server instance
    new ProductionWebSocket(server);

    // 5. Set up routes (after server is ready)
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
    await Unit.initSchema();         // No dependencies
    await Product.initSchema();      // No dependencies
    await Belt.initSchema();         // Depends on Unit
    await BeltEntries.initSchema();  // Depends on Belt and Product
    await ProductionRecord.initSchema(); // Depends on BeltEntries
    await User.initSchema();         // Independent

    console.log('✅ All database schemas initialized');
  } catch (err) {
    console.error('❌ Schema initialization failed:', err);
    throw err;
  }
}
// Add to your routes
app.get('/test-db-change', async (req, res) => {
  try {
    console.log("💉 Attempting test DB change...");
    
    // 1. First verify connection
    await pool.query("SELECT 1");
    
    // 2. Create test data with proper JSON formatting
    const testData = {
      BoxCount: 10,
      Barcode_content: JSON.stringify({status: "valid", barcode: "222111000"}),
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      Updated: new Date().toISOString().slice(0, 19).replace('T', ' '),
      belt_id: 1,
      production_id: 4
    };

    // 3. Execute with parameterized query
    const [result] = await pool.query(
      `INSERT INTO BeltEntries 
       (BoxCount, Barcode_content, created_at, Updated, belt_id, production_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        testData.BoxCount,
        testData.Barcode_content,
        testData.created_at,
        testData.Updated,
        testData.belt_id,
        testData.production_id
      ]
    );

    console.log("✅ Test DB change successful. Rows affected:", result.affectedRows);
    console.log("Insert ID:", result.insertId);

    // 4. Immediately make an update to trigger another event
    await pool.query(
      `UPDATE BeltEntries SET BoxCount = ? WHERE id = ?`,
      [15, result.insertId]
    );

    res.json({ 
      success: true, 
      insertId: result.insertId,
      message: "Check server logs for binlog events"
    });

  } catch (err) {
    console.error("💥 Test DB change failed:", {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
    res.status(500).json({ 
      error: err.message,
      details: {
        code: err.code,
        sqlMessage: err.sqlMessage
      }
    });
  }
});

// Start the application
initializeApplication();