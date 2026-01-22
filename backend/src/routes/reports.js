const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { report_type } = req.query;
    let query = `
      SELECT r.*, u.username as generated_by_username
      FROM reports r
      LEFT JOIN users u ON r.generated_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (report_type) {
      params.push(report_type);
      query += ` AND r.report_type = $${params.length}`;
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT 50';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Generate sensor data report
router.post('/sensor-data', async (req, res) => {
  try {
    const { tank_id, sensor_type, start_date, end_date, file_type = 'pdf', user_id } = req.body;
    
    // Query sensor data
    let query = `
      SELECT sr.*, s.sensor_type, s.unit, t.name as tank_name
      FROM sensor_readings sr
      JOIN sensors s ON sr.sensor_id = s.id
      JOIN tanks t ON s.tank_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (tank_id) {
      params.push(tank_id);
      query += ` AND t.id = $${params.length}`;
    }
    
    if (sensor_type) {
      params.push(sensor_type);
      query += ` AND s.sensor_type = $${params.length}`;
    }
    
    if (start_date) {
      params.push(start_date);
      query += ` AND sr.timestamp >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND sr.timestamp <= $${params.length}`;
    }
    
    query += ' ORDER BY sr.timestamp DESC LIMIT 10000';
    
    const dataResult = await db.query(query, params);
    
    // Save report metadata
    const reportResult = await db.query(
      `INSERT INTO reports (report_type, title, generated_by, file_type, parameters)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        'sensor_data',
        `Reporte de Datos de Sensores - ${new Date().toLocaleDateString()}`,
        user_id,
        file_type,
        JSON.stringify({ tank_id, sensor_type, start_date, end_date })
      ]
    );
    
    res.json({
      report: reportResult.rows[0],
      data: dataResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate sensor data report' });
  }
});

// Generate inventory report
router.post('/inventory', async (req, res) => {
  try {
    const { category_id, start_date, end_date, file_type = 'pdf', user_id } = req.body;
    
    // Query inventory data
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
    
    query += ' ORDER BY ii.name ASC';
    
    const itemsResult = await db.query(query, params);
    
    // Query transactions
    let transQuery = `
      SELECT it.*, ii.name as item_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.item_id = ii.id
      WHERE 1=1
    `;
    const transParams = [];
    
    if (start_date) {
      transParams.push(start_date);
      transQuery += ` AND it.created_at >= $${transParams.length}`;
    }
    
    if (end_date) {
      transParams.push(end_date);
      transQuery += ` AND it.created_at <= $${transParams.length}`;
    }
    
    transQuery += ' ORDER BY it.created_at DESC LIMIT 1000';
    
    const transResult = await db.query(transQuery, transParams);
    
    // Save report metadata
    const reportResult = await db.query(
      `INSERT INTO reports (report_type, title, generated_by, file_type, parameters)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        'inventory',
        `Reporte de Inventario - ${new Date().toLocaleDateString()}`,
        user_id,
        file_type,
        JSON.stringify({ category_id, start_date, end_date })
      ]
    );
    
    res.json({
      report: reportResult.rows[0],
      items: itemsResult.rows,
      transactions: transResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

// Generate alerts report
router.post('/alerts', async (req, res) => {
  try {
    const { tank_id, severity, start_date, end_date, file_type = 'pdf', user_id } = req.body;
    
    // Query alerts
    let query = `
      SELECT a.*, t.name as tank_name, s.sensor_type
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
    
    if (severity) {
      params.push(severity);
      query += ` AND a.severity = $${params.length}`;
    }
    
    if (start_date) {
      params.push(start_date);
      query += ` AND a.created_at >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND a.created_at <= $${params.length}`;
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT 1000';
    
    const alertsResult = await db.query(query, params);
    
    // Save report metadata
    const reportResult = await db.query(
      `INSERT INTO reports (report_type, title, generated_by, file_type, parameters)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        'alerts',
        `Reporte de Alertas - ${new Date().toLocaleDateString()}`,
        user_id,
        file_type,
        JSON.stringify({ tank_id, severity, start_date, end_date })
      ]
    );
    
    res.json({
      report: reportResult.rows[0],
      alerts: alertsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate alerts report' });
  }
});

module.exports = router;
