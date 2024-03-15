package main

import (
	"bytes"
	"errors"
	"os"
)

type StatusMessage struct {
	size            uint8
	hue             uint16
	rainbowDelta    uint16
	chasingHueWidth uint16
	chasingHueDelta uint16
	breathingDelta  uint8
	state           uint8
	brightness      uint8
}

func checkErr(err error) {
	if err != nil {
		os.Exit(1)
	}
}

func readUint16LE(buf *bytes.Buffer) (uint16, error) {
	var b0, b1 uint8
	var err error

	b0, err = buf.ReadByte()
	if err != nil {
		return 0, err
	}

	b1, err = buf.ReadByte()
	if err != nil {
		return 0, err
	}

	return (uint16(b0)) | (uint16(b1) << 8), nil

}

func StatusMessageFromBuffer(buffer bytes.Buffer) (StatusMessage, error) {
	var status StatusMessage
	var err error

	if buffer.Len() != 12 {
		return status, errors.New("Incorrectly sized packed: Wrong length")
	}

	status.size, err = buffer.ReadByte()

	if err != nil {
		return status, err
	}

	if status.size != 12 {
		return status, errors.New("Malformed packed: Size should be first byte")
	}

	status.hue, err = readUint16LE(&buffer)
	if err != nil {
		return status, err
	}

	status.rainbowDelta, err = readUint16LE(&buffer)
	if err != nil {
		return status, err
	}

	status.chasingHueDelta, err = readUint16LE(&buffer)
	if err != nil {
		return status, err
	}

	status.chasingHueDelta, err = readUint16LE(&buffer)
	if err != nil {
		return status, err
	}

	status.breathingDelta, err = buffer.ReadByte()
	if err != nil {
		return status, err
	}

	status.state, err = buffer.ReadByte()
	if err != nil {
		return status, err
	}

	switch status.state {
	case 0, 1, 2, 3, 4, 5, 6, 7:
		break
	default:
		return status, errors.New("Unknown state code")
	}

	status.brightness, err = buffer.ReadByte()
	if err != nil {
		return status, err
	}

	return status, nil
}

func (sm StatusMessage) GetStateString() (string, error) {
	switch sm.state {
	case 0:
		return "rainbow", nil
	case 1:
		return "rainbowOff", nil
	case 2:
		return "breathing", nil
	case 3:
		return "breathingOff", nil
	case 4:
		return "chasing", nil
	case 5:
		return "chasingOff", nil
	case 6:
		return "solid", nil
	case 7:
		return "solidOff", nil
	default:
		return "", errors.New("Unknown state code")
	}
}
