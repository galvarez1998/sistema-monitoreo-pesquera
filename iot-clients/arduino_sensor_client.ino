/**
 * Arduino IoT Sensor Client Example
 * Sends sensor readings to the Fishery Monitoring System API
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuration
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";
const char* API_BASE_URL = "http://your-server-ip:3000/api";
const int SENSOR_ID = 1;  // Replace with your sensor ID

// Sensor pins
const int TEMP_PIN = 34;
const int PH_PIN = 35;
const int OXYGEN_PIN = 32;

// Reading interval (milliseconds)
const unsigned long READING_INTERVAL = 60000;  // 60 seconds
unsigned long lastReading = 0;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize sensor pins
  pinMode(TEMP_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  pinMode(OXYGEN_PIN, INPUT);
  
  Serial.println("Arduino Sensor Client Started");
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastReading >= READING_INTERVAL) {
    lastReading = currentMillis;
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
      connectWiFi();
    }
    
    // Read and send sensor data
    float temperature = readTemperature();
    sendReading(temperature);
    
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println("°C");
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

float readTemperature() {
  int rawValue = analogRead(TEMP_PIN);
  // Convert to temperature (adjust formula based on your sensor)
  float temperature = (rawValue / 4095.0) * 100.0;
  return temperature;
}

float readPH() {
  int rawValue = analogRead(PH_PIN);
  // Convert to pH (adjust formula based on your sensor)
  float ph = (rawValue / 4095.0) * 14.0;
  return ph;
}

float readOxygen() {
  int rawValue = analogRead(OXYGEN_PIN);
  // Convert to mg/L (adjust formula based on your sensor)
  float oxygen = (rawValue / 4095.0) * 20.0;
  return oxygen;
}

void sendReading(float value) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    String url = String(API_BASE_URL) + "/sensors/" + String(SENSOR_ID) + "/readings";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["value"] = value;
    
    String payload;
    serializeJson(doc, payload);
    
    // Send POST request
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode == 201) {
      Serial.println("✓ Reading sent successfully");
    } else {
      Serial.print("✗ Error sending reading: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("✗ WiFi not connected");
  }
}
