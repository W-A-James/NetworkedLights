package main

import (
	"errors"
	"testing"
)

func checkSizeAndOpCode(cm *CommandMessage, expectedSize uint8, expectedOpCode uint8, t *testing.T) {
	bytes := cm.buff.Bytes()
	if len(bytes) != int(expectedSize) {
		t.Errorf("Malformed packet. Packet has wrong size. Got %v; Expected: %v", len(bytes), expectedSize)
	}

	if bytes[0] != expectedSize {
		t.Errorf("Malformed packet. Packet size field incorrect. Got %v; Expected: %v\n", bytes[0], expectedSize)
	}

	if bytes[1] != expectedOpCode {
		t.Errorf("Malformed packet. OpCode incorrect. Got %v; Expected: %v\n", bytes[1], expectedOpCode)
	}
}

func getUint16LE(b []uint8, index int) (uint16, error) {
	if index < 0 || index >= len(b)-1 {
		return 0, errors.New("bad index")
	}

	return uint16(b[index]) | (uint16(b[index+1]) << 8), nil
}

func TestPower(t *testing.T) {
	cm := NewCommandMessage()
	cm.Power()

	checkSizeAndOpCode(&cm, PKT_SIZE_ON, OP_ON, t)
}

func TestRainbow(t *testing.T) {
	cm := NewCommandMessage()
	cm.Rainbow(0xaabb, 101)
	checkSizeAndOpCode(&cm, PKT_SIZE_RAINBOW, OP_RAINBOW, t)
	// Check delta
	delta, _ := getUint16LE(cm.buff.Bytes(), 2)
	if delta != 0xaabb {
		t.Errorf("improperly encoded delta. Got: %v; Expected: %v", delta, 0xaabb)
	}

	// check brightness
	brightness := cm.buff.Bytes()[4]
	if brightness != 101 {
		t.Errorf("improperly encoded brightness. Got: %v; Expected: %v", brightness, 101)
	}
}

func TestChasing(t *testing.T) {
	cm := NewCommandMessage()
	cm.Chasing(0xaabb, 0xccdd, 101)
	checkSizeAndOpCode(&cm, PKT_SIZE_CHASING, OP_CHASING, t)
	bytes := cm.buff.Bytes()
	// Check hueWidth
	hueWidth, _ := getUint16LE(bytes, 2)
	if hueWidth != 0xaabb {
		t.Errorf("improperly encoded hueWidth. Got: %v, Expected: %v", hueWidth, 0xaabb)
	}
	// Check hueDelta
	hueDelta, _ := getUint16LE(bytes, 4)
	if hueDelta != 0xccdd {
		t.Errorf("improperly encoded hueWidth. Got: %v, Expected: %v", hueDelta, 0xccdd)
	}
	// Check brightness
	brightness := bytes[6]
	if brightness != 101 {
		t.Errorf("improperly encoded brightness. Got: %v; Expected: %v", brightness, 101)
	}
}

func TestBreathing(t *testing.T) {
	cm := NewCommandMessage()
	cm.Breathing(100, 0xabcd, 102)
	checkSizeAndOpCode(&cm, PKT_SIZE_BREATHING, OP_BREATHING, t)
	bytes := cm.buff.Bytes()
	// Check hue
	hue, _ := getUint16LE(bytes, 2)
	if hue != 0xabcd {
		t.Errorf("improperly encoded hue. Got %v; Expected: %v", hue, 0xabcd)
	}
	// Check delta
	delta := bytes[4]
	if delta != 100 {
		t.Errorf("improperly encoded delta. Got %v; Expected: %v", delta, 100)
	}
	// Check brightness
	brightness := bytes[5]
	if brightness != 102 {
		t.Errorf("improperly encoded brightness. Got %v; Expected: %v", delta, 102)
	}
}

func TestSolid(t *testing.T) {
	cm := NewCommandMessage()
	cm.Solid(0xabcd, 101)
	checkSizeAndOpCode(&cm, PKT_SIZE_SOLID, OP_SOLID, t)

	bytes := cm.buff.Bytes()
	// Check hue
	hue, _ := getUint16LE(bytes, 2)
	if hue != 0xabcd {
		t.Errorf("improperly encoded hue. Got: %v, expected: %v", hue, 0xabcd)
	}
	// Check brightness
	brightness := bytes[4]
	if brightness != 101 {
		t.Errorf("improperly encoded brightness. Got: %v, expected: %v", brightness, 101)
	}
}

func TestStatus(t *testing.T) {
	cm := NewCommandMessage()
	cm.Status()
	checkSizeAndOpCode(&cm, PKT_SIZE_STATUS, OP_STATUS, t)
}
