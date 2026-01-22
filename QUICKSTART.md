# Guía de Inicio Rápido - Sistema de Monitoreo Pesquera

Este documento te ayudará a tener el sistema funcionando en menos de 10 minutos.

## 📋 Pre-requisitos

- Docker y Docker Compose instalados
- 4GB RAM disponible
- Puerto 3000, 3001, 5432, 1883 libres
- Git instalado

## 🚀 Pasos de Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/galvarez1998/sistema-monitoreo-pesquera.git
cd sistema-monitoreo-pesquera
```

### 2. Configurar Variables de Entorno

```bash
cp backend/.env.example backend/.env
```

**Opcional:** Edita `backend/.env` para personalizar (email, SMS, etc.). Para pruebas, los valores por defecto funcionan.

### 3. Iniciar el Sistema

```bash
docker-compose up -d
```

Esto iniciará:
- ✅ Base de datos PostgreSQL
- ✅ Backend API (Node.js)
- ✅ Frontend (React)
- ✅ MQTT Broker (Mosquitto)

### 4. Verificar que Todo Esté Corriendo

```bash
docker-compose ps
```

Deberías ver 4 contenedores en estado "Up":
- `fishery_postgres`
- `fishery_backend`
- `fishery_frontend`
- `fishery_mqtt`

### 5. Acceder a la Aplicación

Abrir en tu navegador: **http://localhost:3001**

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

## ✨ Primeros Pasos en la Aplicación

### 1. Explorar el Dashboard

El dashboard muestra una vista general del sistema con:
- Número total de estanques
- Sensores activos
- Alertas activas y resueltas
- Gráficos en tiempo real

### 2. Crear un Estanque

1. Ir a **Estanques** en el menú lateral
2. Click en **"Agregar Estanque"** (nota: funcionalidad básica implementada)
3. Para pruebas, puedes crear uno manualmente en la base de datos:

```bash
docker exec -it fishery_postgres psql -U postgres -d fishery_monitoring
```

```sql
INSERT INTO tanks (name, description, capacity, location) 
VALUES ('Estanque A1', 'Estanque principal de prueba', 50000, 'Sector Norte');
```

### 3. Registrar un Sensor

```sql
INSERT INTO sensors (tank_id, sensor_type, sensor_id, unit) 
VALUES (1, 'temperature', 'TEMP_001', '°C');
```

### 4. Simular Datos de Sensor

Puedes enviar lecturas manualmente usando curl:

```bash
# Enviar lectura de temperatura
curl -X POST http://localhost:3000/api/sensors/1/readings \
  -H "Content-Type: application/json" \
  -d '{"value": 25.5}'

# Enviar otra lectura
curl -X POST http://localhost:3000/api/sensors/1/readings \
  -H "Content-Type: application/json" \
  -d '{"value": 26.2}'
```

Verás las lecturas aparecer en tiempo real en el dashboard! 🎉

### 5. Configurar Umbrales de Alerta

```bash
curl -X POST http://localhost:3000/api/alerts/thresholds \
  -H "Content-Type: application/json" \
  -d '{
    "tank_id": 1,
    "sensor_type": "temperature",
    "min_value": 20,
    "max_value": 30,
    "is_active": true
  }'
```

Ahora, si envías una lectura fuera del rango (ej. 35°C), se generará una alerta automática:

```bash
curl -X POST http://localhost:3000/api/sensors/1/readings \
  -H "Content-Type: application/json" \
  -d '{"value": 35}'
```

### 6. Explorar Inventario

1. Ir a **Inventario**
2. Ver las categorías por defecto:
   - Alimentos
   - Medicamentos
   - Equipos
   - Insumos

## 🔧 Conectar un Sensor Real (Opcional)

### ESP32/Arduino

1. Abrir `iot-clients/arduino_sensor_client.ino` en Arduino IDE
2. Modificar:
   ```cpp
   const char* WIFI_SSID = "TU_WIFI";
   const char* WIFI_PASSWORD = "TU_PASSWORD";
   const char* API_BASE_URL = "http://TU_IP:3000/api";
   const int SENSOR_ID = 1;
   ```
3. Cargar al dispositivo
4. Ver las lecturas llegar en tiempo real!

### Raspberry Pi

```bash
cd iot-clients
nano raspberry_pi_sensor_client.py
# Editar API_BASE_URL
python3 raspberry_pi_sensor_client.py
```

## 📊 Ver Logs

```bash
# Backend logs
docker logs fishery_backend -f

# Frontend logs
docker logs fishery_frontend

# Database logs
docker logs fishery_postgres
```

## 🛑 Detener el Sistema

```bash
docker-compose down
```

Para eliminar también los datos:
```bash
docker-compose down -v
```

## 🔄 Reiniciar el Sistema

```bash
docker-compose restart
```

O reiniciar solo un servicio:
```bash
docker-compose restart backend
```

## 🐛 Solución de Problemas Comunes

### Puerto ya en uso

Si el puerto 3000 o 3001 están ocupados, editar `docker-compose.yml`:

```yaml
backend:
  ports:
    - "3005:3000"  # Usar puerto 3005 en lugar de 3000

frontend:
  ports:
    - "8080:80"    # Usar puerto 8080 en lugar de 3001
```

### Base de datos no inicia

```bash
# Ver logs de Postgres
docker logs fishery_postgres

# Reiniciar contenedor
docker-compose restart postgres
```

### Frontend no carga

1. Verificar que backend esté corriendo: http://localhost:3000/health
2. Limpiar caché del navegador (Ctrl+Shift+R)
3. Verificar logs: `docker logs fishery_frontend`

### No se reciben datos en tiempo real

1. Verificar WebSocket connection en browser console (F12)
2. Asegurarse que backend esté corriendo
3. Verificar que no hay firewall bloqueando WebSocket

## 📚 Próximos Pasos

Ahora que tienes el sistema funcionando:

1. **Leer la documentación completa:** [docs/README.md](docs/README.md)
2. **Configurar sensores reales:** [docs/IOT_SETUP.md](docs/IOT_SETUP.md)
3. **Configurar alertas por email/SMS:** Editar `backend/.env`
4. **Explorar la API:** [docs/API.md](docs/API.md)
5. **Personalizar umbrales de alerta** para cada estanque
6. **Agregar items al inventario**
7. **Generar reportes**

## 🎯 Funcionalidades Principales para Explorar

- ✅ **Dashboard:** Vista general en tiempo real
- ✅ **Estanques:** Gestión de estanques
- ✅ **Sensores:** Monitoreo de sensores y lecturas
- ✅ **Alertas:** Sistema de alertas y umbrales
- ✅ **Inventario:** Control de stock e insumos
- ✅ **Reportes:** Generación de reportes

## 🎬 Demo Rápido con Datos de Prueba

Ejecutar este script para poblar con datos de prueba:

```bash
# Crear estanque
curl -X POST http://localhost:3000/api/tanks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Estanque Demo",
    "description": "Estanque de demostración",
    "capacity": 50000,
    "location": "Zona Norte"
  }'

# Crear sensor (asumir tank_id=1, sensor_id=1)
# Se debe hacer en la BD directamente o crear endpoint POST para sensores

# Enviar varias lecturas
for i in {1..10}; do
  temp=$(echo "scale=1; 24 + $i * 0.3" | bc)
  curl -X POST http://localhost:3000/api/sensors/1/readings \
    -H "Content-Type: application/json" \
    -d "{\"value\": $temp}"
  sleep 2
done
```

## 💡 Consejos Pro

1. **Usar el Serial Monitor** en Arduino IDE para debug de sensores
2. **Configurar notificaciones** de alertas desde el inicio
3. **Hacer backup** de la base de datos regularmente
4. **Monitorear logs** en producción
5. **Cambiar contraseñas** por defecto en producción

## 🆘 Obtener Ayuda

- **GitHub Issues:** https://github.com/galvarez1998/sistema-monitoreo-pesquera/issues
- **Documentación:** [docs/](docs/)
- **API Reference:** [docs/API.md](docs/API.md)

---

**¡Listo! Ahora tienes un sistema de monitoreo pesquera completo funcionando.** 🐟✨

Para producción, recuerda:
- Cambiar todas las contraseñas
- Configurar HTTPS
- Habilitar autenticación en MQTT
- Hacer backups automáticos
- Configurar monitoreo del sistema
