#include <BluetoothSerial.h>

BluetoothSerial SerialBT;

void setup() {
  Serial.begin(115200);
  SerialBT.begin("FireBeetle_Client"); // Set the Bluetooth name
  Serial.println("Connecting to FireBeetle_Server...");

  if (SerialBT.connect("FireBeetle_Server")) {
    Serial.println("Connected to server!");
  } else {
    Serial.println("Failed to connect. Make sure the server is running.");
    while (true) {
      delay(1000);
    }
  }
}

void loop() {
  // Send a message to the server every 5 seconds
  String message = "Hello, Server!";
  SerialBT.println(message);
  Serial.print("Sent: ");
  Serial.println(message);

  // Wait for a response from the server
  if (SerialBT.available()) {
    String response = SerialBT.readStringUntil('\n');
    Serial.print("Received from server: ");
    Serial.println(response);
  }

  delay(5000);
}
