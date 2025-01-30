#include <Adafruit_NeoPixel.h>


int pressurePin = A4;

#define PIN_NEO_PIXEL 2  // The ESP32 pin GPIO2 connected to NeoPixel
#define NUM_PIXELS 30     // The number of LEDs (pixels) on NeoPixel LED strip

Adafruit_NeoPixel NeoPixel(NUM_PIXELS, PIN_NEO_PIXEL, NEO_GRB + NEO_KHZ800);

void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(115200); // Starts the serial communication
  pinMode(pressurePin, INPUT_PULLUP);
  NeoPixel.begin();  // initialize NeoPixel strip object 
}

void loop() {
  int sensorValue = analogRead(pressurePin);
  Serial.print("Voltage: ");
  Serial.println(sensorValue);

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
