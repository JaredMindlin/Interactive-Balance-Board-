// Wifi Library/Header File
#include <WiFi.h>
// Http communication Library/Header File
#include <HTTPClient.h>
// JSON for Arduino Library/Header File
#include <ArduinoJson.h>
// Arduino LED Strip Library/Header File
#include <Adafruit_NeoPixel.h>
// Wifi Library Mananger for SSID and password security
#include <WiFiManager.h>
// String is Numeric Checker
#include <ctype.h>

#define PIN_NEO_PIXEL 2  // The ESP32 pin GPIO2 connected to NeoPixel
#define NUM_PIXELS 30     // The number of LEDs (pixels) on NeoPixel LED strip

// Node.JS Backend Server Routes
#define SERVER_URL "http://172.20.10.6:5000/update-device-count"

int pressurePin = A4;
Adafruit_NeoPixel NeoPixel(NUM_PIXELS, PIN_NEO_PIXEL, NEO_GRB + NEO_KHZ800);
int boardBrightness = 255;

// Define States for the State Machine for the boards
enum BoardStates {ON, CONNECTED, PATHWAY, UPNEXT};
BoardStates currentState = ON;

// Default Board ID before being assigned a real ID
int boardID = -1;

// Default GameMode (used for switching)
int lastGameMode = -1;
// Default Brightness
int currentBrightness = 255;
// Brightness Changes
int convBrightness = 100;
// Game Speed
int gameSpeed = 5000;

// Game Variables
bool isBoardValid = false;
bool isBoardEndPoint = false;

// Game Functions
void resetBoards() {
  currentState = CONNECTED;
  isBoardValid = false;
  isBoardEndPoint = false;
}

void youLose() {
  setLEDs(255, 0, 0); // Red
  delay(5000);
  resetBoards();
}

void youWin() {
  setLEDs(0, 255, 0); // Green
  delay(5000);
  resetBoards();
}

// Define Helper Functions
void setLEDs(uint8_t r, uint8_t g, uint8_t b) {
  for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {
      NeoPixel.setPixelColor(pixel, NeoPixel.Color(r, g, b));
  }
}

// Function that converts user input (1-100) into the range of (1-255)
void adjustBrightness(int &currBrightness, int nodePacket) {
  float conversion = (nodePacket / 100.0) * 255;
  currBrightness = (int)conversion;
  // Brightness is first applied
  NeoPixel.setBrightness(currBrightness);
}

void PathWayGameMode() {
  // GET PULL BOARD DATA
  
  while (currentState == PATHWAY) {
    int sensorValue = analogRead(pressurePin);
    Serial.printf("Sensor Value: %d\n", sensorValue);
    if (isBoardValid) {
      if (sensorValue > 300) {
        if (isBoardEndPoint) {
          youWin();
        }
        else {
          setLEDs(128, 0, 128); // Purple 
        }
      }
      else {
        setLEDs(0, 0, 255); // Blue
      }
    }
    else {
      if (sensorValue > 300) {
        
        youLose();
      }
    }
    fetchGameMode();
    delay(1000);
  }
}

void UpNextGameMode() {
  // GET PULL BOARD DATA
  
  while (currentState == UPNEXT) {
    int sensorValue = analogRead(pressurePin);
    Serial.printf("Sensor Value: %d\n", sensorValue);
    if (isBoardEndPoint && sensorValue > 300) {
      youWin();
    }
    else {
      if (sensorValue > 1500) {
        setLEDs(64, 224, 208); // Turqoise
      }
      else {
        setLEDs(255, 213, 128); // Light Orange
      }
    }
    fetchGameMode();
    delay(1000);
  }
}

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
    if (httpResponseCode == 200) {
      // We'll see where this goes
    }
    http.end();
  }
}

// HTTP Request for checking brightness
void fetchBrightness() {
  if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://172.20.10.6:5000/brightness");
      
      int httpResponseCode = http.GET();  // Send GET request

      if (httpResponseCode > 0) {
          String response = http.getString();
          Serial.println("Brightness Response: " + response);
          String delimiter1 = ":";
          String delimiter2 = "}";
          int pos1 = response.indexOf(delimiter1);
          int pos2 = response.indexOf(delimiter2, pos1 + 1); // Start searching after the first delimiter
          String substring = response.substring(pos1 + 1, pos2);
          int brightness = substring.toInt();
          if (brightness >= 1 && brightness <= 100 && brightness != convBrightness) {
            adjustBrightness(currentBrightness, brightness);
            convBrightness = brightness;
            Serial.printf("New Brightness: %d\n", brightness);
          }
      }
      else {
        Serial.println("HTTP Request for brightness failed");
      }    
      http.end();
  } 
  else {
    Serial.println("WiFi Disconnected - Brightness");
  }
}

// HTTP request for game mode
void fetchGameMode() {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://172.20.10.6:5000/game-mode");
      
      int httpResponseCode = http.GET();  // Send GET request

      int tempGameMode = lastGameMode; // Variable to prevent constant gamemode reassignment

      if (httpResponseCode > 0) {
        String response = http.getString();
        if (response.equals("{\"gameModeSelected\":\"Pathway\"}")) {
          lastGameMode = 1;
        }
        else if (response.equals("{\"gameModeSelected\":\"UpNext\"}")) {
          lastGameMode = 2;
        }
        else {
          lastGameMode = 0;
        }
        if (tempGameMode != lastGameMode) {
          switch (lastGameMode) {
          case 0:
            currentState = CONNECTED;
            break;
          case 1:
            currentState = PATHWAY;
            break;
          case 2:
            currentState = UPNEXT;
            break;
          default:
            currentState = CONNECTED;
            break;
          }
        }
      }
      else {
        Serial.println("HTTP Request failed");
      }
      http.end();
  } 
  else {
    Serial.println("WiFi Disconnected - Gamemode");
  }
}

// HTTP Request for assigning boardID
void fetchBoardID() {
  if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://172.20.10.6:5000/api/board/register-board");
      
      int httpResponseCode = http.GET();  // Send GET request
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("ID Response: " + response);
        char capture = response.substring(response.length() - 2, response.length() - 1).charAt(0);
        if (isdigit(capture)) {
          int tempID = capture - '0';
          Serial.printf("Captured Number: %d\n", tempID);
          if (boardID == -1) {
            boardID = tempID;
          }
        }
      }
      else {
        Serial.println("HTTP Request for boardID failed");
      }
      http.end();
  } 
  else {
    Serial.println("WiFi Disconnected - BoardID");
  }
}

// HTTP Request for retreiving the vector of valid boards
int fetchBoardData() {
  if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      if (boardID == 0) {
        http.begin("http://172.20.10.6:5000/api/board/board-valid-data-zero");
      }
      else if (boardID == 1) {
        http.begin("http://172.20.10.6:5000/api/board/board-valid-data-one");
      }
      else if (boardID == 2) {
        http.begin("http://172.20.10.6:5000/api/board/board-valid-data-two");
      }
      int httpResponseCode = http.GET();  // Send GET request
      if (httpResponseCode > 0) {
          String response = http.getString();
          Serial.printf("Board Valid Data: %d\n", response);
      }
      else {
        Serial.println("HTTP Request for Valid Boards failed");
      }

      if (boardID == 0) {
        http.begin("http://172.20.10.6:5000/api/board/board-end-data-zero");
      }
      else if (boardID == 1) {
        http.begin("http://172.20.10.6:5000/api/board/board-end-data-one");
      }
      else if (boardID == 2) {
        http.begin("http://172.20.10.6:5000/api/board/board-end-data-two");
      }
      httpResponseCode = http.GET();  // Send GET request
      if (httpResponseCode > 0) {
          String response = http.getString();
          Serial.printf("Board End Data: %d\n", response);
      }
      else {
        Serial.println("HTTP Request for End Boards failed");
      }
      http.end();
  } 
  else {
    Serial.println("WiFi Disconnected - End Boards");
  }
}

void setup() {
  // Baud rate
  Serial.begin(115200);
  // Pin set up
  pinMode(pressurePin, INPUT_PULLUP);
  setLEDs(0, 0, 0);
  NeoPixel.begin();
  // Initialize WiFi Manager
  WiFiManager wm;
  // Try to connect to last known connection
  if (!wm.autoConnect("User SSID", "User Password")) {
    Serial.print("failed to connect and hit timeout");
    ESP.restart();
    delay(1000);
  }
  // Wait on connection
  while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  // Assign this board a unique ID
  fetchBoardID();
  delay(2000);
}

void loop() {
  // Check for gamemode
  fetchGameMode();
  // Check for brightness
  fetchBrightness();
  // Perform Hardware functions
  switch (currentState) {
    case ON:
      Serial.print("Current State: ON\n");
      setLEDs(0, 0, 0);  // LED OFF
      break;
    case CONNECTED:
      Serial.print("Current State: CONNECTED\n");
      isBoardValid = false;
      isBoardEndPoint = false;
      setLEDs(255, 255, 255); // White LED
      break;
    case PATHWAY:
      Serial.print("Current State: PATHWAY\n");
      PathWayGameMode();
      break;
    case UPNEXT:
      Serial.print("Current State: UPNEXT\n");
      UpNextGameMode();
      break;
  }
  Serial.printf("BoardID: %d\n", boardID);
  Serial.printf("Valid Boolean: %d\n", isBoardValid);
  Serial.printf("End Boolean: %d\n", isBoardEndPoint);
  //fetchBoardData();
  NeoPixel.show();
  Serial.printf("End of loop reached\n");
  delay(5000);
}