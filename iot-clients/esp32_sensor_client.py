"""
ESP32 IoT Sensor Client Example
Sends sensor readings to the Fishery Monitoring System API
"""

import urequests
import ujson
import time
from machine import Pin, ADC
import network

# Configuration
API_BASE_URL = "http://your-server-ip:3000/api"
SENSOR_ID = 1  # Replace with your sensor ID
WIFI_SSID = "your-wifi-ssid"
WIFI_PASSWORD = "your-wifi-password"

# Sensor pin configuration (example)
TEMP_PIN = 34
PH_PIN = 35
OXYGEN_PIN = 32

class SensorClient:
    def __init__(self):
        self.api_url = API_BASE_URL
        self.sensor_id = SENSOR_ID
        self.wifi = network.WLAN(network.STA_IF)
        
    def connect_wifi(self):
        """Connect to WiFi network"""
        self.wifi.active(True)
        if not self.wifi.isconnected():
            print('Connecting to WiFi...')
            self.wifi.connect(WIFI_SSID, WIFI_PASSWORD)
            while not self.wifi.isconnected():
                time.sleep(1)
        print('WiFi connected:', self.wifi.ifconfig())
    
    def read_temperature(self):
        """Read temperature from sensor"""
        # Example: Read from analog sensor
        adc = ADC(Pin(TEMP_PIN))
        adc.atten(ADC.ATTN_11DB)
        raw_value = adc.read()
        # Convert to temperature (adjust formula based on your sensor)
        temperature = (raw_value / 4095.0) * 100
        return round(temperature, 2)
    
    def read_ph(self):
        """Read pH from sensor"""
        adc = ADC(Pin(PH_PIN))
        adc.atten(ADC.ATTN_11DB)
        raw_value = adc.read()
        # Convert to pH (adjust formula based on your sensor)
        ph = (raw_value / 4095.0) * 14
        return round(ph, 2)
    
    def read_oxygen(self):
        """Read dissolved oxygen from sensor"""
        adc = ADC(Pin(OXYGEN_PIN))
        adc.atten(ADC.ATTN_11DB)
        raw_value = adc.read()
        # Convert to mg/L (adjust formula based on your sensor)
        oxygen = (raw_value / 4095.0) * 20
        return round(oxygen, 2)
    
    def send_reading(self, value):
        """Send sensor reading to API"""
        try:
            url = f"{self.api_url}/sensors/{self.sensor_id}/readings"
            headers = {'Content-Type': 'application/json'}
            data = ujson.dumps({'value': value})
            
            response = urequests.post(url, data=data, headers=headers)
            
            if response.status_code == 201:
                print(f"✓ Reading sent successfully: {value}")
            else:
                print(f"✗ Error sending reading: {response.status_code}")
            
            response.close()
            return True
        except Exception as e:
            print(f"✗ Exception sending reading: {e}")
            return False
    
    def run(self, interval=60):
        """Main loop - read and send data at specified interval (seconds)"""
        self.connect_wifi()
        
        print(f"Starting sensor monitoring (interval: {interval}s)")
        
        while True:
            try:
                # Read sensors
                temp = self.read_temperature()
                print(f"Temperature: {temp}°C")
                
                # Send reading
                self.send_reading(temp)
                
                # Wait before next reading
                time.sleep(interval)
                
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(5)

# Main execution
if __name__ == "__main__":
    client = SensorClient()
    client.run(interval=60)  # Send readings every 60 seconds
