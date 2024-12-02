/*********
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/esp32-hc-sr04-ultrasonic-arduino/
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files.
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*********/

#include <Adafruit_NeoPixel.h>


const int trigPin = 13;
const int echoPin = 5;
const int trigPin_2 = 25;
const int echoPin_2 = 26;


//define sound speed in cm/uS
#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701
#define PIN_NEO_PIXEL 2  // The ESP32 pin GPIO2 connected to NeoPixel
#define NUM_PIXELS 30     // The number of LEDs (pixels) on NeoPixel LED strip

long duration;
float distanceCm;
float distanceInch;

long duration_2;
float distanceCm_2;
float distanceInch_2;

Adafruit_NeoPixel NeoPixel(NUM_PIXELS, PIN_NEO_PIXEL, NEO_GRB + NEO_KHZ800);


void setup() {
  Serial.begin(115200); // Starts the serial communication
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin, INPUT); // Sets the echoPin as an Input

  pinMode(trigPin_2, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin_2, INPUT); // Sets the echoPin as an Input

  NeoPixel.begin();  // initialize NeoPixel strip object 
}

void loop() {
  NeoPixel.clear();

  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);

  // Clears the trigPin
  digitalWrite(trigPin_2, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin_2, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin_2, LOW);

  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration_2 = pulseIn(echoPin_2, HIGH);
  
  // Calculate the distance
  distanceCm = duration * SOUND_SPEED/2;
  distanceCm_2 = duration_2 * SOUND_SPEED/2;

  
  // Convert to inches
  distanceInch = distanceCm * CM_TO_INCH;
  distanceInch_2 = distanceCm_2 * CM_TO_INCH;

  
  // Prints the distance in the Serial Monitor
  Serial.print("Distance 1 (cm): ");
  Serial.println(distanceCm);
  Serial.print("Distance 1 (inch): ");
  Serial.println(distanceInch);

  Serial.print("Distance 2 (cm): ");
  Serial.println(distanceCm_2);
  Serial.print("Distance 2 (inch): ");
  Serial.println(distanceInch_2);
  
  for (int pixel = 0; pixel < NUM_PIXELS / distanceInch; pixel++) {           // for each pixel
    NeoPixel.setPixelColor(pixel, NeoPixel.Color(0, 255, 0));  // it only takes effect if pixels.show() is called
                                         // update to the NeoPixel Led Strip

  }

    for (int pixel = 0; pixel < NUM_PIXELS / distanceInch_2; pixel++) {           // for each pixel
    NeoPixel.setPixelColor(pixel, NeoPixel.Color(255, 0, 0));  // it only takes effect if pixels.show() is called

  }
  NeoPixel.show();                                           // update to the NeoPixel Led Strip

  delay(100);
}