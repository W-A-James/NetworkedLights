# Networked Neopixels

## Summary
This document will lay out the high level design and architecture of a simple ESP32 based networked light display.

## Desired behaviour
* Dynamically changed light patterns
* Browser interface to change light patterns and control light state
* Persistent storage of different patterns

## User stories

The following user stories describe workflows that a user should be able to perform from the browser interface

* User should be able to enable or disable the lights in the user-interface
* User should be able to design and store light patterns
* User should be able to select and enable their previously created patterns

## Protocol

The server will send the microcontroller messages to change the light pattern and parameters over
UDP with messages in the following format:

|  Size  |  OpCode  |      Options     |
|  8bits |  8  bits |  0bits - 40bits  |


### Server Commands

This section details the shapes of the state transition commands sent from the server to the
microcontroller to update the light pattern and parameters.

Commands are encoded in LE byte order.

#### ON
```
| Size | OpCode |
|  7   |  0x0   |
|  8   |    8   |
```

If MCU in state X_OFF transition to state X. Otherwise, no-op;

#### OFF
```
| Size | OpCode |
|  7   |  0x1   |
|  8   |    8   |
```

If MCU in state X transition to state X_OFF. Otherwise, no-op;

#### CHASING
```
| Size | OpCode |              Options             |
|  7   |  0x2   | hueWidth | hueDelta | brightness |
|  8   |    8   |    16    |   16     |     8      |
```

Transition MCU to state CHASING and update hueWidth, hueDelta and brightness;

#### SOLID
```
| Size | OpCode |      Options          |
|  5   |  0x3   |    hue   | brightness |
|  8   |    8   |    16    |      8     | 
```
Transition MCU to state SOLID and update hue and brightness;

#### RAINBOW
```
| Size | OpCode |        Options        |
|  5   |  0x4   |   delta  | brightness |
|  8   |    8   |    16    |     8      |
```
Transition MCU to state RAINBOW and update delta and brightness;

#### BREATHING
```
| Size | OpCode |              Options             |
|  6   |  0x5   |   hue    |   delta  | brightness |
|  8   |    8   |    16    |   8      |     8      |
```

Transition MCU to state BREATHING and update hue, delta and brightness;


### MCU Status reports

This section details the messages the MCU will send to update the server on its current parameters.

```
| Size |  opCode |                        Params                                  |
|  12  |   0xff  | c_hueWidth | c_hueDelta | r_delta | b_delta | brightness | hue |
|  8   |    8    |     16     |     16     |    16   |    8    |     8      |  16 |
```



