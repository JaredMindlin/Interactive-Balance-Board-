#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEClient.h>

#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_UUID "abcd1234-5678-90ab-cdef-1234567890ab"

BLEClient *client;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Client...");

  BLEDevice::init("FireBeetle_BLE_Client");
  client = BLEDevice::createClient();
  Serial.println("Connecting to server...");

  if (client->connect(BLEAddress("192.168.7.1"))) {
    Serial.println("Connected to server!");

    BLERemoteService *service = client->getService(SERVICE_UUID);
    if (service == nullptr) {
      Serial.println("Failed to find service UUID. Disconnecting...");
      client->disconnect();
      return;
    }

    BLERemoteCharacteristic *characteristic = service->getCharacteristic(CHARACTERISTIC_UUID);
    if (characteristic == nullptr) {
      Serial.println("Failed to find characteristic UUID. Disconnecting...");
      client->disconnect();
      return;
    }

    // Write to the server
    String message = "Hello, Server!";
    characteristic->writeValue(message.c_str(), message.length());
    Serial.print("Sent: ");
    Serial.println(message);

    // Read notification from the server
    if (characteristic->canNotify()) {
      String serverResponse = characteristic->readValue().c_str();
      Serial.print("Received from server: ");
      Serial.println(serverResponse);
    }
  } else {
    Serial.println("Failed to connect to server.");
  }
}

void loop() {
  delay(1000);
}
