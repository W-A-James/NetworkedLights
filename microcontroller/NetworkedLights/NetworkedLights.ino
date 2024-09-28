#include <Adafruit_NeoPixel.h>

/*
 WiFi Web Server Neopixel

A web server that controls a string of NEOPixels, controlled over UDP

 created for arduino 25 Nov 2012
 by Tom Igoe

ported for sparkfun esp32 
31.01.2017 by Jan Hendrik Berlin

ported for Adafruit Huzzah 32 by Warren James
 
 */
#define PIXEL_PIN 25
#define NUM_PIXELS 50
#define HANG() \
  do { delay(10000); } while (1);

#include <WiFi.h>

#include "AsyncUDP.h"

const char* ssid = "*************";
const char* password = "***********";

// Control server address - replace with your server's IP
const IPAddress serverAddress(192, 168, 1, 221);
// Static IP being assigned to ESP32
const IPAddress localIP(192, 168, 1, 220);
// Replace these with appropriate values
const IPAddress gateway(192, 168, 1, 1);
const IPAddress subnet(255, 255, 255, 0);
const IPAddress primaryDNS(8, 8, 8, 8);
const uint16_t localUDPPort = 9000;
const uint16_t serverUDPPort = 9999;

AsyncUDP udp;
Adafruit_NeoPixel strip(NUM_PIXELS, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

struct RainbowParams {
  uint16_t delta;
  uint8_t brightness;
};

struct ChasingParams {
  uint16_t hueWidth;
  uint16_t hueDelta;
  uint8_t brightness;
};

struct BreathingParams {
  uint16_t hue;
  uint8_t delta;
  uint8_t brightness;
};

struct SolidParams {
  uint16_t hue;
  uint8_t brightness;
};

union Options {
  struct RainbowParams rainbowParams;
  struct ChasingParams chasingParams;
  struct BreathingParams breathingParams;
  struct SolidParams solidParams;
  struct {
  } onOrOffParams;
};

struct ServerMessage {
  uint8_t size;
  uint8_t opCode;
  union Options options;
};

struct SyncMessage {
  uint8_t size;
  uint16_t hue;
  uint16_t rainbowDelta;
  uint16_t chasingHueWidth;
  uint16_t chasingHueDelta;
  uint8_t breathingDelta;
  uint8_t state;
  uint8_t brightness;
};

enum State {
  RAINBOW,
  RAINBOW_OFF,
  BREATHING,
  BREATHING_OFF,
  CHASING,
  CHASING_OFF,
  SOLID,
  SOLID_OFF
};

enum OpCode {
  ON = 0,
  OFF = 1,
  OP_CHASING = 2,
  OP_SOLID = 3,
  OP_RAINBOW = 4,
  OP_BREATHING = 5,
  OP_STATUS = 0xFF,
};

State currentState = State::RAINBOW;
struct BreathingParams breathingParams = { .delta = 8 };
struct RainbowParams rainbowParams = { .delta = 300, .brightness = 255 };
struct ChasingParams chasingParams = { .hueWidth = 16384 / 8, .hueDelta = 256, .brightness = 255 };
struct SolidParams solidParams = { .hue = 0, .brightness = 255 };

struct {
  uint16_t offset;
} rainbowState = { .offset = 0 };

struct {
  uint16_t start_hue;
} chasingState = { .start_hue = 0 };

struct {
  uint8_t t;
} breathingState = { .t = 0 };

struct {
  uint8_t brightness;
  uint16_t hue;
  uint32_t colour;
} sharedState = { .brightness = 64, .hue = 0, .colour = 0 };

inline void handleCurrentState() {
  strip.clear();
  switch (currentState) {
    case RAINBOW:
      rainbowState.offset += rainbowParams.delta;
      strip.setBrightness(sharedState.brightness);
      strip.rainbow(rainbowState.offset, 1, 255, 255, true);
      break;

    case BREATHING:
      sharedState.colour = strip.gamma32(strip.ColorHSV(sharedState.hue, 255, 255));
      strip.fill(sharedState.colour);

      strip.setBrightness(strip.sine8(breathingState.t));
      breathingState.t += breathingParams.delta;
      break;

    case CHASING:
      strip.setBrightness(sharedState.brightness);
      for (int i = 0; i < NUM_PIXELS; i++) {
        strip.setPixelColor(i,
                            strip.gamma32(
                              strip.ColorHSV(chasingState.start_hue + i * (chasingParams.hueWidth / NUM_PIXELS), 255, 255)));
      }
      chasingState.start_hue += chasingParams.hueDelta;
      break;

    case SOLID:
      strip.setBrightness(sharedState.brightness);
      strip.fill(strip.gamma32(strip.ColorHSV(sharedState.hue, 255, 255)));
      break;

    case RAINBOW_OFF:
    case BREATHING_OFF:
    case CHASING_OFF:
    case SOLID_OFF:
      break;
  }

  strip.show();
}

void printServerMessage(struct ServerMessage* message) {
  switch (message->opCode) {
    case OpCode::OP_RAINBOW:
      Serial.printf("Command: RAINBOW: delta: %u, brightness: %u\n", message->options.rainbowParams.delta, message->options.rainbowParams.brightness);
      break;
    case OpCode::OP_BREATHING:
      Serial.printf("Command: BREATHING: hue: %u, delta: %u, brightness: %u\n",
                    message->options.breathingParams.hue,
                    message->options.breathingParams.delta,
                    message->options.breathingParams.brightness);
      break;
    case OpCode::OP_CHASING:
      Serial.printf("Command: CHASING: hueWidth: %u, hueDelta: %u, brightness: %u\n",
                    message->options.chasingParams.hueWidth,
                    message->options.chasingParams.hueDelta,
                    message->options.chasingParams.brightness);
      break;
    case OpCode::OP_SOLID:
      Serial.printf("Command: SOLID: hue: %u, brightness: %u\n",
                    message->options.solidParams.hue,
                    message->options.solidParams.brightness);
      break;
    case OpCode::ON:
      Serial.printf("Command: ON\n");
      break;
    case OpCode::OFF:
      Serial.printf("Command: OFF\n");
      break;
    case OpCode::OP_STATUS:
      Serial.print("Command: STATUS\n");
      break;
  }
}

void ingestPacket(AsyncUDPPacket packet) {
  if (packet.remoteIP() != serverAddress || packet.isBroadcast() || packet.isMulticast()) {  // Drop packet if not coming directly from configured control server
    Serial.print("Dropping packet from unknown host: ");
    Serial.println(packet.remoteIP());
    return;
  }

  uint8_t* data = packet.data();

  if (data[0] != packet.length()) {
    Serial.println("Received broken packet");
    return;
  }
  struct ServerMessage* message = (struct ServerMessage*)data;
  printServerMessage(message);
  switch (message->opCode) {
    case OpCode::OP_RAINBOW:
      rainbowParams.delta = message->options.rainbowParams.delta;
      sharedState.brightness = message->options.rainbowParams.brightness;
      currentState = State::RAINBOW;
      break;
    case OpCode::OP_CHASING:
      chasingParams.hueDelta = message->options.chasingParams.hueDelta;
      chasingParams.hueWidth = message->options.chasingParams.hueWidth;
      sharedState.brightness = message->options.chasingParams.brightness;
      currentState = State::CHASING;
      break;
    case OpCode::OP_BREATHING:
      breathingParams.delta = message->options.breathingParams.delta;
      sharedState.hue = message->options.breathingParams.hue;
      sharedState.brightness = message->options.breathingParams.brightness;
      currentState = State::BREATHING;
      break;
    case OpCode::OP_SOLID:
      sharedState.brightness = message->options.solidParams.brightness;
      sharedState.hue = message->options.solidParams.hue;
      currentState = State::SOLID;
      break;
    case OpCode::ON:
    case OpCode::OFF:
      switch (currentState) {
        case RAINBOW:
          if (message->opCode == OpCode::OFF)
            currentState = State::RAINBOW_OFF;
          break;
        case RAINBOW_OFF:
          if (message->opCode == OpCode::ON)
            currentState = State::RAINBOW;
          break;
        case BREATHING:
          if (message->opCode == OpCode::OFF)
            currentState = State::BREATHING_OFF;
          break;
        case BREATHING_OFF:
          if (message->opCode == OpCode::ON)
            currentState = State::BREATHING;
          break;
        case CHASING:
          if (message->opCode == OpCode::OFF)
            currentState = State::CHASING_OFF;
          break;
        case CHASING_OFF:
          if (message->opCode == OpCode::ON)
            currentState = State::CHASING;
          break;
        case SOLID:
          if (message->opCode == OpCode::OFF)
            currentState = State::SOLID_OFF;
          break;
        case SOLID_OFF:
          if (message->opCode == OpCode::ON)
            currentState = State::SOLID;
          break;
      }
      break;
    case OpCode::OP_STATUS:
      syncCurrentStatus();
      break;
  }
}

// Marshalls current status into a packet that can be interpreted by the control server
inline void packCurrentStatus(uint8_t* p) {
  uint16_t* asUint16 = (uint16_t*)(p + 1);
  // p[0]   - size
  p[0] = 12;
  // p[1-2] - hue
  asUint16[0] = sharedState.hue;
  // p[3-4] - rainbow delta
  asUint16[1] = rainbowParams.delta;
  // p[5-6] - chasing hue width
  asUint16[2] = chasingParams.hueWidth;
  // p[7-8] - chasing hue delta
  asUint16[3] = chasingParams.hueDelta;
  // p[9]   - breathing delta
  p[9] = breathingParams.delta;
  // p[10]  - state
  p[10] = (uint8_t)currentState;
  // p[11]  - brightness
  p[11] = sharedState.brightness;
}

// Send packet with current state and animation paramters to control server
inline void syncCurrentStatus() {
  uint8_t packet[12];
  packCurrentStatus(packet);
  udp.writeTo(packet, 12, serverAddress, serverUDPPort);
}

// Set up UDP server to start accepting commands from control server
inline void startListening() {
  if (udp.listen(localUDPPort)) {
    Serial.printf("listening on port %u IP: ", localUDPPort);
    Serial.println(WiFi.localIP());
    udp.onPacket(ingestPacket);
    Serial.println("Attached listener for packets");
  } else {
    Serial.println("Failed to start listening");
    HANG()
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Attempting to configure static IP address");

  WiFi.mode(WIFI_STA);
  if (!WiFi.config(localIP, gateway, subnet, primaryDNS)) {
    Serial.println("Failed to configure static IP");
    HANG()
  }
  WiFi.begin(ssid, password);

  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }

  Serial.println("\nWiFi connected.");

  currentState = State::SOLID_OFF;
  strip.begin();
  strip.show();

  delay(10);

  Serial.printf("Attempting to listen on udp port %u\n", localUDPPort);
  startListening();
}

void loop() {
  handleCurrentState();
  delay(25);
}
