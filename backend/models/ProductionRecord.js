import pool from "../config/db.js";

class ProductionRecord {
  static async initSchema() {
    try {
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records'`
      );

      if (tables.length === 0) {
        await pool.query(`
          CREATE TABLE production_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            BeltEntries INT NOT NULL,
            Belt_id INT NOT NULL,
            box_count INT NOT NULL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (BeltEntries) REFERENCES BeltEntries(id),
            FOREIGN KEY (Belt_id) REFERENCES Belt(id)
          )
        `);
        console.log("✅ ProductionRecords table created");
      } else {
        console.log('ℹ️ ProductionRecords table already exists');
      }
    } catch (error) {
      console.error('❌ Failed to initialize ProductionRecords table:', error);
      throw error;
    }
  }
}

// Initialize
ProductionRecord.initSchema().catch(console.error);

export default ProductionRecord;