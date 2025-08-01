import pool from "../config/db.js";

class BeltEntries {
    static async initSchema() {
        try {
            const [tables] = await pool.query(
                `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='BeltEntries'`
            );
            if (tables.length === 0) {
                await pool.query(
                    `CREATE TABLE BeltEntries(
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        BoxCount int unsigned default NULL,
                        Barcode_content json NOT NULL,  
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        Updated datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        belt_id INT,
                        FOREIGN KEY (belt_id) REFERENCES Belt(id)
                    )`
                );
                console.log("✅ BeltEntries table created");
            } else {
                console.log('ℹ️ BeltEntries table already exists');
            }
        } catch (error) {
            console.error('❌ Failed to initialize BeltEntries table:', error);
            throw error;
        }
    }
}

export default BeltEntries;