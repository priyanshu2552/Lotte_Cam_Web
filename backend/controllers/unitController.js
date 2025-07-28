import pool from "../config/db.js";

class UnitController {
    static async getAllUnits(req, res) {
        try {
            // Make sure to use the correct database name (Lotte.Unit)
            const [rows] = await pool.query('SELECT * FROM Lotte.Unit');

            // Send successful response
            return res.status(200).json({
                success: true,
                data: rows
            });

        } catch (error) {
            console.error('Error fetching units:', error);

            // Send error response
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch units',
                error: error.message
            });
        }
    }
    static async createUnit(req, res) {
        const { name } = req.body;
        try {
            const [result] = await pool.query(
                'insert into Unit (name) values (?)', [name]
            );
            res.status(201).json({ id: result.insertId, name });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to create unit" })
        }
    }
    static async deleteUnit(req, res) {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM Unit WHERE id = ?', [id]);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete unit' });
        }
    }

}
export default UnitController;