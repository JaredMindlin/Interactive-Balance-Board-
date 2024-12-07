#include <WiFi.h>
#include <HTTPClient.h>

// Define the network's SSID and password for the Access Point
const char* ssid = "ESP32_Server";
const char* password = "12345678";
const char* serverURL = "http://10.136.163.214:5000/api/esp/command";

WiFiServer server(80);

void sendPOSTRequest(int deviceCount) {
    if (WiFi.status() == WL_CONNECTED) { // Check if the ESP32 is connected to WiFi
        HTTPClient http;
        http.begin(serverURL); // Specify the URL
        http.addHeader("Content-Type", "application/json"); // Specify content-type

        // Create the JSON payload with the updated deviceCount
        String payload = "{\"deviceCount\": " + String(deviceCount) + "}";
        int httpResponseCode = http.POST(payload); // Send POST request with the JSON payload

        if (httpResponseCode > 0) {
            Serial.println("POST request sent!");
            Serial.println("Response code: " + String(httpResponseCode));
            Serial.println("Response: " + http.getString());
        } else {
            Serial.println("Error on sending POST: " + String(httpResponseCode));
        }

        http.end(); // End the connection
    } else {
        Serial.println("WiFi Disconnected");
    }
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi!");
}

void loop() {
    static int count = 1; // Simulate adding one device at a time
    sendPOSTRequest(count);
    count++; // Increment device count
    delay(10000); // Send a request every 10 seconds
}
