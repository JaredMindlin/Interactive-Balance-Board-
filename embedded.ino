#include <Adafruit_NeoPixel.h>
// BLE Client Header Files
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEClient.h>
#include <BLEScan.h>

int pressurePin = A4;

#define PIN_NEO_PIXEL 2  // The ESP32 pin GPIO2 connected to NeoPixel
#define NUM_PIXELS 30     // The number of LEDs (pixels) on NeoPixel LED strip
#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "87654321-4321-6789-4321-abcdef987654"

static BLEAdvertisedDevice* myDevice;
Adafruit_NeoPixel NeoPixel(NUM_PIXELS, PIN_NEO_PIXEL, NEO_GRB + NEO_KHZ800);

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        if (advertisedDevice.haveServiceUUID() && advertisedDevice.getServiceUUID().equals(BLEUUID(SERVICE_UUID))) {
            Serial.println("Found target BLE Server!");
            myDevice = new BLEAdvertisedDevice(advertisedDevice);
        }
    }
};

void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(115200); // Starts the serial communication

  BLEDevice::init("Montessori Board (Mimic)");
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
  pBLEScan->start(5, false);
  
  if (myDevice) {
      BLEClient* pClient = BLEDevice::createClient();
      pClient->connect(myDevice);
      BLERemoteService* pRemoteService = pClient->getService(SERVICE_UUID);
      if (pRemoteService) {
          BLERemoteCharacteristic* pRemoteCharacteristic = pRemoteService->getCharacteristic(CHARACTERISTIC_UUID);
          if (pRemoteCharacteristic) {
              String value = pRemoteCharacteristic->readValue();
              String stringValue = String(value.c_str());
              Serial.print("Characteristic value: ");
              Serial.println(stringValue);
          }
      }
      pClient->disconnect();
  }

  pinMode(pressurePin, INPUT_PULLUP);
  NeoPixel.begin();  // initialize NeoPixel strip object 
}

void loop() {
  int sensorValue = analogRead(pressurePin);

  if (sensorValue > 3000) {
    for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {           // for each pixel
      NeoPixel.setPixelColor(pixel, NeoPixel.Color(0, 255, 0));  // it only takes effect if pixels.show() is called
    }
  }
  else if (sensorValue > 1000) {
    for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {           // for each pixel
      NeoPixel.setPixelColor(pixel, NeoPixel.Color(255, 0, 0));  // it only takes effect if pixels.show() is called
    }
  }
  else {
    for (int pixel = 0; pixel < NUM_PIXELS; pixel++) {           
      NeoPixel.setPixelColor(pixel, NeoPixel.Color(0, 0, 0)); 
    }
  }

  NeoPixel.show();                                           // update to the NeoPixel Led Strip
  delay(100);

}