// import pool from "./config/db.js";
// import { format } from 'date-fns';

// async function populateSampleData() {
//   let connection;
//   try {
//     connection = await pool.getConnection();
    
//     console.log('🗃️ Starting database population...');

//     // Clear existing data (optional)
//     await connection.query('SET FOREIGN_KEY_CHECKS = 0');
//     await connection.query('TRUNCATE TABLE BeltEntries');
//     await connection.query('TRUNCATE TABLE Belt');
//     await connection.query('TRUNCATE TABLE products');
//     await connection.query('SET FOREIGN_KEY_CHECKS = 1');

//     // Insert sample belts
//     const beltInsert = `
//       INSERT INTO Belt (name, CameraCount, CameraBarcode, Unit) VALUES ?
//     `;
//     const beltValues = [
//       ['Belt 1', 'efrggtrgrthtyhhtyh./ukuik/.com', 'efrggtrgrthtyhhtyh./ttttttttg/.com', 'Mumbai'],
//       ['Belt 2', 'gbth5yhy./ukuik/.com', 'hythyh./ttttttttg/.com', 'Delhi'],
//       ['Belt 3', 'camera3count.example.com', 'camera3barcode.example.com', 'Mumbai']
//     ];
//     const [beltResult] = await connection.query(beltInsert, [beltValues]);
//     console.log(`✅ Inserted ${beltResult.affectedRows} belts`);

//     // Insert sample products
//     const productInsert = `
//       INSERT INTO products (name, code, pieces) VALUES ?
//     `;
//     const productValues = [
//       ['Chocolate Bar', 'CHOCO001', 24],
//       ['Gummy Bears', 'GUM002', 50],
//       ['Lollipop', 'LOL003', 1],
//       ['Peppermint', 'PEP004', 10],
//       ['Caramel', 'CAR005', 12]
//     ];
//     const [productResult] = await connection.query(productInsert, [productValues]);
//     console.log(`✅ Inserted ${productResult.affectedRows} products`);

//     // Get current date and calculate dates for test data
//     const now = new Date();
//     const today = format(now, 'yyyy-MM-dd HH:mm:ss');
//     const yesterday = format(new Date(now.setDate(now.getDate() - 1)), 'yyyy-MM-dd HH:mm:ss');
//     const lastWeek = format(new Date(now.setDate(now.getDate() - 6)), 'yyyy-MM-dd HH:mm:ss');

//     // Insert sample belt entries
//     const entriesInsert = `
//       INSERT INTO BeltEntries 
//         (BoxCount, Barcode_content, belt_id, production_id, created_at) 
//       VALUES ?
//     `;
//     const entriesValues = [
//       // Today's entries
//       [10, JSON.stringify({barcode: "123456789", status: "valid"}), 1, 1, today],
//       [15, JSON.stringify({barcode: "987654321", status: "valid"}), 1, 2, today],
//       [8, JSON.stringify({barcode: "456123789", status: "valid"}), 2, 3, today],
//       [12, JSON.stringify({barcode: "789123456", status: "valid"}), 2, 4, today],
//       [5, JSON.stringify({barcode: "321654987", status: "valid"}), 3, 5, today],
      
//       // Yesterday's entries
//       [7, JSON.stringify({barcode: "111222333", status: "valid"}), 1, 1, yesterday],
//       [9, JSON.stringify({barcode: "444555666", status: "valid"}), 1, 2, yesterday],
//       [11, JSON.stringify({barcode: "777888999", status: "valid"}), 2, 3, yesterday],
//       [6, JSON.stringify({barcode: "000111222", status: "valid"}), 3, 4, yesterday],
      
//       // Last week's entries
//       [14, JSON.stringify({barcode: "333222111", status: "valid"}), 1, 1, lastWeek],
//       [8, JSON.stringify({barcode: "666555444", status: "valid"}), 2, 2, lastWeek],
//       [13, JSON.stringify({barcode: "999888777", status: "valid"}), 3, 3, lastWeek],
//       [10, JSON.stringify({barcode: "222111000", status: "valid"}), 1, 4, lastWeek]
//     ];
//     const [entriesResult] = await connection.query(entriesInsert, [entriesValues]);
//     console.log(`✅ Inserted ${entriesResult.affectedRows} belt entries`);

//     console.log('🎉 Database population completed successfully!');

//   } catch (error) {
//     console.error('❌ Error populating database:', error);
//   } finally {
//     if (connection) connection.release();
//     await pool.end();
//   }
// }

// populateSampleData();