// verify-db-connection.js
import express from 'express';
import pool from './config/db.js'
import dotenv from 'dotenv';
import cors from 'cors';
import User from './models/User.js';
import userRoutes from './routes/userRoutes.js'
import Belt from './models/Belt.js';
import Product from './models/Product.js';
import Unit from './models/Unit.js';
import BeltEntries from './models/BeltEntries.js';
import ProductionRecord from './models/ProductionRecord.js';

dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());


pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();

    // Start server
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

let isInitialized = false;

async function initializeAllSchemas() {
  if (isInitialized) return;
  
  try {
    // Initialize in proper dependency order
    await Unit.initSchema();         // No dependencies
    await Product.initSchema();      // No dependencies
    await Belt.initSchema();         // Depends on Unit
    await BeltEntries.initSchema();  // Depends on Belt and Product
    await ProductionRecord.initSchema(); // Depends on BeltEntries
    await User.initSchema();         // Independent
    
    console.log('✅ All database schemas initialized');
    isInitialized = true;
  } catch (err) {
    console.error('❌ Schema initialization failed:', err);
    throw err;
  }
}

// Replace your current User.initSchema().then() call with:
initializeAllSchemas()
  .then(() => {
    console.log("Database initialization complete");
  })
  .catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });

app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});