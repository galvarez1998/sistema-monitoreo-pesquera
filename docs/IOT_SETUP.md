# Guía de Configuración de Sensores IoT

## Tabla de Contenidos
1. [ESP32](#esp32)
2. [Arduino](#arduino)
3. [Raspberry Pi](#raspberry-pi)
4. [Calibración de Sensores](#calibración-de-sensores)
5. [Solución de Problemas](#solución-de-problemas)

## ESP32

### Requisitos
- ESP32 DevKit
- Sensores analógicos o digitales
- Arduino IDE con soporte ESP32
- Cable USB para programación

### Instalación Arduino IDE

1. Descargar Arduino IDE de https://www.arduino.cc/en/software
2. Abrir Arduino IDE
3. Ir a File → Preferences
4. En "Additional Board Manager URLs", agregar:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
5. Ir a Tools → Board → Boards Manager
6. Buscar "ESP32" e instalar "ESP32 by Espressif Systems"

### Instalar Librerías

En Arduino IDE:
- Sketch → Include Library → Manage Libraries
- Instalar:
  - `WiFi` (incluida con ESP32)
  - `HTTPClient` (incluida con ESP32)
  - `ArduinoJson` (buscar e instalar)

### Conexiones de Sensores

#### Sensor de Temperatura (DS18B20)
```
DS18B20 VDD  → ESP32 3.3V
DS18B20 GND  → ESP32 GND
DS18B20 Data → ESP32 GPIO 4 (con resistor pull-up 4.7kΩ a 3.3V)
```

#### Sensor de pH Analógico
```
pH Sensor VCC → ESP32 5V
pH Sensor GND → ESP32 GND
pH Sensor OUT → ESP32 GPIO 34 (ADC1_CH6)
```

#### Sensor de Oxígeno Disuelto
```
DO Sensor VCC → ESP32 5V
DO Sensor GND → ESP32 GND
DO Sensor OUT → ESP32 GPIO 35 (ADC1_CH7)
```

### Configuración del Código

1. Abrir `iot-clients/arduino_sensor_client.ino`
2. Modificar configuración:

```cpp
// WiFi
const char* WIFI_SSID = "TU_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD";

// API
const char* API_BASE_URL = "http://192.168.1.100:3000/api";
const int SENSOR_ID = 1;  // ID del sensor en la BD

// Pines (ajustar según tu conexión)
const int TEMP_PIN = 34;
const int PH_PIN = 35;
const int OXYGEN_PIN = 32;

// Intervalo de lectura (milisegundos)
const unsigned long READING_INTERVAL = 60000;  // 60 segundos
```

### Cargar el Código

1. Conectar ESP32 por USB
2. Seleccionar board: Tools → Board → ESP32 Dev Module
3. Seleccionar puerto: Tools → Port → (tu puerto COM)
4. Click en Upload (→)

### Monitorear Serial

1. Tools → Serial Monitor
2. Configurar baud rate a 115200
3. Ver mensajes de conexión y envío de datos

## Arduino

### Diferencias con ESP32

Arduino (UNO/Mega/Nano) no tiene WiFi integrado. Opciones:

#### Opción 1: Arduino + ESP8266 WiFi Module

Conexiones ESP8266:
```
ESP8266 VCC → Arduino 3.3V
ESP8266 GND → Arduino GND
ESP8266 TX  → Arduino RX (pin 10 con SoftwareSerial)
ESP8266 RX  → Arduino TX (pin 11 con SoftwareSerial)
ESP8266 CH_PD → Arduino 3.3V
```

#### Opción 2: Arduino + Ethernet Shield

Usar librería Ethernet en lugar de WiFi.

### Instalación de Librerías Arduino

```
Sketch → Include Library → Manage Libraries
```

Instalar:
- `WiFiEsp` (para ESP8266)
- `ArduinoJson`

## Raspberry Pi

### Requisitos
- Raspberry Pi (3, 4, Zero W)
- Raspbian OS instalado
- Python 3
- Conexión a red

### Instalación

```bash
# Actualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar Python y dependencias
sudo apt install python3 python3-pip git -y

# Instalar librerías Python
pip3 install requests

# Clonar repositorio
git clone https://github.com/galvarez1998/sistema-monitoreo-pesquera.git
cd sistema-monitoreo-pesquera/iot-clients
```

### Conectar Sensores

#### Sensor DS18B20 (1-Wire)

1. Habilitar 1-Wire:
```bash
sudo nano /boot/config.txt
```

Agregar al final:
```
dtoverlay=w1-gpio
```

Reiniciar:
```bash
sudo reboot
```

2. Conexiones:
```
DS18B20 VDD  → Raspberry Pi 3.3V (Pin 1)
DS18B20 GND  → Raspberry Pi GND (Pin 6)
DS18B20 Data → Raspberry Pi GPIO 4 (Pin 7)
```

3. Verificar:
```bash
ls /sys/bus/w1/devices/
# Debe mostrar 28-xxxxxxxxxxxx
```

#### Sensores Analógicos con MCP3008 ADC

Raspberry Pi no tiene ADC integrado. Usar MCP3008:

```
MCP3008 VDD  → RPi 3.3V
MCP3008 VREF → RPi 3.3V
MCP3008 AGND → RPi GND
MCP3008 DGND → RPi GND
MCP3008 CLK  → RPi SCLK (GPIO 11)
MCP3008 DOUT → RPi MISO (GPIO 9)
MCP3008 DIN  → RPi MOSI (GPIO 10)
MCP3008 CS   → RPi CE0 (GPIO 8)
```

Instalar librería:
```bash
pip3 install adafruit-circuitpython-mcp3xxx
```

### Configurar Script

Editar `raspberry_pi_sensor_client.py`:

```python
API_BASE_URL = "http://192.168.1.100:3000/api"
SENSOR_ID = 1
READING_INTERVAL = 60  # segundos
```

### Ejecutar

```bash
python3 raspberry_pi_sensor_client.py
```

### Ejecutar al Inicio (Autostart)

Crear servicio systemd:

```bash
sudo nano /etc/systemd/system/fishery-sensor.service
```

Contenido:
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
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable fishery-sensor
sudo systemctl start fishery-sensor
```

Ver logs:
```bash
sudo journalctl -u fishery-sensor -f
```

## Calibración de Sensores

### Sensor de pH

1. Preparar soluciones buffer (pH 4.0, 7.0, 10.0)
2. Sumergir sensor en cada solución
3. Registrar valores ADC para cada pH
4. Calcular ecuación de calibración:

```cpp
float calibrate_ph(int raw_value) {
  // Ejemplo con 2 puntos (pH 4 y pH 10)
  // pH 4 → ADC = 1000
  // pH 10 → ADC = 3000
  float ph = 4.0 + (raw_value - 1000) * (10.0 - 4.0) / (3000 - 1000);
  return ph;
}
```

### Sensor de Temperatura

Para termistores NTC:

```cpp
float calculate_temperature(int raw_value) {
  float R = 10000.0 * raw_value / (4095.0 - raw_value);
  float steinhart = log(R / 10000.0) / 3950.0;
  steinhart += 1.0 / (25.0 + 273.15);
  return (1.0 / steinhart) - 273.15;
}
```

### Sensor de Oxígeno Disuelto

Calibración en 2 puntos:
- 0% saturación (agua sin oxígeno)
- 100% saturación (agua saturada con aire)

```cpp
float calibrate_oxygen(int raw_value) {
  // Ejemplo:
  // 0% → ADC = 500
  // 100% → ADC = 3500
  float percent = (raw_value - 500) * 100.0 / (3500 - 500);
  
  // Convertir a mg/L (depende de temperatura)
  float temp = 25.0;  // leer del sensor de temperatura
  float oxygen_mg_l = percent * 9.09 / 100.0;  // A 25°C
  return oxygen_mg_l;
}
```

## Solución de Problemas

### ESP32 no conecta a WiFi

```cpp
// Agregar timeout y reintentos
int wifi_retries = 0;
while (WiFi.status() != WL_CONNECTED && wifi_retries < 20) {
  delay(500);
  Serial.print(".");
  wifi_retries++;
}

if (WiFi.status() != WL_CONNECTED) {
  Serial.println("\nFailed to connect. Restarting...");
  ESP.restart();
}
```

### Lecturas inestables

1. Agregar capacitor 100nF entre VCC y GND del sensor
2. Promediar múltiples lecturas:

```cpp
float read_average(int pin, int samples) {
  float sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(10);
  }
  return sum / samples;
}
```

3. Filtro de media móvil:

```cpp
#define FILTER_SIZE 10
float filter_buffer[FILTER_SIZE];
int filter_index = 0;

float moving_average(float new_value) {
  filter_buffer[filter_index] = new_value;
  filter_index = (filter_index + 1) % FILTER_SIZE;
  
  float sum = 0;
  for (int i = 0; i < FILTER_SIZE; i++) {
    sum += filter_buffer[i];
  }
  return sum / FILTER_SIZE;
}
```

### Error HTTP al enviar datos

```cpp
// Agregar manejo de errores
int httpResponseCode = http.POST(payload);

if (httpResponseCode > 0) {
  Serial.printf("HTTP Response: %d\n", httpResponseCode);
  String response = http.getString();
  Serial.println(response);
} else {
  Serial.printf("Error code: %d\n", httpResponseCode);
  Serial.println("Possible causes:");
  Serial.println("- Server not reachable");
  Serial.println("- Wrong URL");
  Serial.println("- Network issue");
}
```

### Sensor devuelve valores incorrectos

1. Verificar voltaje de alimentación
2. Verificar conexiones
3. Revisar calibración
4. Verificar documentación del sensor
5. Medir voltaje en pin ADC con multímetro

### Raspberry Pi no lee 1-Wire

```bash
# Verificar módulo cargado
lsmod | grep w1

# Cargar manualmente si no está
sudo modprobe w1-gpio
sudo modprobe w1-therm

# Ver dispositivos
ls -l /sys/bus/w1/devices/
```

## Mejores Prácticas

1. **Protección del sensor:**
   - Usar carcasas impermeables
   - Proteger conexiones con termoretráctil
   - Sellar con silicona

2. **Alimentación:**
   - Usar fuente estable
   - Agregar capacitores de desacople
   - Proteger con fusibles

3. **Mantenimiento:**
   - Calibrar sensores mensualmente
   - Limpiar sensores semanalmente
   - Verificar conexiones periódicamente

4. **Software:**
   - Implementar watchdog timer
   - Guardar lecturas en SD si falla red
   - Reiniciar automáticamente en caso de error

5. **Seguridad:**
   - Usar HTTPS en producción
   - No hardcodear contraseñas
   - Actualizar firmware regularmente
