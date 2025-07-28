import pool from "../config/db.js";

class BeltController {
    static async getAllBelts(req, res) {
        try {
            const { unitId } = req.query;
            let query = 'SELECT * FROM Belt';
            const params = [];

            if (unitId) {
                query += ' WHERE Unit = ?';
                params.push(Number(unitId)); // ✅ Ensure it's a number
            }

            const [belts] = await pool.query(query, params);
            res.json(belts);
        } catch (error) {
            console.error('Error in getAllBelts:', error);
            res.status(500).json({ error: "Failed to fetch the belts" });
        }
    }

    static async createBelts(req, res) {
        const { name, CameraCount, CameraBarcode, Unit } = req.body;
        try {
            const [result] = await pool.query(
                'insert into Belt (name,CameraCount,CameraBarcode,Unit) values (?,?,?,?)',
                [name, CameraCount, CameraBarcode, Unit]
            );
            res.status(201).json({ id: result.insertId, ...req.body });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create belt' });
        }
    }
    static async updateBelt(req, res) {
        const { id } = req.params;
        const { name, CameraCount, CameraBarcode, Unit } = req.body;
        try {
            await pool.query(
                'UPDATE Belt SET name = ?, CameraCount = ?, CameraBarcode = ?, Unit = ? WHERE id = ?',
                [name, CameraCount, CameraBarcode, Unit, id]
            );
            res.json({ id, ...req.body });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update belt' });
        }
    }

    // Delete a belt
    static async deleteBelt(req, res) {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM Belt WHERE id = ?', [id]);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete belt' });
        }
    }
}

export default BeltController;