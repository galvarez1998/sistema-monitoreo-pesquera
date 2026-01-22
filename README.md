# Sistema Integrado de Monitoreo, Gestión y Automatización para Pesquera 🐟

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Sistema completo para monitorear en tiempo real las condiciones del agua, gestionar inventarios de insumos y producción, y sentar las bases tecnológicas para la automatización de tareas operativas.

## 🌟 Características Principales

### 🌊 Monitoreo en Tiempo Real
- Sensores IoT para temperatura, pH, oxígeno, conductividad, turbidez y nivel de agua
- Transmisión de datos en tiempo real vía WebSocket
- Dashboard interactivo con gráficos en vivo
- Sistema de alertas automáticas
- Notificaciones por Email, SMS y WhatsApp

### 📦 Gestión de Inventario
- Control de alimentos, medicamentos e insumos
- Registro de entradas/salidas con trazabilidad
- Alertas de stock mínimo
- Gestión de proveedores y lotes
- Reportes de consumo

### 🔔 Sistema de Alertas
- Umbrales configurables por estanque
- Alertas automáticas cuando los valores salen del rango seguro
- Múltiples canales de notificación
- Historial de alertas y resoluciones

### 📊 Reportes y Análisis
- Generación de reportes en PDF/Excel
- Análisis histórico de datos
- Comparación entre estanques
- Identificación de tendencias

### 🔮 Preparado para Automatización (Fase 2)
- Arquitectura escalable y modular
- APIs preparadas para control de equipos
- Base para automatización de aireadores, alimentación y bombas

## 🚀 Inicio Rápido

### Usando Docker (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/galvarez1998/sistema-monitoreo-pesquera.git
cd sistema-monitoreo-pesquera

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones

# Iniciar servicios
docker-compose up -d

# Acceder a la aplicación
# Frontend: http://localhost:3001
# Backend: http://localhost:3000
# Usuario: admin / Contraseña: admin123
```

### Instalación Manual

Ver la [Guía de Instalación Completa](docs/INSTALLATION.md) para instrucciones detalladas.

## 📖 Documentación

- [Documentación Completa](docs/README.md)
- [Guía de Instalación](docs/INSTALLATION.md)
- [API Documentation](docs/API.md)
- [Configuración de Sensores IoT](docs/IOT_SETUP.md)

## 🏗️ Arquitectura

```
Frontend (React + Material-UI)
    ↓ HTTP/WebSocket
Backend API (Node.js + Express + Socket.IO)
    ↓ PostgreSQL
Base de Datos (Sensores, Alertas, Inventario)
    ↑ MQTT/HTTP
Dispositivos IoT (ESP32, Arduino, Raspberry Pi)
```

## 🛠️ Tecnologías

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL 15+
- Socket.IO
- JWT Authentication

**Frontend:**
- React 18
- Material-UI
- Recharts
- Axios
- Socket.IO Client

**IoT:**
- ESP32 / Arduino
- Raspberry Pi
- MQTT Protocol

**DevOps:**
- Docker & Docker Compose
- Nginx

## 📋 Requisitos del Sistema

- **Servidor:** Ubuntu 20.04+, 4GB RAM, 20GB disco
- **Desarrollo:** Node.js 18+, PostgreSQL 15+
- **IoT:** ESP32/Arduino/Raspberry Pi con WiFi

## 🔌 API Endpoints Principales

```
POST   /api/auth/login              - Iniciar sesión
GET    /api/tanks                   - Listar estanques
POST   /api/sensors/:id/readings    - Enviar lectura de sensor (IoT)
GET    /api/alerts                  - Obtener alertas
POST   /api/inventory/transactions  - Registrar transacción de inventario
POST   /api/reports/sensor-data     - Generar reporte
GET    /health                      - Health check del sistema
GET    /metrics                     - Métricas del sistema
```

Ver [API Documentation](docs/API.md) para la lista completa.

## 🔐 Seguridad y Buenas Prácticas

### Seguridad
- Autenticación JWT con manejo robusto de tokens
- Contraseñas hasheadas (bcrypt)
- Validación de datos (Joi)
- Protección CORS configurable
- Variables de entorno para secretos
- Helmet.js para headers de seguridad
- Rate limiting para protección contra DDoS
- Validación estricta de variables de entorno
- Límites de tamaño en request body

### Resiliencia
- Reintentos automáticos en conexiones de BD
- Graceful shutdown para zero-downtime deploys
- Connection pooling optimizado (2-20 conexiones)
- Circuit breaker para manejo de fallos
- Request timeout (30s)
- Statement timeout en queries (30s)

### Observabilidad
- Structured logging con Winston
- Request correlation IDs para trazabilidad
- Health checks con estado de dependencias
- Endpoint de métricas para monitoreo
- Logging mejorado de errores con contexto

### Performance
- Compresión HTTP (reduce bandwidth 70%)
- Connection pooling eficiente
- Respuestas optimizadas

Ver [Documentación de Buenas Prácticas](docs/BEST_PRACTICES.md) para detalles completos.

## 📈 Roadmap - Fase 2 (Automatización)

- [ ] Control automático de aireadores
- [ ] Dosificación inteligente de alimento
- [ ] Control de bombas por nivel de agua
- [ ] Alertas predictivas con IA
- [ ] Optimización de consumo eléctrico
- [ ] Integración con sistemas externos

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para reportar problemas o sugerir mejoras, crear un [issue](https://github.com/galvarez1998/sistema-monitoreo-pesquera/issues).

## 👥 Autores

Sistema desarrollado para mejorar la eficiencia operativa y reducir riesgos en la producción acuícola.

---

**Versión:** 1.0.0  
**Última actualización:** 2024

## 🎯 Beneficios del Sistema

- ✅ Reducción de mortalidad por control inmediato de parámetros
- ✅ Mejor toma de decisiones basada en datos
- ✅ Menor costo operativo por automatización progresiva
- ✅ Mayor trazabilidad para normas sanitarias
- ✅ Ahorro de alimento y energía
- ✅ Control de inventarios preciso en tiempo real
- ✅ Mayor productividad del personal
