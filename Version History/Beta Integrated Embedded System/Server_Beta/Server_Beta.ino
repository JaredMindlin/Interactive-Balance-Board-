// BLE Server Library/Header Files
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
// Wifi Library/Header File
#include <WiFi.h>
// Http communication Library/Header File
#include <HTTPClient.h>
// JSON
#include <ArduinoJson.h>


// ID used to uniquely identify infomration
#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "87654321-4321-6789-4321-abcdef987654"

#define SSID "Bruno iPhone"
#define PASSWORD "bruhbutton"
#define SERVER_URL "http://172.20.10.4:5000/update-device-count"

// Default GameMode (used for switching)
int lastGameMode = -1;

BLECharacteristic *pCharacteristic;
BLEServer *pServer;
bool deviceConnected = false;

// Server object that the client boards will connunicate to
class ServerCallbacks : public BLEServerCallbacks {
  // Status for when the client board has connected
  void onConnect(BLEServer* pServer) override {
    Serial.println("Client Connected");
    deviceConnected = true;
  }
  // Status for when the client board has disconnected
  void onDisconnect(BLEServer* pServer) override {
    // Serial.println("Client Disconnected, restarting advertising...");
    deviceConnected = false;
    pServer->startAdvertising();
  }
};

// HTTP Post Function
void sendDataToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected, attempting HTTP POST...");

    HTTPClient http;
    http.begin(SERVER_URL);  // Ensure this URL is correct
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"device\": \"ESP32\"}";
    Serial.print("Sending data: ");
    Serial.println(jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    Serial.print("HTTP Response code: ");
    // If -1, request failed
    Serial.println(httpResponseCode);  

    http.end();
  }
  else {
    Serial.println("WiFi Disconnected, unable to send data.");
  }
}

// HTTP Get Function
int fetchGameMode() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin("http://172.20.10.4:5000/game-mode");
        
        int httpResponseCode = http.GET();  // Send GET request

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println(response);

            // // Parse JSON response
            // DynamicJsonDocument doc(256);
            // deserializeJson(doc, response);
            // int gameMode = doc["gameModeSelected"];
            int gameMode = 0;
            if (response.equals("{\"gameModeSelected\":\"Pathway\"}")) {
              gameMode = 1;
            }
            else if (response.equals("{\"gameModeSelected\":\"UpNext\"}")) {
              gameMode = 2;
            }
            http.end();
            return gameMode;
        }
        else {
          Serial.println("HTTP Request failed");
        }
        http.end();
    } 
    else {
      Serial.println("WiFi Disconnected");
    }
    return -1;  // Return -1 if request fails
}

void setup() {
  // Baud rate
  Serial.begin(115200);
  // Connect to WiFi
  WiFi.begin(SSID, PASSWORD);
  Serial.print("Connecting to WiFi...");
  // Wait on connection
  while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");

  // Initialize BLE
  BLEDevice::init("Montessori Board BLE Server");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  
  pCharacteristic->setValue("Hello Board, You reached the server!");
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
  Serial.println("BLE Server started");
}

void loop() {
  if (deviceConnected) {
    Serial.println("ESP32 Connected - Sending Data");
    //sendDataToServer();
    delay(5000); // Send data every 5 seconds
  }

  int gameMode = fetchGameMode();
  
  if (gameMode != -1 && gameMode != lastGameMode) {
    Serial.print("Game Mode Changed: ");
    Serial.println(gameMode);

    String newState;
    switch (gameMode) {
      case 0:
        newState = "Connected";
        break;
      case 1:
        newState = "Pathway";
        break;
      case 2:
        newState = "UpNext";
        break;
      default:
        newState = "Connected";
        break;
    }
    // Update the BLE characteristic
    pCharacteristic->setValue(newState.c_str());
    Serial.print("Updated BLE Characteristic to: ");
    Serial.println(newState);
    // Update last known state
    lastGameMode = gameMode;
  }
  delay(5000);
}