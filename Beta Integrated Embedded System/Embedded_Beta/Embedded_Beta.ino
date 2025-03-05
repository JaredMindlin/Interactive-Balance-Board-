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
Adafruit_NeoPixel NeoPixel(NUM_PIXELS, PIN_NEO_PIXEL, NEO_GRB + NEO_KHZ800);


// Define States for the State Machine for the boards
enum BoardStates {ON, CONNECTED, PATHWAY, UPNEXT};
BoardStates currentState = ON;

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
  for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {           // for each pixel
      NeoPixel.setPixelColor(pixel, NeoPixel.Color(r, g, b));  // it only takes effect if pixels.show() is called
  }
}

void PathWayGameMode() {
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

  static BLEClient* pClient = BLEDevice::createClient();
  
  if (!pClient->isConnected()) {
    pClient->connect(myDevice);
  }

  BLERemoteService* pRemoteService = pClient->getService(SERVICE_UUID);
  if (pRemoteService == nullptr) {
    Serial.println("Failed to find service UUID.");
    pClient->disconnect();
    return;
  }

  BLERemoteCharacteristic* pRemoteCharacteristic = pRemoteService->getCharacteristic(CHARACTERISTIC_UUID);
  if (pRemoteCharacteristic == nullptr) {
    Serial.println("Failed to find characteristic UUID.");
    pClient->disconnect();
    return;
  }

  String value = pRemoteCharacteristic->readValue();
  Serial.print("Characteristic value: ");
  Serial.println(value);

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