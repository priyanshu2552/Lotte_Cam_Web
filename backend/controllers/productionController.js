import pool from "../config/db.js";

class ProductionController {
  // Get today's production categorized by product for each belt
  static async getTodayProduction(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { unitId } = req.query;

      let query = `
        SELECT 
          b.id AS belt_id,
          b.name AS belt_name,
          p.name AS product_name,
          p.code AS product_code,
          SUM(be.BoxCount) AS total_boxes,
          SUM(be.BoxCount * p.pieces) AS total_pieces,
          COUNT(be.id) AS entries_count
        FROM BeltEntries be
        JOIN Belt b ON be.belt_id = b.id
        JOIN products p ON be.production_id = p.id
        WHERE DATE(be.created_at) = ?
      `;

      const params = [today];

      if (unitId) {
        query += ' AND b.Unit = ?';
        params.push(unitId);
      }

      query += `
        GROUP BY b.id, b.name, p.name, p.code
        ORDER BY b.name, p.name
      `;

      const [results] = await pool.query(query, params);

      // Organize data by belt ID
      const productionByBelt = {};
      results.forEach(row => {
        if (!productionByBelt[row.belt_id]) {
          productionByBelt[row.belt_id] = [];
        }
        productionByBelt[row.belt_id].push({
          product_name: row.product_name,
          product_code: row.product_code,
          total_boxes: row.total_boxes,
          total_pieces: row.total_pieces,
          entries_count: row.entries_count
        });
      });

      res.json({
        date: today,
        production: productionByBelt
      });
    } catch (error) {
      console.error('Error fetching today\'s production:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s production' });
    }
  }
  static async getProductionRecords(req, res) {
    try {
      const { unitId, startDate, endDate, beltId, productId } = req.query;
      // Default date range
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultEndDate.getDate() - 10);

      const queryStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
      const queryEndDate = endDate || defaultEndDate.toISOString().split('T')[0];

      let query = `
        SELECT 
          b.id AS belt_id,
          b.name AS belt_name,
          b.Unit AS unit_id,
          p.id AS product_id,
          p.name AS product_name,
          p.code AS product_code,
          DATE(be.created_at) AS production_date,
          SUM(be.BoxCount) AS total_boxes,
          SUM(be.BoxCount * p.pieces) AS total_pieces,
          COUNT(be.id) AS entries_count
        FROM BeltEntries be
        JOIN Belt b ON be.belt_id = b.id
        JOIN products p ON be.production_id = p.id
        WHERE DATE(be.created_at) BETWEEN ? AND ?
      `;
      const params = [queryStartDate, queryEndDate];

      if (unitId) {
        query += ' AND b.Unit = ?';
        params.push(unitId);
      }
      if (beltId) {
        query += ' AND b.id = ?';
        params.push(beltId);
      }
      if (productId) {
        query += ' AND p.id = ?';
        params.push(productId);
      }
      query += `
        GROUP BY b.id, p.id, DATE(be.created_at)
        ORDER BY production_date DESC, b.name, p.name
      `;
      if (beltId && unitId) {
        res.status(500).json({ error: 'Belt ID and Unit ID is not filled.' });
        return;
      }
      const [results] = await pool.query(query, params);

      // Compose data: date > belts > products
      const response = {
        filters: { unitId, startDate: queryStartDate, endDate: queryEndDate, beltId, productId },
        summary: { total_boxes: 0, total_pieces: 0, total_entries: 0, days_count: 0 },
        daily_records: {}
      };
      const uniqueDates = new Set();

      results.forEach(row => {
        // For compat: row.production_date might be string or Date
        const dateStr = (row.production_date instanceof Date)
          ? row.production_date.toISOString().split('T')[0]
          : row.production_date;
        uniqueDates.add(dateStr);

        // Update summary
        response.summary.total_boxes += row.total_boxes;
        response.summary.total_pieces += row.total_pieces;
        response.summary.total_entries += row.entries_count;

        // Organize by date
        if (!response.daily_records[dateStr]) {
          response.daily_records[dateStr] = {
            date: dateStr,
            total_boxes: 0,
            total_pieces: 0,
            total_entries: 0,
            belts: {}
          };
        }
        response.daily_records[dateStr].total_boxes += row.total_boxes;
        response.daily_records[dateStr].total_pieces += row.total_pieces;
        response.daily_records[dateStr].total_entries += row.entries_count;

        // Organize by belt
        if (!response.daily_records[dateStr].belts[row.belt_id]) {
          response.daily_records[dateStr].belts[row.belt_id] = {
            belt_id: row.belt_id,
            belt_name: row.belt_name,
            total_boxes: 0,
            total_pieces: 0,
            total_entries: 0,
            products: []
          };
        }

        // Update belt summary
        response.daily_records[dateStr].belts[row.belt_id].total_boxes += row.total_boxes;
        response.daily_records[dateStr].belts[row.belt_id].total_pieces += row.total_pieces;
        response.daily_records[dateStr].belts[row.belt_id].total_entries += row.entries_count;

        // Product detail
        response.daily_records[dateStr].belts[row.belt_id].products.push({
          product_id: row.product_id,
          product_name: row.product_name,
          product_code: row.product_code,
          total_boxes: row.total_boxes,
          total_pieces: row.total_pieces,
          entries_count: row.entries_count
        });
      });

      response.summary.days_count = uniqueDates.size;
      res.json(response);

    } catch (error) {
      console.error('Error fetching production records:', error);
      res.status(500).json({ error: 'Failed to fetch production records' });
    }
  }

  // CSV Export endpoint (same logic, just send as CSV)
  static async exportProductionRecords(req, res) {
    try {
      const { unitId, startDate, endDate, beltId, productId } = req.query;
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultEndDate.getDate() - 10);
      const queryStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
      const queryEndDate = endDate || defaultEndDate.toISOString().split('T')[0];

      let query = `
        SELECT 
          b.id AS belt_id,
          b.name AS belt_name,
          p.id AS product_id,
          p.name AS product_name,
          p.code AS product_code,
          DATE(be.created_at) AS production_date,
          SUM(be.BoxCount) AS total_boxes,
          SUM(be.BoxCount * p.pieces) AS total_pieces,
          COUNT(be.id) AS entries_count
        FROM BeltEntries be
        JOIN Belt b ON be.belt_id = b.id
        JOIN products p ON be.production_id = p.id
        WHERE DATE(be.created_at) BETWEEN ? AND ?
      `;
      const params = [queryStartDate, queryEndDate];
      if (unitId) query += ' AND b.Unit = ?', params.push(unitId);
      if (beltId) query += ' AND b.id = ?', params.push(beltId);
      if (productId) query += ' AND p.id = ?', params.push(productId);

      query += `
        GROUP BY b.id, p.id, DATE(be.created_at)
        ORDER BY production_date DESC, b.name, p.name
      `;
      const [results] = await pool.query(query, params);

      // CSV header
      let csv = 'Date,Belt ID,Belt Name,Product ID,Product Name,Product Code,Boxes,Pieces,Entries\n';
      results.forEach(row => {
        const dateStr = (row.production_date instanceof Date)
          ? row.production_date.toISOString().split('T')[0]
          : row.production_date;
        csv += `"${dateStr}","${row.belt_id}","${row.belt_name}","${row.product_id}","${row.product_name}","${row.product_code}","${row.total_boxes}","${row.total_pieces}","${row.entries_count}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=production_records_${queryStartDate}_to_${queryEndDate}.csv`);
      res.send(csv);

    } catch (error) {
      console.error('Error exporting production records:', error);
      res.status(500).json({ error: 'Failed to export production records' });
    }
  }

  static async getDashboardData(req, res) {
    try {
      const { unitName } = req.query;
      console.log("Searching for unit:", unitName);

      if (!unitName) {
        return res.status(400).json({ error: "Unit name is required" });
      }

      // Get belts for the unit by name
      const [belts] = await pool.query(
        'SELECT id, name, CameraCount, CameraBarcode FROM Belt WHERE Unit = ?',
        [unitName]
      );

      // Get today's production for each belt
      const today = new Date().toISOString().split('T')[0];
      const [production] = await pool.query(`
        SELECT 
          b.id AS belt_id,
          p.id AS product_id,
          p.name AS product_name,
          p.code AS product_code,
          SUM(be.BoxCount) AS total_boxes,
          SUM(be.BoxCount * p.pieces) AS total_pieces
        FROM BeltEntries be
        JOIN Belt b ON be.belt_id = b.id
        JOIN products p ON be.production_id = p.id
        WHERE b.Unit = ? AND DATE(be.created_at) = ?
        GROUP BY b.id, p.id
        ORDER BY b.id, p.name
      `, [unitName, today]);

      // Organize production by belt
      const productionByBelt = {};
      production.forEach(row => {
        if (!productionByBelt[row.belt_id]) {
          productionByBelt[row.belt_id] = [];
        }
        productionByBelt[row.belt_id].push({
          product_id: row.product_id,
          product_name: row.product_name,
          product_code: row.product_code,
          total_boxes: row.total_boxes,
          total_pieces: row.total_pieces
        });
      });

      res.json({
        belts: belts.map(belt => ({
          ...belt,
          production: productionByBelt[belt.id] || []
        }))
      });
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  }

  static async getBeltsByUnit(req, res) {
    try {
      const { unitName } = req.params;
      console.log(unitName);
      const [belts] = await pool.query(
        'SELECT id, name FROM Belt WHERE Unit = ? ORDER BY name',
        [unitName]
      );
      console.log('Fetched units:', belts);
      res.json(belts);
    } catch (error) {
      console.error('Error fetching belts:', error);
      res.status(500).json({ error: 'Failed to fetch belts' });
    }
  }

  static async getAllUnits(req, res) {
    try {
      const [units] = await pool.query('SELECT id, name FROM Unit ORDER BY name');
      res.json(units);

    } catch (error) {
      console.error('Error fetching units:', error);
      res.status(500).json({ error: 'Failed to fetch units' });
    }
  }

  static async getAllProducts(req, res) {
    try {
      const [products] = await pool.query('SELECT id, name, code FROM products ORDER BY name');
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
}

export default ProductionController;