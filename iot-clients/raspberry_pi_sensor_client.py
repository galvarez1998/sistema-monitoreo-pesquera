"""
Raspberry Pi IoT Sensor Client Example
Sends sensor readings to the Fishery Monitoring System API
"""

import requests
import time
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://your-server-ip:3000/api"
SENSOR_ID = 1  # Replace with your sensor ID
READING_INTERVAL = 60  # seconds

class RaspberryPiSensorClient:
    def __init__(self, api_url, sensor_id):
        self.api_url = api_url
        self.sensor_id = sensor_id
        
    def read_temperature(self):
        """
        Read temperature from sensor
        Example using DS18B20 sensor
        """
        try:
            # For DS18B20 sensor connected via 1-Wire
            # Replace with your actual sensor reading code
            with open('/sys/bus/w1/devices/28-xxxxxxxxxxxx/w1_slave', 'r') as f:
                lines = f.readlines()
                if lines[0].strip()[-3:] == 'YES':
                    temp_pos = lines[1].find('t=')
                    if temp_pos != -1:
                        temp_string = lines[1][temp_pos+2:]
                        temp_c = float(temp_string) / 1000.0
                        return round(temp_c, 2)
        except Exception as e:
            print(f"Error reading temperature: {e}")
            # Return simulated value for testing
            import random
            return round(20 + random.uniform(-5, 5), 2)
    
    def read_ph(self):
        """Read pH from sensor"""
        # Implement your pH sensor reading logic here
        # For testing, return simulated value
        import random
        return round(7.0 + random.uniform(-1, 1), 2)
    
    def read_oxygen(self):
        """Read dissolved oxygen from sensor"""
        # Implement your oxygen sensor reading logic here
        # For testing, return simulated value
        import random
        return round(8.0 + random.uniform(-2, 2), 2)
    
    def send_reading(self, value):
        """Send sensor reading to API"""
        try:
            url = f"{self.api_url}/sensors/{self.sensor_id}/readings"
            headers = {'Content-Type': 'application/json'}
            data = {'value': value}
            
            response = requests.post(url, json=data, headers=headers, timeout=5)
            
            if response.status_code == 201:
                print(f"✓ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Reading sent: {value}")
                return True
            else:
                print(f"✗ Error sending reading: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Exception sending reading: {e}")
            return False
    
    def run(self):
        """Main loop - read and send data at specified interval"""
        print(f"Starting Raspberry Pi sensor client...")
        print(f"API: {self.api_url}")
        print(f"Sensor ID: {self.sensor_id}")
        print(f"Reading interval: {READING_INTERVAL} seconds")
        print("-" * 50)
        
        while True:
            try:
                # Read sensor
                temperature = self.read_temperature()
                
                # Send reading
                self.send_reading(temperature)
                
                # Wait before next reading
                time.sleep(READING_INTERVAL)
                
            except KeyboardInterrupt:
                print("\nStopping sensor client...")
                break
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    client = RaspberryPiSensorClient(API_BASE_URL, SENSOR_ID)
    client.run()
