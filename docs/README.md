# Sistema Integrado de Monitoreo, Gestión y Automatización para Pesquera

Sistema completo para monitorear en tiempo real las condiciones del agua, gestionar inventarios y preparar la infraestructura para automatización futura.

## 📋 Características Principales

### 🌊 Módulo de Sensores y Monitoreo en Tiempo Real
- Monitoreo de parámetros del agua:
  - Temperatura
  - pH
  - Oxígeno disuelto
  - Conductividad
  - Turbidez
  - Nivel de agua
- Transmisión de datos en tiempo real vía WebSocket
- Sistema de alertas automáticas
- Notificaciones por correo, SMS y WhatsApp
- Registro histórico completo
- Comparación entre estanques

### 💻 Plataforma Web de Monitoreo
- Dashboard con gráficos en tiempo real
- Indicadores por estanque/área
- Historial de datos
- Límites configurables
- Generación de reportes (PDF/Excel)
- Sistema de alertas y notificaciones
- Interfaz responsive (móvil y escritorio)

### 📦 Módulo de Inventario
- Control de alimentos, medicamentos e insumos
- Gestión de proveedores
- Registro de entradas/salidas
- Alertas de stock mínimo
- Trazabilidad completa
- Reportes de consumo

### 🔮 Preparación para Automatización (Fase 2)
- Arquitectura escalable
- APIs para control de equipos
- Sistema de eventos para automatización
- Base de datos optimizada para IA

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  Dashboard | Sensores | Alertas | Inventario | Reportes │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  REST API | WebSocket | Alertas | Reportes              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Base de Datos (PostgreSQL)                  │
│  Sensores | Lecturas | Alertas | Inventario             │
└─────────────────────────────────────────────────────────┘
                     ▲
                     │ MQTT/HTTP
┌────────────────────┴────────────────────────────────────┐
│           Dispositivos IoT (ESP32/Arduino/RPi)          │
│  Sensores de Temperatura | pH | Oxígeno | etc.         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Docker y Docker Compose (recomendado)
- O manualmente: Node.js 18+, PostgreSQL 15+

### Método 1: Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone https://github.com/galvarez1998/sistema-monitoreo-pesquera.git
cd sistema-monitoreo-pesquera
```

2. **Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones
```

3. **Iniciar los servicios**
```bash
docker-compose up -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Usuario por defecto: `admin` / `admin123`

### Método 2: Instalación Manual

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### Base de Datos
```bash
psql -U postgres
CREATE DATABASE fishery_monitoring;
\c fishery_monitoring
\i backend/database/schema.sql
```

## 📡 Configuración de Sensores IoT

### ESP32
1. Instalar Arduino IDE y soporte para ESP32
2. Abrir `iot-clients/esp32_sensor_client.py` o `arduino_sensor_client.ino`
3. Configurar credenciales WiFi y URL del servidor
4. Cargar el código al dispositivo

### Raspberry Pi
```bash
cd iot-clients
pip3 install requests
python3 raspberry_pi_sensor_client.py
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener usuario actual

### Estanques
- `GET /api/tanks` - Listar estanques
- `POST /api/tanks` - Crear estanque
- `GET /api/tanks/:id` - Obtener estanque
- `PUT /api/tanks/:id` - Actualizar estanque
- `DELETE /api/tanks/:id` - Eliminar estanque
- `GET /api/tanks/:id/stats` - Estadísticas del estanque

### Sensores
- `GET /api/sensors` - Listar sensores
- `POST /api/sensors` - Crear sensor
- `GET /api/sensors/:id` - Obtener sensor
- `PUT /api/sensors/:id` - Actualizar sensor
- `POST /api/sensors/:id/readings` - Enviar lectura (IoT)
- `GET /api/sensors/:id/readings` - Obtener lecturas
- `GET /api/sensors/:id/readings/aggregate` - Datos agregados

### Alertas
- `GET /api/alerts` - Listar alertas
- `GET /api/alerts/:id` - Obtener alerta
- `PUT /api/alerts/:id/resolve` - Resolver alerta
- `GET /api/alerts/thresholds/all` - Obtener umbrales
- `POST /api/alerts/thresholds` - Crear/actualizar umbral

### Inventario
- `GET /api/inventory/items` - Listar items
- `POST /api/inventory/items` - Crear item
- `PUT /api/inventory/items/:id` - Actualizar item
- `POST /api/inventory/transactions` - Registrar transacción
- `GET /api/inventory/categories` - Listar categorías
- `GET /api/inventory/suppliers` - Listar proveedores

### Reportes
- `GET /api/reports` - Listar reportes
- `POST /api/reports/sensor-data` - Generar reporte de sensores
- `POST /api/reports/inventory` - Generar reporte de inventario
- `POST /api/reports/alerts` - Generar reporte de alertas

## 🔔 Sistema de Alertas

El sistema genera alertas automáticas cuando:
- Un sensor excede los umbrales configurados
- El stock de un item está por debajo del mínimo
- Un sensor deja de responder

Las notificaciones se envían por:
- Email
- SMS (Twilio)
- WhatsApp (Twilio)
- Notificaciones en tiempo real (WebSocket)

## 📊 Dashboard y Visualización

El dashboard muestra:
- Estado general del sistema
- Gráficos de sensores en tiempo real
- Alertas activas
- Estado de estanques
- Niveles de inventario

## 🔐 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Validación de datos de entrada
- Protección CORS
- Variables de entorno para secretos

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📈 Escalabilidad y Fase 2

El sistema está diseñado para soportar:
- Automatización de aireadores
- Dosificación automática de alimento
- Control de bombas
- Alertas predictivas con IA
- Optimización de consumo eléctrico

### Integración Futura
- Endpoints para control de actuadores
- Sistema de eventos para automatización
- APIs para integración con sistemas externos
- Modelos de ML para predicción

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js 18+
- Express.js
- PostgreSQL
- Socket.IO (WebSocket)
- JWT Authentication
- Nodemailer (Email)

### Frontend
- React 18
- Material-UI
- Recharts (Gráficos)
- Axios
- Socket.IO Client

### IoT
- ESP32
- Arduino
- Raspberry Pi
- MQTT Protocol

### DevOps
- Docker
- Docker Compose
- Nginx

## 📝 Mantenimiento

### Backup de Base de Datos
```bash
docker exec fishery_postgres pg_dump -U postgres fishery_monitoring > backup.sql
```

### Restaurar Base de Datos
```bash
docker exec -i fishery_postgres psql -U postgres fishery_monitoring < backup.sql
```

### Ver Logs
```bash
# Backend logs
docker logs fishery_backend

# Frontend logs
docker logs fishery_frontend

# Database logs
docker logs fishery_postgres
```

## 📚 Documentación Adicional

- **[API Documentation](API.md)** - Referencia completa de endpoints
- **[Installation Guide](INSTALLATION.md)** - Guía de instalación detallada
- **[IoT Setup](IOT_SETUP.md)** - Configuración de sensores IoT
- **[Best Practices](BEST_PRACTICES.md)** - Mejores prácticas de programación implementadas

## 🤝 Soporte y Contribuciones

Para reportar problemas o sugerir mejoras, crear un issue en el repositorio.

## 📄 Licencia

MIT License

## 👥 Equipo de Desarrollo

Sistema desarrollado para mejorar la eficiencia operativa y reducir riesgos en la producción acuícola.

---

**Versión:** 1.0.0  
**Fecha:** 2024
