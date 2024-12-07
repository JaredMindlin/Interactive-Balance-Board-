#include <WiFi.h>

// Define the network's SSID and password for the Access Point
const char* ssid = "ESP32_Server";
const char* password = "12345678";

WiFiServer server(80);

void setup() {
  Serial.begin(115200);

  // Start the Access Point
  WiFi.softAP(ssid, password);
  Serial.println("Access Point Started");

  // Print the AP's IP address
  Serial.println("IP Address: ");
  Serial.println(WiFi.softAPIP());

  // Start the server
  server.begin();
}

void loop() {
  WiFiClient client = server.available(); // Listen for incoming clients

  if (client) {
    Serial.println("New client connected");
    while (client.connected()) {
      if (client.available()) {
        String data = client.readStringUntil('\n');
        Serial.println("Received: " + data);
        client.println("Data received!");
      }
    }
    client.stop();
    Serial.println("Client disconnected");
  }
}
