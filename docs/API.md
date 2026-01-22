# API Documentation - Sistema de Monitoreo Pesquera

## Base URL
```
http://localhost:3000/api
```

## Autenticación

La mayoría de los endpoints requieren autenticación JWT. Incluir el token en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación

### POST /auth/login
Iniciar sesión en el sistema.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@fishery.com",
    "role": "admin",
    "phone": null
  }
}
```

### POST /auth/register
Registrar un nuevo usuario.

**Request:**
```json
{
  "username": "operator1",
  "email": "operator@fishery.com",
  "password": "secure_password",
  "role": "operator",
  "phone": "+1234567890"
}
```

### GET /auth/me
Obtener información del usuario actual.

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@fishery.com",
  "role": "admin",
  "phone": null,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

## 🏊 Estanques (Tanks)

### GET /tanks
Listar todos los estanques.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Estanque A1",
    "description": "Estanque principal",
    "capacity": 50000,
    "location": "Sector Norte",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /tanks/:id
Obtener un estanque específico.

### POST /tanks
Crear un nuevo estanque.

**Request:**
```json
{
  "name": "Estanque A2",
  "description": "Estanque secundario",
  "capacity": 30000,
  "location": "Sector Sur"
}
```

### PUT /tanks/:id
Actualizar un estanque.

### DELETE /tanks/:id
Eliminar un estanque.

### GET /tanks/:id/stats
Obtener estadísticas de un estanque.

**Response:**
```json
{
  "sensors": [
    {
      "id": 1,
      "sensor_type": "temperature",
      "unit": "°C",
      "last_reading": 25.5,
      "last_reading_time": "2024-01-01T12:00:00.000Z"
    }
  ],
  "active_alerts": 2
}
```

---

## 📡 Sensores (Sensors)

### GET /sensors
Listar sensores (con filtros opcionales).

**Query Parameters:**
- `tank_id` - Filtrar por estanque
- `sensor_type` - Filtrar por tipo (temperature, ph, oxygen, etc.)

**Response:**
```json
[
  {
    "id": 1,
    "tank_id": 1,
    "tank_name": "Estanque A1",
    "sensor_type": "temperature",
    "sensor_id": "TEMP_001",
    "unit": "°C",
    "is_active": true,
    "last_reading": 25.5,
    "last_reading_time": "2024-01-01T12:00:00.000Z"
  }
]
```

### POST /sensors/:id/readings
**[Endpoint para dispositivos IoT]** Enviar una lectura de sensor.

**Request:**
```json
{
  "value": 25.5
}
```

**Response:**
```json
{
  "id": 12345,
  "sensor_id": 1,
  "value": 25.5,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "is_anomaly": false
}
```

**Nota:** Este endpoint:
- Actualiza la última lectura del sensor
- Verifica umbrales de alerta
- Genera alertas automáticas si es necesario
- Emite eventos en tiempo real vía WebSocket

### GET /sensors/:id/readings
Obtener lecturas históricas de un sensor.

**Query Parameters:**
- `start_date` - Fecha inicio (ISO 8601)
- `end_date` - Fecha fin (ISO 8601)
- `limit` - Cantidad máxima de resultados (default: 100)
- `offset` - Offset para paginación (default: 0)

### GET /sensors/:id/readings/aggregate
Obtener datos agregados de un sensor (para gráficos).

**Query Parameters:**
- `interval` - minute, hour, day (default: hour)
- `start_date` - Fecha inicio
- `end_date` - Fecha fin

**Response:**
```json
[
  {
    "time_bucket": "2024-01-01T12:00:00.000Z",
    "avg_value": 25.3,
    "min_value": 24.8,
    "max_value": 25.9,
    "count": 60
  }
]
```

---

## 🔔 Alertas (Alerts)

### GET /alerts
Listar alertas.

**Query Parameters:**
- `tank_id` - Filtrar por estanque
- `is_resolved` - true/false
- `severity` - low, medium, high, critical

**Response:**
```json
[
  {
    "id": 1,
    "tank_id": 1,
    "tank_name": "Estanque A1",
    "sensor_id": 1,
    "sensor_type": "temperature",
    "alert_type": "high",
    "message": "Temperatura está por encima del umbral máximo (32°C > 30°C)",
    "severity": "high",
    "is_resolved": false,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
]
```

### PUT /alerts/:id/resolve
Resolver una alerta.

**Request:**
```json
{
  "resolved_by": 1
}
```

### GET /alerts/thresholds/all
Obtener umbrales de alerta configurados.

**Query Parameters:**
- `tank_id` - Filtrar por estanque (opcional)

**Response:**
```json
[
  {
    "id": 1,
    "tank_id": 1,
    "tank_name": "Estanque A1",
    "sensor_type": "temperature",
    "min_value": 20,
    "max_value": 30,
    "is_active": true
  }
]
```

### POST /alerts/thresholds
Crear o actualizar umbral de alerta.

**Request:**
```json
{
  "tank_id": 1,
  "sensor_type": "temperature",
  "min_value": 20,
  "max_value": 30,
  "is_active": true
}
```

---

## 📦 Inventario (Inventory)

### GET /inventory/items
Listar items de inventario.

**Query Parameters:**
- `category_id` - Filtrar por categoría
- `low_stock` - true (items con stock bajo)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Alimento Balanceado 20kg",
    "category_id": 1,
    "category_name": "Alimentos",
    "supplier_id": 1,
    "supplier_name": "Proveedor XYZ",
    "sku": "ALI-001",
    "unit": "kg",
    "current_stock": 500,
    "min_stock": 100,
    "max_stock": 1000,
    "unit_cost": 25.50,
    "location": "Bodega A"
  }
]
```

### POST /inventory/items
Crear un item de inventario.

### PUT /inventory/items/:id
Actualizar un item.

### GET /inventory/transactions
Obtener transacciones de inventario.

**Query Parameters:**
- `item_id` - Filtrar por item
- `transaction_type` - in, out, adjustment
- `start_date` - Fecha inicio
- `end_date` - Fecha fin

**Response:**
```json
[
  {
    "id": 1,
    "item_id": 1,
    "item_name": "Alimento Balanceado 20kg",
    "transaction_type": "out",
    "quantity": 50,
    "unit_cost": 25.50,
    "batch_number": "BATCH-001",
    "expiry_date": "2025-12-31",
    "tank_id": 1,
    "tank_name": "Estanque A1",
    "user_id": 1,
    "username": "admin",
    "notes": "Alimentación semanal",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
]
```

### POST /inventory/transactions
Registrar una transacción (entrada/salida).

**Request:**
```json
{
  "item_id": 1,
  "transaction_type": "out",
  "quantity": 50,
  "unit_cost": 25.50,
  "batch_number": "BATCH-001",
  "tank_id": 1,
  "user_id": 1,
  "notes": "Alimentación diaria"
}
```

**Tipos de transacción:**
- `in` - Entrada (incrementa stock)
- `out` - Salida (decrementa stock)
- `adjustment` - Ajuste (establece stock al valor especificado)

### GET /inventory/categories
Listar categorías de inventario.

### GET /inventory/suppliers
Listar proveedores.

### POST /inventory/suppliers
Crear un proveedor.

---

## 📊 Reportes (Reports)

### POST /reports/sensor-data
Generar reporte de datos de sensores.

**Request:**
```json
{
  "tank_id": 1,
  "sensor_type": "temperature",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "file_type": "pdf",
  "user_id": 1
}
```

**Response:**
```json
{
  "report": {
    "id": 1,
    "report_type": "sensor_data",
    "title": "Reporte de Datos de Sensores - 01/01/2024",
    "generated_by": 1,
    "file_type": "pdf",
    "created_at": "2024-01-01T12:00:00.000Z"
  },
  "data": [...]
}
```

### POST /reports/inventory
Generar reporte de inventario.

### POST /reports/alerts
Generar reporte de alertas.

---

## 🔌 WebSocket Events

El sistema emite eventos en tiempo real vía Socket.IO:

### Conectar
```javascript
const socket = io('http://localhost:3000');
```

### Suscribirse a un estanque
```javascript
socket.emit('subscribe_tank', tankId);
```

### Eventos recibidos

**sensor_reading** - Nueva lectura de sensor
```javascript
socket.on('sensor_reading', (data) => {
  console.log(data);
  // {
  //   sensor_id: 1,
  //   sensor_type: "temperature",
  //   value: 25.5,
  //   unit: "°C",
  //   timestamp: "2024-01-01T12:00:00.000Z"
  // }
});
```

**new_alert** - Nueva alerta generada
```javascript
socket.on('new_alert', (alert) => {
  console.log(alert);
});
```

**alert_resolved** - Alerta resuelta
```javascript
socket.on('alert_resolved', (alert) => {
  console.log(alert);
});
```

---

## 📝 Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado
- `400 Bad Request` - Error en la solicitud
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

## 🔒 Roles de Usuario

- `admin` - Acceso completo
- `operator` - Operador (lectura y escritura limitada)
- `viewer` - Solo lectura

## 🌐 CORS

El API acepta solicitudes desde:
- `http://localhost:3001` (desarrollo)
- Configurar en producción con la variable `FRONTEND_URL`

---

## Ejemplos de Uso

### Ejemplo: Enviar lectura desde sensor IoT
```bash
curl -X POST http://localhost:3000/api/sensors/1/readings \
  -H "Content-Type: application/json" \
  -d '{"value": 25.5}'
```

### Ejemplo: Obtener alertas activas
```bash
curl -X GET "http://localhost:3000/api/alerts?is_resolved=false" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo: Registrar salida de inventario
```bash
curl -X POST http://localhost:3000/api/inventory/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "item_id": 1,
    "transaction_type": "out",
    "quantity": 50,
    "tank_id": 1,
    "user_id": 1
  }'
```
