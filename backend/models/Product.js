import pool from "../config/db.js";

class Product {
  static async initSchema() {
    try {
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
      );

      if (tables.length === 0) {
        await pool.query(`
          CREATE TABLE products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100),
            code VARCHAR(50),
            pieces INT
          )
        `);
        console.log("✅ Products table created");
      } else {
        console.log('ℹ️ Products table already exists');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Products table:', error);
      throw error;
    }
  }
}

// Initialize
Product.initSchema().catch(console.error);

export default Product;