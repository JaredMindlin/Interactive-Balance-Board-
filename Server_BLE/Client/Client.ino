// BLE Client
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEClient.h>
#include <BLEScan.h>

#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID "87654321-4321-6789-4321-abcdef987654"

static BLEAdvertisedDevice* myDevice;

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        if (advertisedDevice.haveServiceUUID() && advertisedDevice.getServiceUUID().equals(BLEUUID(SERVICE_UUID))) {
            Serial.println("Found target BLE Server!");
            myDevice = new BLEAdvertisedDevice(advertisedDevice);
        }
    }
};

void setup() {
    Serial.begin(115200);
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
}

void loop() {
    delay(2000);
}
