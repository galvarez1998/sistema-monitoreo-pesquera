const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all tanks
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tanks ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tanks' });
  }
});

// Get single tank
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM tanks WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tank not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tank' });
  }
});

// Create new tank
router.post('/', async (req, res) => {
  try {
    const { name, description, capacity, location } = req.body;
    
    const result = await db.query(
      'INSERT INTO tanks (name, description, capacity, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, capacity, location]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tank' });
  }
});

// Update tank
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, capacity, location, is_active } = req.body;
    
    const result = await db.query(
      'UPDATE tanks SET name = $1, description = $2, capacity = $3, location = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description, capacity, location, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tank not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tank' });
  }
});

// Delete tank
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM tanks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tank not found' });
    }
    
    res.json({ message: 'Tank deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete tank' });
  }
});

// Get tank statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get latest readings from all sensors in this tank
    const sensorsResult = await db.query(`
      SELECT s.id, s.sensor_type, s.unit, s.last_reading, s.last_reading_time
      FROM sensors s
      WHERE s.tank_id = $1 AND s.is_active = true
      ORDER BY s.sensor_type
    `, [id]);
    
    // Get active alerts count
    const alertsResult = await db.query(`
      SELECT COUNT(*) as alert_count
      FROM alerts
      WHERE tank_id = $1 AND is_resolved = false
    `, [id]);
    
    res.json({
      sensors: sensorsResult.rows,
      active_alerts: parseInt(alertsResult.rows[0].alert_count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tank statistics' });
  }
});

module.exports = router;
