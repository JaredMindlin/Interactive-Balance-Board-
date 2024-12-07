#include <BluetoothSerial.h>

BluetoothSerial SerialBT;

void setup() {
  Serial.begin(115200);
  SerialBT.begin("FireBeetle_Server"); // Set the Bluetooth name
  Serial.println("Bluetooth Server is ready. Waiting for connection...");
}

void loop() {
  if (SerialBT.hasClient()) {
    // If a client is connected
    Serial.println("Client connected.");
    while (SerialBT.available()) {
      // Read data from the client
      String received = SerialBT.readStringUntil('\n');
      Serial.print("Received: ");
      Serial.println(received);

      // Respond to the client
      String response = "Server received: " + received;
      SerialBT.println(response);
      Serial.println("Response sent to client.");
    }
  } else {
    // Wait for a client
    Serial.println("Waiting for a client...");
    delay(1000);
  }
}
