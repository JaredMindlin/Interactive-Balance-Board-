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
// Unordered Map that stores the Connected Boards
#include <unordered_map>

// ID used to uniquely identify infomration
#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "87654321-4321-6789-4321-abcdef987654"
#define BRIGHTNESS_CHARACTERISTIC_UUID "abcdef12-3456-7890-abcd-ef1234567890"
#define BOARD_ID_CHARACTERISTIC_UUID "13579ace-2468-bdf0-1357-9ace2468bdf0"


#define SSID "Bruno iPhone"
#define PASSWORD "bruhbutton"
#define SERVER_URL "http://172.20.10.4:5000/update-device-count"

// Unordered Set that holds IDs of connected boards
std::unordered_map<int, bool> connectedBoards;

// Default GameMode (used for switching)
int lastGameMode = -1;
// Default Brightness
int currentBrightness = 255;
// Next Available Ticket Counter
int nextTicket = 1;

BLECharacteristic *pCharacteristic;
BLECharacteristic *pBrightnessCharacteristic;
BLECharacteristic *pBoardIdCharacteristic;
BLEServer *pServer;
bool deviceConnected = false;

// Server object that the client boards will connunicate to
class ServerCallbacks : public BLEServerCallbacks {
  // Status for when the client board has connected
  void onConnect(BLEServer* pServer) override {
    Serial.println("Client Connected");
    deviceConnected = true;

    // Assign the board an ID
    int assignedID = -1;
    for (unsigned int i = 1; i < nextTicket; i++) {
      if (connectedBoards.find(i) == connectedBoards.end()) {
        assignedID = i;
        // Default construction
        connectedBoards.emplace(i, false);
        break; 
      }
    }

    if (assignedID == -1) {
      assignedID = nextTicket;
      connectedBoards.emplace(nextTicket, false);
      nextTicket++;
    }
    Serial.printf("Assigned Board ID: %d\n", assignedID);
    // Send the ID back to the client board
    String idStr = String(assignedID);
    pBoardIdCharacteristic->setValue(idStr.c_str());
    Serial.printf("Sent Board ID %s to client\n", idStr.c_str());
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

// HTTP Post Function
void sendBoardStatusToServer(String boardID, bool isOccupied) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"boardID\": \"" + boardID + "\", \"isOccupied\": " + (isOccupied ? "true" : "false") + "}";
    Serial.print("Sending data: ");
    Serial.println(jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("HTTP Response code: ");
    // If -1, request failed
    Serial.println(httpResponseCode);  
    http.end();
  }
}

int fetchBrightness() {
  if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://172.20.10.4:5000/game-mode");
      
      int httpResponseCode = http.GET();  // Send GET request

      if (httpResponseCode > 0) {
          String response = http.getString();
          Serial.println("Brightness Response: " + response);
          int brightness = response.toInt();
          if (brightness >= 1 && brightness <= 100) {
            return brightness;
          }
      }
      else {
        Serial.println("HTTP Request for brightness failed");
      }    
      http.end();
  } 
  else {
    Serial.println("WiFi Disconnected");
  }
  return -1;
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
  pBoardIdCharacteristic = pService->createCharacteristic(BOARD_ID_CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pBrightnessCharacteristic = pService->createCharacteristic(BRIGHTNESS_CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  // Default brightness 100%
  pBrightnessCharacteristic->setValue("100");
  
  pCharacteristic->setValue("Hello Board, You reached the server!");
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();
  Serial.println("BLE Server started");
}

void loop() {
  for (auto iter = connectedBoards.begin(); iter != connectedBoards.end(); iter++) {
    if (deviceConnected) {
    Serial.println("ESP32 Connected - Sending Data");
    delay(5000);
    }

    // Check for gamemode
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
      lastGameMode = gameMode;
    }

    // Check for brightness
    int brightness = fetchBrightness();

    if ((brightness != currentBrightness) && (brightness != -1)) {
      String brightnessStr = String(brightness);
      pBrightnessCharacteristic->setValue(brightnessStr.c_str());
      Serial.print("Updated BLE Brightness to: ");
      Serial.println(brightness);
      currentBrightness = brightness;
    }
  }
  delay(5000);
}