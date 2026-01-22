const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all inventory items
router.get('/items', async (req, res) => {
  try {
    const { category_id, low_stock } = req.query;
    let query = `
      SELECT ii.*, ic.name as category_name, s.name as supplier_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      LEFT JOIN suppliers s ON ii.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category_id) {
      params.push(category_id);
      query += ` AND ii.category_id = $${params.length}`;
    }
    
    if (low_stock === 'true') {
      query += ' AND ii.current_stock <= ii.min_stock';
    }
    
    query += ' ORDER BY ii.name ASC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get single inventory item
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT ii.*, ic.name as category_name, s.name as supplier_name
       FROM inventory_items ii
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       LEFT JOIN suppliers s ON ii.supplier_id = s.id
       WHERE ii.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create inventory item
router.post('/items', async (req, res) => {
  try {
    const { category_id, supplier_id, name, description, sku, unit, min_stock, max_stock, unit_cost, location } = req.body;
    
    const result = await db.query(
      `INSERT INTO inventory_items (category_id, supplier_id, name, description, sku, unit, min_stock, max_stock, unit_cost, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [category_id, supplier_id, name, description, sku, unit, min_stock, max_stock, unit_cost, location]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, supplier_id, name, description, sku, unit, current_stock, min_stock, max_stock, unit_cost, location } = req.body;
    
    const result = await db.query(
      `UPDATE inventory_items SET 
       category_id = $1, supplier_id = $2, name = $3, description = $4, sku = $5, unit = $6,
       current_stock = $7, min_stock = $8, max_stock = $9, unit_cost = $10, location = $11,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [category_id, supplier_id, name, description, sku, unit, current_stock, min_stock, max_stock, unit_cost, location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete inventory item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM inventory_items WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get inventory transactions
router.get('/transactions', async (req, res) => {
  try {
    const { item_id, transaction_type, start_date, end_date } = req.query;
    let query = `
      SELECT it.*, ii.name as item_name, ii.unit, t.name as tank_name, u.username
      FROM inventory_transactions it
      LEFT JOIN inventory_items ii ON it.item_id = ii.id
      LEFT JOIN tanks t ON it.tank_id = t.id
      LEFT JOIN users u ON it.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (item_id) {
      params.push(item_id);
      query += ` AND it.item_id = $${params.length}`;
    }
    
    if (transaction_type) {
      params.push(transaction_type);
      query += ` AND it.transaction_type = $${params.length}`;
    }
    
    if (start_date) {
      params.push(start_date);
      query += ` AND it.created_at >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND it.created_at <= $${params.length}`;
    }
    
    query += ' ORDER BY it.created_at DESC LIMIT 100';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create inventory transaction (in/out/adjustment)
router.post('/transactions', async (req, res) => {
  try {
    const { item_id, transaction_type, quantity, unit_cost, batch_number, expiry_date, tank_id, user_id, notes } = req.body;
    
    // Get current stock
    const itemResult = await db.query('SELECT current_stock FROM inventory_items WHERE id = $1', [item_id]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const currentStock = parseFloat(itemResult.rows[0].current_stock);
    let newStock = currentStock;
    
    // Calculate new stock based on transaction type
    if (transaction_type === 'in') {
      newStock = currentStock + parseFloat(quantity);
    } else if (transaction_type === 'out') {
      newStock = currentStock - parseFloat(quantity);
      if (newStock < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    } else if (transaction_type === 'adjustment') {
      newStock = parseFloat(quantity);
    }
    
    // Create transaction
    const transactionResult = await db.query(
      `INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_cost, batch_number, expiry_date, tank_id, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [item_id, transaction_type, quantity, unit_cost, batch_number, expiry_date, tank_id, user_id, notes]
    );
    
    // Update item stock
    await db.query(
      'UPDATE inventory_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, item_id]
    );
    
    res.status(201).json(transactionResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Get inventory categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inventory_categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create inventory category
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const result = await db.query(
      'INSERT INTO inventory_categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Get suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create supplier
router.post('/suppliers', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    
    const result = await db.query(
      'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, contact_person, email, phone, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, address } = req.body;
    
    const result = await db.query(
      `UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, contact_person, email, phone, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

module.exports = router;
