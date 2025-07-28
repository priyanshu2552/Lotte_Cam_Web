import pool from "../config/db.js";

class Unit {
  static async initSchema() {
    try {
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Unit'`
      );

      if (tables.length === 0) {
        await pool.query(`
          CREATE TABLE Unit (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) UNIQUE NOT NULL
          )
        `);
        console.log("✅ Unit table created");
      } else {
        console.log('ℹ️ Unit table already exists');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Unit table:', error);
      throw error;
    }
  }
}

// Initialize
Unit.initSchema().catch(console.error);

export default Unit;