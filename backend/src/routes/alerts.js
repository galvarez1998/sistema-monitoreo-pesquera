const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { tank_id, is_resolved, severity } = req.query;
    let query = `
      SELECT a.*, t.name as tank_name, s.sensor_type, s.unit
      FROM alerts a
      LEFT JOIN tanks t ON a.tank_id = t.id
      LEFT JOIN sensors s ON a.sensor_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (tank_id) {
      params.push(tank_id);
      query += ` AND a.tank_id = $${params.length}`;
    }
    
    if (is_resolved !== undefined) {
      params.push(is_resolved === 'true');
      query += ` AND a.is_resolved = $${params.length}`;
    }
    
    if (severity) {
      params.push(severity);
      query += ` AND a.severity = $${params.length}`;
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT 100';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get single alert
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT a.*, t.name as tank_name, s.sensor_type, s.unit
       FROM alerts a
       LEFT JOIN tanks t ON a.tank_id = t.id
       LEFT JOIN sensors s ON a.sensor_id = s.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Resolve alert
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved_by } = req.body;
    
    const result = await db.query(
      'UPDATE alerts SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE id = $2 RETURNING *',
      [resolved_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.emit('alert_resolved', result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get alert thresholds
router.get('/thresholds/all', async (req, res) => {
  try {
    const { tank_id } = req.query;
    let query = `
      SELECT at.*, t.name as tank_name
      FROM alert_thresholds at
      LEFT JOIN tanks t ON at.tank_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (tank_id) {
      params.push(tank_id);
      query += ` AND at.tank_id = $${params.length}`;
    }
    
    query += ' ORDER BY at.tank_id, at.sensor_type';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch alert thresholds' });
  }
});

// Create or update alert threshold
router.post('/thresholds', async (req, res) => {
  try {
    const { tank_id, sensor_type, min_value, max_value, is_active } = req.body;
    
    const result = await db.query(
      `INSERT INTO alert_thresholds (tank_id, sensor_type, min_value, max_value, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tank_id, sensor_type)
       DO UPDATE SET min_value = $3, max_value = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tank_id, sensor_type, min_value, max_value, is_active !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create/update alert threshold' });
  }
});

// Delete alert threshold
router.delete('/thresholds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM alert_thresholds WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert threshold not found' });
    }
    
    res.json({ message: 'Alert threshold deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete alert threshold' });
  }
});

module.exports = router;
