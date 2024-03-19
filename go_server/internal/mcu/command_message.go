package mcu

import (
	"bytes"
	"encoding/binary"
	"errors"
	"fmt"
)

const (
	OP_ON uint8 = iota
	OP_OFF
	OP_CHASING
	OP_SOLID
	OP_RAINBOW
	OP_BREATHING
	OP_STATUS
)

const (
	PKT_SIZE_ON        uint8 = 2
	PKT_SIZE_OFF             = 2
	PKT_SIZE_CHASING         = 7
	PKT_SIZE_SOLID           = 5
	PKT_SIZE_RAINBOW         = 5
	PKT_SIZE_BREATHING       = 6
	PKT_SIZE_STATUS          = 2
)

const (
	STATUS_RAINBOW uint8 = iota
	STATUS_RAINBOW_OFF
	STATUS_BREATHING
	STATUS_BREATHING_OFF
	STATUS_CHASING
	STATUS_CHASING_OFF
	STATUS_SOLID
	STATUS_SOLID_OFF
)

type CommandMessage struct {
	buff *bytes.Buffer
}

func NewCommandMessage() CommandMessage {
	var c CommandMessage
	c.buff = new(bytes.Buffer)
	return c
}

func setUint16LE(b []uint8, u16 uint16, index int) error {
	if index >= len(b)-1 {
		return errors.New(fmt.Sprintf("arr len: %v, index: %v", len(b), index))
	} else {
		b[index] = uint8(u16 & 0xff)
		b[index+1] = uint8((u16 >> 8) & 0xff)
		return nil
	}

}

func (c *CommandMessage) Power() {
	c.buff.Reset()
	c.buff.WriteByte(PKT_SIZE_ON)
	c.buff.WriteByte(OP_ON)
}

func (c *CommandMessage) Rainbow(delta uint16, brightness uint8) {
	c.buff.Reset()
	c.buff.WriteByte(PKT_SIZE_RAINBOW)
	c.buff.WriteByte(OP_RAINBOW)
	binary.Write(c.buff, binary.LittleEndian, delta)
	c.buff.WriteByte(brightness)
}

func (c *CommandMessage) Chasing(hueWidth uint16, hueDelta uint16, brightness uint8) {
	c.buff.Reset()
	c.buff.WriteByte(PKT_SIZE_CHASING)
	c.buff.WriteByte(OP_CHASING)
	binary.Write(c.buff, binary.LittleEndian, hueWidth)
	binary.Write(c.buff, binary.LittleEndian, hueDelta)
	c.buff.WriteByte(brightness)
}

func (c *CommandMessage) Breathing(delta uint8, hue uint16, brightness uint8) {
	c.buff.Reset()
	c.buff.WriteByte(PKT_SIZE_BREATHING)
	c.buff.WriteByte(OP_BREATHING)
	binary.Write(c.buff, binary.LittleEndian, hue)
	c.buff.WriteByte(delta)
	c.buff.WriteByte(brightness)
}

func (c *CommandMessage) Solid(hue uint16, brightness uint8) {
	c.buff.Reset()
	c.buff.WriteByte(PKT_SIZE_SOLID)
	c.buff.WriteByte(OP_SOLID)
	binary.Write(c.buff, binary.LittleEndian, hue)
	c.buff.WriteByte(brightness)
}

func (c *CommandMessage) Status() {
	c.buff.Reset()
	c.buff.WriteByte(PKT_SIZE_STATUS)
	c.buff.WriteByte(OP_STATUS)
}
