# Guía de Instalación - Sistema de Monitoreo Pesquera

## Tabla de Contenidos
1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación con Docker](#instalación-con-docker)
3. [Instalación Manual](#instalación-manual)
4. [Configuración de Sensores IoT](#configuración-de-sensores-iot)
5. [Configuración de Alertas](#configuración-de-alertas)
6. [Solución de Problemas](#solución-de-problemas)

## Requisitos del Sistema

### Servidor (Producción)
- Sistema Operativo: Linux (Ubuntu 20.04+ recomendado)
- RAM: Mínimo 4GB (8GB recomendado)
- Disco: 20GB disponible
- Procesador: 2 cores mínimo
- Conexión a Internet estable

### Desarrollo
- Sistema Operativo: Windows 10+, macOS 10.15+, o Linux
- RAM: Mínimo 8GB
- Node.js 18+ y npm
- PostgreSQL 15+
- Git

## Instalación con Docker

Docker es el método recomendado para desplegar el sistema.

### Paso 1: Instalar Docker y Docker Compose

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### CentOS/RHEL
```bash
sudo yum install docker docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Cerrar sesión y volver a iniciar para que los cambios surtan efecto.

### Paso 2: Clonar el Repositorio
```bash
git clone https://github.com/galvarez1998/sistema-monitoreo-pesquera.git
cd sistema-monitoreo-pesquera
```

### Paso 3: Configurar Variables de Entorno
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Editar las siguientes variables:
```env
# Base de Datos
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fishery_monitoring
DB_USER=postgres
DB_PASSWORD=CAMBIAR_CONTRASEÑA_SEGURA

# Servidor
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=CAMBIAR_POR_CLAVE_SECRETA_LARGA
JWT_EXPIRE=24h

# Email (Gmail ejemplo)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_app

# Twilio SMS/WhatsApp
TWILIO_ACCOUNT_SID=tu_sid
TWILIO_AUTH_TOKEN=tu_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Paso 4: Iniciar los Servicios
```bash
docker-compose up -d
```

### Paso 5: Verificar que los Servicios Están Corriendo
```bash
docker-compose ps
```

Deberías ver:
- fishery_postgres (puerto 5432)
- fishery_backend (puerto 3000)
- fishery_frontend (puerto 3001)
- fishery_mqtt (puertos 1883, 9001)

### Paso 6: Acceder a la Aplicación
Abrir en el navegador: http://localhost:3001

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE:** Cambiar la contraseña después del primer inicio de sesión.

## Instalación Manual

### Paso 1: Instalar PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Configurar Base de Datos
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE fishery_monitoring;
CREATE USER fishery_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE fishery_monitoring TO fishery_user;
\q
```

Importar el esquema:
```bash
psql -U fishery_user -d fishery_monitoring -f backend/database/schema.sql
```

### Paso 2: Instalar Node.js

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verificar instalación:
```bash
node --version  # Debe mostrar v18.x.x
npm --version
```

### Paso 3: Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
nano .env
```

Editar variables de entorno (ver Paso 3 de Docker).

Iniciar el backend:
```bash
npm start
```

O para desarrollo con auto-recarga:
```bash
npm run dev
```

### Paso 4: Configurar Frontend

Abrir nueva terminal:
```bash
cd frontend
npm install
```

Crear archivo `.env`:
```bash
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
echo "REACT_APP_SOCKET_URL=http://localhost:3000" >> .env
```

Iniciar el frontend:
```bash
npm start
```

La aplicación se abrirá en http://localhost:3000

### Paso 5: Configurar como Servicio (Producción)

#### Backend Service
Crear archivo `/etc/systemd/system/fishery-backend.service`:
```ini
[Unit]
Description=Fishery Monitoring Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sistema-monitoreo-pesquera/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Habilitar y iniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable fishery-backend
sudo systemctl start fishery-backend
```

#### Frontend (Nginx)
Compilar el frontend:
```bash
cd frontend
npm run build
```

Configurar Nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /opt/sistema-monitoreo-pesquera/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configuración de Sensores IoT

### ESP32

1. **Instalar Arduino IDE**
   - Descargar de https://www.arduino.cc/en/software

2. **Agregar soporte ESP32**
   - File → Preferences → Additional Board Manager URLs
   - Agregar: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Buscar "ESP32" e instalar

3. **Instalar librerías necesarias**
   - Sketch → Include Library → Manage Libraries
   - Instalar: `ArduinoJson`, `WiFi`

4. **Configurar el código**
   - Abrir `iot-clients/arduino_sensor_client.ino`
   - Modificar:
     ```cpp
     const char* WIFI_SSID = "tu-wifi";
     const char* WIFI_PASSWORD = "tu-contraseña";
     const char* API_BASE_URL = "http://IP-SERVIDOR:3000/api";
     const int SENSOR_ID = 1;  // ID del sensor en la base de datos
     ```

5. **Cargar al dispositivo**
   - Conectar ESP32 por USB
   - Seleccionar puerto y board
   - Sketch → Upload

### Raspberry Pi

1. **Instalar Python y dependencias**
```bash
sudo apt update
sudo apt install python3 python3-pip -y
pip3 install requests
```

2. **Configurar el script**
```bash
cd iot-clients
nano raspberry_pi_sensor_client.py
```

Modificar:
```python
API_BASE_URL = "http://IP-SERVIDOR:3000/api"
SENSOR_ID = 1
```

3. **Ejecutar como servicio**
Crear `/etc/systemd/system/fishery-sensor.service`:
```ini
[Unit]
Description=Fishery Sensor Client
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/sistema-monitoreo-pesquera/iot-clients
ExecStart=/usr/bin/python3 raspberry_pi_sensor_client.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
sudo systemctl enable fishery-sensor
sudo systemctl start fishery-sensor
```

## Configuración de Alertas

### 1. Configurar Email (Gmail)

1. Activar "Verificación en 2 pasos" en tu cuenta Gmail
2. Generar "Contraseña de aplicación":
   - Google Account → Security → 2-Step Verification → App passwords
   - Seleccionar "Mail" y "Other"
   - Copiar la contraseña generada

3. En `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=contraseña_de_app_generada
```

### 2. Configurar SMS/WhatsApp (Twilio)

1. Crear cuenta en https://www.twilio.com
2. Obtener credenciales del dashboard
3. En `.env`:
```env
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER=+1234567890
```

### 3. Configurar Umbrales de Alerta

Desde la interfaz web:
1. Ir a "Alertas" → "Umbrales"
2. Seleccionar estanque
3. Configurar valores mínimos y máximos para cada parámetro:
   - Temperatura: 20-30°C
   - pH: 6.5-8.5
   - Oxígeno: 5-12 mg/L
   - etc.

## Solución de Problemas

### Backend no inicia
```bash
# Ver logs
docker logs fishery_backend
# O si es manual:
cd backend && npm start
```

Problemas comunes:
- Puerto 3000 ya en uso: cambiar `PORT` en `.env`
- No conecta a base de datos: verificar credenciales en `.env`
- Error de permisos: `sudo chown -R $USER:$USER .`

### Frontend no carga
- Verificar que backend esté corriendo
- Limpiar caché del navegador
- Verificar `REACT_APP_API_URL` en `.env`

### Sensores no envían datos
- Verificar conectividad WiFi
- Verificar que API_BASE_URL sea accesible desde el sensor
- Verificar que SENSOR_ID exista en la base de datos
- Ver serial monitor en Arduino IDE para logs

### Base de datos problemas
```bash
# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Conectar manualmente
psql -U fishery_user -d fishery_monitoring
```

### Alertas no se envían
- Verificar configuración de email en `.env`
- Verificar logs del backend
- Probar envío manual:
```bash
curl -X POST http://localhost:3000/api/alerts/thresholds \
  -H "Content-Type: application/json" \
  -d '{"tank_id":1,"sensor_type":"temperature","min_value":20,"max_value":30}'
```

## Próximos Pasos

Una vez instalado:
1. Cambiar contraseña del usuario admin
2. Crear usuarios adicionales
3. Configurar estanques
4. Registrar sensores
5. Configurar umbrales de alerta
6. Instalar sensores IoT
7. Configurar notificaciones

Para más información, ver la documentación completa en `docs/README.md`.
