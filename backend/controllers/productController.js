import pool from "../config/db.js";
class ProductController {
    static async getAllProducts(req, res) {
        try {
            const [products] = await pool.query('select * from products');
            res.json(products);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Failed to fetch products" });
        }
    }
    static async createProduct(req, res) {
        const { name, code, pieces } = req.body;
        try {
            const [result] = await pool.query(
                'insert into products (name,code,pieces) values (?,?,?)',
                [name, code, pieces]
            );
            res.status(201).json({ id: result.insertId, ...req.body });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
    static async updateProduct(req, res) {
        const { id } = req.params;
        const { name, code, pieces } = req.body;
        try {
            await pool.query(
                'update products set name=?, code=?,pieces=? where id=?', [name, code, pieces, id]);
            res.json({ id, ...req.body });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to update product" });
        }
    }

    static async deleteProduct(req, res) {
        const { id } = req.params;
        try {
            await pool.query('delete from products where id=?', [id]);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
}
export default ProductController;