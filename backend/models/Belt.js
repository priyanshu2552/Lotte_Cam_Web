import pool from "../config/db.js";

class Belt {
  static async initSchema() {
    try {
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Belt'`
      );

      if (tables.length === 0) {
        await pool.query(`
          CREATE TABLE Belt (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) UNIQUE NOT NULL,
            CameraCount VARCHAR(50) NOT NULL,
            CameraBarcode VARCHAR(50) NOT NULL,
            Unit VARCHAR(50) NOT NULL
          )
        `);
        console.log("✅ Belt table created");
      } else {
        console.log('ℹ️ Belt table already exists');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Belt table:', error);
      throw error;
    }
  }
}

// Initialize
Belt.initSchema().catch(console.error);

export default Belt;