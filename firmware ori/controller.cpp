/* 
   KISANBOT - MOTOR CONTROLLER (ESP32 DEV KIT)
   Upload this to the ESP32 connected to the Motors.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// ================= WIFI CONFIGURATION =================
// 1. FOR HOME WIFI: Enter your Router Name & Password
// 2. FOR FIELD USE: Turn on your Mobile Hotspot and enter those details here.
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// ================= PIN DEFINITIONS =================
// Motor A (Left)
#define ENA 13  // PWM Speed
#define IN1 12
#define IN2 14

// Motor B (Right)
#define ENB 25  // PWM Speed
#define IN3 26
#define IN4 27

// Servo & Light
#define SERVO_PIN 5
#define LED_PIN 2 // Onboard LED

// ================= GLOBALS =================
WebServer server(80);
Servo camServo;
int motorSpeed = 255; // Max Speed

void setup() {
  Serial.begin(115200);

  // Pin Modes
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Servo Init
  camServo.attach(SERVO_PIN);
  camServo.write(90); // Look Center

  // WiFi Connection
  Serial.print("Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n--- MOTOR ESP CONNECTED ---");
  Serial.print("IP Address: http://");
  Serial.println(WiFi.localIP());
  Serial.println("---------------------------\n");

  // Routes
  server.on("/", [](){ handleCors(); server.send(200, "text/plain", "KisanBot Motor Online"); });
  server.on("/F", [](){ handleCors(); move(1, 1); server.send(200, "text/plain", "OK"); });
  server.on("/B", [](){ handleCors(); move(-1, -1); server.send(200, "text/plain", "OK"); });
  server.on("/L", [](){ handleCors(); move(-1, 1); server.send(200, "text/plain", "OK"); });
  server.on("/R", [](){ handleCors(); move(1, -1); server.send(200, "text/plain", "OK"); });
  server.on("/S", [](){ handleCors(); move(0, 0); server.send(200, "text/plain", "OK"); });
  server.on("/LGT", handleLight);
  server.on("/pan", handlePan);
  server.onNotFound([](){ if(server.method() == HTTP_OPTIONS) { handleCors(); server.send(204); } else server.send(404); });

  server.begin();
}

void loop() {
  server.handleClient();
}

void handleCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

void handleLight() {
  handleCors();
  static bool state = false;
  state = !state;
  digitalWrite(LED_PIN, state ? HIGH : LOW);
  server.send(200, "text/plain", state ? "ON" : "OFF");
}

void handlePan() {
  handleCors();
  if (server.hasArg("angle")) {
    int val = server.arg("angle").toInt();
    camServo.write(constrain(val, 0, 180));
    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Bad Args");
  }
}

void move(int left, int right) {
  // Left Motor
  if(left>0) { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); analogWrite(ENA, motorSpeed); }
  else if(left<0) { digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH); analogWrite(ENA, motorSpeed); }
  else { digitalWrite(IN1, LOW); digitalWrite(IN2, LOW); analogWrite(ENA, 0); }

  // Right Motor
  if(right>0) { digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); analogWrite(ENB, motorSpeed); }
  else if(right<0) { digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH); analogWrite(ENB, motorSpeed); }
  else { digitalWrite(IN3, LOW); digitalWrite(IN4, LOW); analogWrite(ENB, 0); }
}