#include <Adafruit_NeoPixel.h>
// BLE Client Header Files
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEClient.h>
#include <BLEScan.h>

#define PIN_NEO_PIXEL 2  // The ESP32 pin GPIO2 connected to NeoPixel
#define NUM_PIXELS 30     // The number of LEDs (pixels) on NeoPixel LED strip
#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "87654321-4321-6789-4321-abcdef987654"

int pressurePin = A4;
static BLEAdvertisedDevice* myDevice;
BLEClient* pClient;
Adafruit_NeoPixel NeoPixel(NUM_PIXELS, PIN_NEO_PIXEL, NEO_GRB + NEO_KHZ800);
int boardBrightness = 255;

// Define States for the State Machine for the boards
enum BoardStates {ON, CONNECTED, PATHWAY, UPNEXT};
BoardStates currentState = ON;

// Default Board ID before being assigned a real ID
int boardID = 1;

// Define the BLE Class
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        if (advertisedDevice.haveServiceUUID() && advertisedDevice.getServiceUUID().equals(BLEUUID(SERVICE_UUID))) {
            Serial.println("Found target BLE Server!");
            myDevice = new BLEAdvertisedDevice(advertisedDevice);
            currentState = CONNECTED;
        }
    }
};

// Define Helper Functions
void setLEDs(uint8_t r, uint8_t g, uint8_t b) {
  for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {
      // Then show the color
      NeoPixel.setPixelColor(pixel, NeoPixel.Color(r, g, b));  // it only takes effect if pixels.show() is called
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
  Serial.println("Starting PathWayGameMode...");
  int sensorValue = analogRead(pressurePin);
  if (sensorValue > 1500) {
    setLEDs(0, 255, 0); // Green
  }
  else if (sensorValue > 300) {
    setLEDs(255, 0, 0); // Red
  } 
  else {
    setLEDs(0, 0, 0); // Off
  } 
  Serial.print(sensorValue);
}

void UpNextGameMode() {
  int sensorValue = analogRead(pressurePin);
  if (sensorValue > 1500) {
    setLEDs(0, 0, 255); // Blue
  }
  else if (sensorValue > 300) {
    setLEDs(255, 165, 0); // Orange
  } 
  else {
    setLEDs(0, 0, 0); // Off
  } 
  Serial.print(sensorValue);
}

void updateState() {
  if (!myDevice) {
    Serial.println("No BLE device found.");
    return;
  }

  if (!pClient->isConnected()) {
    Serial.println("Connecting to BLE Server...");
    pClient->connect(myDevice);
  }

  BLERemoteService* pRemoteService = pClient->getService(SERVICE_UUID);

  if (!pRemoteService) {
    Serial.println("Failed to find service UUID.");
    pClient->disconnect();
    return;
  }

  BLERemoteCharacteristic* pRemoteCharacteristic = pRemoteService->getCharacteristic(CHARACTERISTIC_UUID);
  if (!pRemoteCharacteristic) {
    Serial.println("Failed to find characteristic UUID.");
    pClient->disconnect();
    return;
  }

  String value = pRemoteCharacteristic->readValue();
  Serial.print("Characteristic value: ");
  Serial.println(value);

  int brightness = atoi(value.c_str());
  if (brightness >= 1 && brightness <= 100) {
    adjustBrightness(boardBrightness, brightness);
    Serial.print("Updated Brightness: ");
    Serial.println(boardBrightness);
  }

  if (value == "Pathway") {
    currentState = PATHWAY;
  } 
  else if (value == "UpNext") {
    currentState = UPNEXT;
  } 
  else {
    currentState = CONNECTED;
  }
}

void setup() {
  Serial.begin(115200); // Starts the serial communication

  BLEDevice::init("Montessori Board (Mimic)");

  pClient = BLEDevice::createClient();

  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
  pBLEScan->start(5, false);
  
  pinMode(pressurePin, INPUT_PULLUP);
  setLEDs(0, 0, 0);
  NeoPixel.begin();  // initialize NeoPixel strip object 
}

void loop() {
  updateState();
  
  switch (currentState) {
        case ON:
          Serial.print("Current State: ON\n");
          setLEDs(0, 0, 0);  // LED OFF
          break;
        case CONNECTED:
          Serial.print("Current State: CONNECTED\n");
          setLEDs(255, 255, 255); // White LED
          break;
        case PATHWAY:
          Serial.print("Current State: PATHWAY\n");
          PathWayGameMode(); // Same behavior as loop() in your current code
          break;
        case UPNEXT:
          Serial.print("Current State: UPNEXT\n");
          UpNextGameMode(); // Same behavior as loop() in your current code
          break;
    }

    NeoPixel.show();
    delay(1000);

}