#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_UUID "abcd1234-5678-90ab-cdef-1234567890ab"

BLECharacteristic *characteristic;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Server...");

  BLEDevice::init("FireBeetle_BLE_Server");
  BLEServer *server = BLEDevice::createServer();

  BLEService *service = server->createService(SERVICE_UUID);

  characteristic = service->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  characteristic->setValue("Hello, Client!");
  service->start();
  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();

  Serial.println("BLE Server is running and advertising...");
}

void loop() {
  // Check for notifications from the client
  if (characteristic->getValue() != "") {
    String clientMessage = characteristic->getValue().c_str();
    Serial.print("Received from Client: ");
    Serial.println(clientMessage);

    // Respond to the client
    characteristic->setValue("Hello, Client! Message received.");
    characteristic->notify();
  }

  delay(1000);
}
