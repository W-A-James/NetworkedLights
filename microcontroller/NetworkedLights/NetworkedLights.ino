#include <Adafruit_NeoPixel.h>

/*
 WiFi Web Server LED Blink

 A simple web server that lets you blink an LED via the web.
 This sketch will print the IP address of your WiFi Shield (once connected)
 to the Serial monitor. From there, you can open that address in a web browser
 to turn on and off the LED on pin 26

 If the IP address of your shield is yourAddress:
 http://yourAddress/H turns the LED on
 http://yourAddress/L turns it off

 This example is written for a network using WPA2 encryption. For insecure
 WEP or WPA, change the Wifi.begin() call and use Wifi.setMinSecurity() accordingly.

 Circuit:
 * WiFi shield attached
 * LED attached to pin 26

 created for arduino 25 Nov 2012
 by Tom Igoe

ported for sparkfun esp32 
31.01.2017 by Jan Hendrik Berlin
 
 */
#define PIXEL_PIN 25
#define NUM_PIXELS 50

#include <WiFi.h>
#include "AsyncUDP.h"

const char* ssid = "MyOptimum b6867b_EXT";
const char* password = "51-pink-5831";

const IPAddress serverAddress(192, 168, 1, 228);
const IPAddress localIP(192, 168, 1, 220);
const IPAddress gateway(192, 168, 1, 1);
const IPAddress subnet(255, 255, 255, 0);
const IPAddress primaryDNS(8, 8, 8, 8);
const uint16_t serverPort = 1234;

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
  struct RainbowParams rainbowParams;
  struct ChasingParams chasingParams;
  struct BreathingParams breathingParams;
  struct SolidParams solidParams;
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
  OP_BREATHING = 5
};

State currentState = State::SOLID_OFF;
struct BreathingParams breathingParams = { .delta = 1 };
struct RainbowParams rainbowParams = { .delta = 300, .brightness = 255 };
struct ChasingParams chasingParams = { .hueWidth = 16384, .hueDelta = 256, .brightness = 255 };
struct SolidParams solidParams = { .hue = 0, .brightness = 255 };

struct {
  uint16_t offset;
} rainbow_state = { .offset = 0 };

struct {
  uint16_t start_hue;
} chasing_state = { .start_hue = 0 };

struct {
  uint8_t t;
} breathing_state = { .t = 0 };

struct {
  uint8_t brightness;
  uint16_t hue;
  uint32_t colour;
} shared_state = { .brightness = 255, .hue = 0, .colour = 0 };

inline void handleCurrentState() {
  strip.clear();
  switch (currentState) {
    case RAINBOW:
      rainbow_state.offset += rainbowParams.delta;
      strip.setBrightness(shared_state.brightness);
      strip.rainbow(rainbow_state.offset, 1, 255, 255, true);
      break;

    case BREATHING:
      shared_state.colour = strip.gamma32(strip.ColorHSV(shared_state.hue, 255, 255));
      strip.fill(shared_state.colour);

      strip.setBrightness(strip.sine8(breathing_state.t));
      breathing_state.t += breathingParams.delta;
      break;

    case CHASING:
      strip.setBrightness(shared_state.brightness);
      for (int i = 0; i < NUM_PIXELS; i++) {
        strip.setPixelColor(i,
                            strip.gamma32(
                              strip.ColorHSV(chasing_state.start_hue + (chasingParams.hueWidth / NUM_PIXELS), 255, 255)));
      }
      chasing_state.start_hue += chasingParams.hueDelta;
      break;

    case SOLID:
      strip.setBrightness(0);
      break;

    case RAINBOW_OFF:
    case BREATHING_OFF:
    case CHASING_OFF:
    case SOLID_OFF:
      break;
  }

  strip.show();
}

inline void ingestPacket(AsyncUDPPacket& packet) {
  uint8_t* data = packet.data();
  struct ServerMessage* message = (struct ServerMessage*)data;

  switch (message->opCode) {
    case OpCode::OP_RAINBOW:
      rainbowParams.delta = message->options.rainbowParams.delta;
      rainbowParams.brightness = message->options.rainbowParams.brightness;
      currentState = State::RAINBOW;
      break;
    case OpCode::OP_CHASING:
      chasingParams.hueDelta = message->options.chasingParams.hueDelta;
      chasingParams.hueWidth = message->options.chasingParams.hueWidth;
      chasingParams.brightness = message->options.chasingParams.brightness;
      currentState = State::CHASING;
      break;
    case OpCode::OP_BREATHING:
      breathingParams.delta = message->options.breathingParams.delta;
      breathingParams.hue = message->options.breathingParams.hue;
      breathingParams.brightness = message->options.breathingParams.brightness;
      currentState = State::BREATHING;
      break;
    case OpCode::OP_SOLID:
      solidParams.brightness = message->options.solidParams.brightness;
      solidParams.hue = message->options.solidParams.hue;
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
  }
}

void syncCurrentParams() {
  struct SyncMessage message {.breathingParams=breathingParams, .chasingParams=chasingParams, .rainbowParams=rainbowParams, .solidParams=solidParams};

  // TODO: figure out how to send message.
  AsyncUDPMessage udpMessage;
  udp.send();
}


void setup() {
  Serial.begin(115200);
  Serial.println("test");
  Serial.println("Attempting to configure static IP address");
  //WiFi.mode(WIFI_STA);
  if (!WiFi.config(localIP, gateway, subnet, primaryDNS)) {
    Serial.println("Failed to configure static IP");
  }
  WiFi.begin(ssid, password);

  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }

  Serial.println("\nWiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  strip.begin();
  strip.show();

  delay(10);

  Serial.printf("Attempting to listen on udp port %u\n", serverPort);
  if (udp.listen(serverPort)) {
    Serial.printf("listening on port %u\n", serverPort);
    udp.onPacket([](AsyncUDPPacket packet) {
      Serial.print("UDP Packet Type: ");
      Serial.print(packet.isBroadcast() ? "Broadcast" : packet.isMulticast() ? "Multicast"
                                                                             : "Unicast");
      // Check that size matches length
      if (packet.data()[0] != packet.length()) {
        Serial.println("Received broken packet");
        return;
      }

      ingestPacket(packet);


      packet.printf("Got %u bytes of data", packet.length());
    });
    Serial.println("Attached listener for packets");
  } else {
    Serial.println("Failed to start listening");
  }
}

void loop() {


  handleCurrentState();
  delay(100);
}
