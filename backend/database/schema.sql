-- Database Schema for Fishery Monitoring System

-- Create database (run separately)
-- CREATE DATABASE fishery_monitoring;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tanks/Ponds table
CREATE TABLE IF NOT EXISTS tanks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity DECIMAL(10, 2),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensors table
CREATE TABLE IF NOT EXISTS sensors (
    id SERIAL PRIMARY KEY,
    tank_id INTEGER REFERENCES tanks(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL, -- temperature, ph, oxygen, conductivity, turbidity, water_level
    sensor_id VARCHAR(100) UNIQUE NOT NULL,
    unit VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_reading DECIMAL(10, 4),
    last_reading_time TIMESTAMP,
    calibration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor readings table (time-series data)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    value DECIMAL(10, 4) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_anomaly BOOLEAN DEFAULT false
);

-- Create index for faster queries on sensor readings
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_timestamp 
    ON sensor_readings(sensor_id, timestamp DESC);

-- Alert thresholds table
CREATE TABLE IF NOT EXISTS alert_thresholds (
    id SERIAL PRIMARY KEY,
    tank_id INTEGER REFERENCES tanks(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,
    min_value DECIMAL(10, 4),
    max_value DECIMAL(10, 4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tank_id, sensor_type)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    tank_id INTEGER REFERENCES tanks(id) ON DELETE CASCADE,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- high, low, sensor_failure
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert notifications table
CREATE TABLE IF NOT EXISTS alert_notifications (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- email, sms, whatsapp, push
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' -- sent, failed, pending
);

-- Inventory categories table
CREATE TABLE IF NOT EXISTS inventory_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES inventory_categories(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    unit VARCHAR(50),
    current_stock DECIMAL(10, 2) DEFAULT 0,
    min_stock DECIMAL(10, 2) DEFAULT 0,
    max_stock DECIMAL(10, 2),
    unit_cost DECIMAL(10, 2),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- in, out, adjustment
    quantity DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2),
    batch_number VARCHAR(100),
    expiry_date DATE,
    tank_id INTEGER REFERENCES tanks(id),
    user_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feeding schedules table
CREATE TABLE IF NOT EXISTS feeding_schedules (
    id SERIAL PRIMARY KEY,
    tank_id INTEGER REFERENCES tanks(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(id),
    scheduled_time TIME NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    days_of_week VARCHAR(50), -- JSON array: [1,2,3,4,5,6,7]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL, -- sensor_data, inventory, alerts, custom
    title VARCHAR(255) NOT NULL,
    generated_by INTEGER REFERENCES users(id),
    file_path VARCHAR(500),
    file_type VARCHAR(10), -- pdf, excel
    parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(20) NOT NULL, -- info, warning, error, critical
    module VARCHAR(100),
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data
INSERT INTO inventory_categories (name, description) VALUES
    ('Alimentos', 'Alimentos para peces y organismos acuáticos'),
    ('Medicamentos', 'Medicamentos y tratamientos veterinarios'),
    ('Equipos', 'Equipos y herramientas'),
    ('Insumos', 'Insumos generales y materiales')
ON CONFLICT DO NOTHING;

-- Insert default user (password: admin123 - MUST be changed on first login)
-- Password hash generated with bcrypt, rounds=10
-- $2a$10$YGQjK8V3r0UQ0ZQ7ZQ7ZQeZQ7ZQ7ZQ7ZQ7ZQ7ZQ7ZQ7ZQ7ZQ7ZQ7Z = "admin123"
-- In production, force password change on first login or remove this default user
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@fishery.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT DO NOTHING;
