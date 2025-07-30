import pool from "../config/db.js";

class User {
  static async initSchema() {
    try {
      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
      );

      if (tables.length === 0) {
        await pool.query(`
          CREATE TABLE users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            contact VARCHAR(15),
            role ENUM('admin', 'user') DEFAULT 'user',
            is_email_verified BOOLEAN DEFAULT FALSE,
            verification_token VARCHAR(255),
            reset_password_token VARCHAR(255),
            reset_token_expires DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log("✅ User table created");
      } else {
        console.log("ℹ️ Users table already exists");
      }
    } catch (error) {
      console.error('❌ Failed to initialize users table:', error);
      throw error;
    }
  }
}

export default User;