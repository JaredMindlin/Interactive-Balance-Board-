#include <WiFi.h>

const char* ssid = "ESP32_Server";   // Server Wi-Fi SSID
const char* password = "12345678";  // Server Wi-Fi Password
const char* serverIP = "192.168.4.1"; // Default IP for ESP32 in AP mode
const int serverPort = 80;

WiFiClient client;

void setup() {
  Serial.begin(115200);

  // Connect to the server's Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to Wi-Fi...");
  }
  Serial.println("Connected to Wi-Fi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP()); // Print client IP address
}

void loop() {
  // Attempt to connect to the server
  if (client.connect(serverIP, serverPort)) {
    Serial.println("Connected to server");
    client.println("Hello from client!");

    // Wait for the server response
    delay(1000);
    while (client.available()) {
      String response = client.readStringUntil('\n');
      Serial.println("Response: " + response);
    }
    client.stop(); // Disconnect after communication
  } 
  else {
    Serial.println("Connection failed");
  }
  delay(5000); // Retry every 5 seconds
}
