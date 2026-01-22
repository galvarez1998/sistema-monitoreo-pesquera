const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all sensors
router.get('/', async (req, res) => {
  try {
    const { tank_id, sensor_type } = req.query;
    let query = 'SELECT s.*, t.name as tank_name FROM sensors s LEFT JOIN tanks t ON s.tank_id = t.id WHERE 1=1';
    const params = [];
    
    if (tank_id) {
      params.push(tank_id);
      query += ` AND s.tank_id = $${params.length}`;
    }
    
    if (sensor_type) {
      params.push(sensor_type);
      query += ` AND s.sensor_type = $${params.length}`;
    }
    
    query += ' ORDER BY s.id ASC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sensors' });
  }
});

// Get single sensor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT s.*, t.name as tank_name FROM sensors s LEFT JOIN tanks t ON s.tank_id = t.id WHERE s.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sensor' });
  }
});

// Create new sensor
router.post('/', async (req, res) => {
  try {
    const { tank_id, sensor_type, sensor_id, unit } = req.body;
    
    const result = await db.query(
      'INSERT INTO sensors (tank_id, sensor_type, sensor_id, unit) VALUES ($1, $2, $3, $4) RETURNING *',
      [tank_id, sensor_type, sensor_id, unit]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create sensor' });
  }
});

// Update sensor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tank_id, sensor_type, sensor_id, unit, is_active, calibration_date } = req.body;
    
    const result = await db.query(
      'UPDATE sensors SET tank_id = $1, sensor_type = $2, sensor_id = $3, unit = $4, is_active = $5, calibration_date = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [tank_id, sensor_type, sensor_id, unit, is_active, calibration_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update sensor' });
  }
});

// Delete sensor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM sensors WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    res.json({ message: 'Sensor deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete sensor' });
  }
});

// Post sensor reading (IoT devices use this endpoint)
router.post('/:id/readings', async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    
    // Check if sensor exists
    const sensorResult = await db.query(
      'SELECT * FROM sensors WHERE id = $1',
      [id]
    );
    
    if (sensorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    const sensor = sensorResult.rows[0];
    
    // Insert reading
    const readingResult = await db.query(
      'INSERT INTO sensor_readings (sensor_id, value) VALUES ($1, $2) RETURNING *',
      [id, value]
    );
    
    // Update sensor's last reading
    await db.query(
      'UPDATE sensors SET last_reading = $1, last_reading_time = CURRENT_TIMESTAMP WHERE id = $2',
      [value, id]
    );
    
    // Check if alert thresholds are violated
    const thresholdResult = await db.query(
      'SELECT * FROM alert_thresholds WHERE tank_id = $1 AND sensor_type = $2 AND is_active = true',
      [sensor.tank_id, sensor.sensor_type]
    );
    
    if (thresholdResult.rows.length > 0) {
      const threshold = thresholdResult.rows[0];
      let alertType = null;
      let message = null;
      
      if (threshold.min_value !== null && value < threshold.min_value) {
        alertType = 'low';
        message = `${sensor.sensor_type} está por debajo del umbral mínimo (${value} ${sensor.unit} < ${threshold.min_value} ${sensor.unit})`;
      } else if (threshold.max_value !== null && value > threshold.max_value) {
        alertType = 'high';
        message = `${sensor.sensor_type} está por encima del umbral máximo (${value} ${sensor.unit} > ${threshold.max_value} ${sensor.unit})`;
      }
      
      if (alertType) {
        // Check if there's already an unresolved alert for this sensor
        const existingAlert = await db.query(
          'SELECT * FROM alerts WHERE sensor_id = $1 AND is_resolved = false ORDER BY created_at DESC LIMIT 1',
          [id]
        );
        
        if (existingAlert.rows.length === 0) {
          // Create new alert
          const alertResult = await db.query(
            'INSERT INTO alerts (tank_id, sensor_id, alert_type, message, severity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [sensor.tank_id, id, alertType, message, 'high']
          );
          
          // Emit real-time alert via Socket.IO
          const io = req.app.get('io');
          io.to(`tank_${sensor.tank_id}`).emit('new_alert', alertResult.rows[0]);
          io.emit('new_alert', alertResult.rows[0]); // Also emit to all connected clients
        }
      }
    }
    
    // Emit real-time reading via Socket.IO
    const io = req.app.get('io');
    io.to(`tank_${sensor.tank_id}`).emit('sensor_reading', {
      sensor_id: id,
      sensor_type: sensor.sensor_type,
      value: value,
      unit: sensor.unit,
      timestamp: readingResult.rows[0].timestamp
    });
    
    res.status(201).json(readingResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create sensor reading' });
  }
});

// Get sensor readings with pagination and filtering
router.get('/:id/readings', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM sensor_readings WHERE sensor_id = $1';
    const params = [id];
    
    if (start_date) {
      params.push(start_date);
      query += ` AND timestamp >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND timestamp <= $${params.length}`;
    }
    
    query += ' ORDER BY timestamp DESC';
    
    params.push(limit);
    query += ` LIMIT $${params.length}`;
    
    params.push(offset);
    query += ` OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
});

// Get aggregated sensor data (for charts)
router.get('/:id/readings/aggregate', async (req, res) => {
  try {
    const { id } = req.params;
    const { interval = 'hour', start_date, end_date } = req.query;
    
    let truncFunction;
    switch (interval) {
      case 'minute':
        truncFunction = "date_trunc('minute', timestamp)";
        break;
      case 'hour':
        truncFunction = "date_trunc('hour', timestamp)";
        break;
      case 'day':
        truncFunction = "date_trunc('day', timestamp)";
        break;
      default:
        truncFunction = "date_trunc('hour', timestamp)";
    }
    
    let query = `
      SELECT 
        ${truncFunction} as time_bucket,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count
      FROM sensor_readings
      WHERE sensor_id = $1
    `;
    const params = [id];
    
    if (start_date) {
      params.push(start_date);
      query += ` AND timestamp >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND timestamp <= $${params.length}`;
    }
    
    query += ' GROUP BY time_bucket ORDER BY time_bucket DESC LIMIT 1000';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch aggregated sensor data' });
  }
});

module.exports = router;
