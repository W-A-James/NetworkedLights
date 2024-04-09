package mcu

import (
	"bytes"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

type StatusTest struct {
	name   string
	status uint8
}

func TestStatusMessageFromBuffer(t *testing.T) {
	t.Run("Test with correctly formed buffer", func(t *testing.T) {
		t.Parallel()
		assert := assert.New(t)
		serializedStatusMessage := [12]byte{
			12,         // size
			0xaa, 0x00, // hue
			0xbb, 0x00, // rainbowDelta
			0xcc, 0x00, // chasingHueWidth
			0xdd, 0x00, // chasingHueDelta
			0x0a,         // breathingDelta
			STATUS_SOLID, // state
			0xff,         // brightness
		}
		buffer := bytes.NewBuffer(serializedStatusMessage[:])

		sm, err := NewStatusMessage(buffer)
		assert.Nil(err, "Expected err to be nil")

		assert.Equal(uint8(12), sm.size, "Incorrect size")
		assert.Equal(uint16(0x00aa), sm.hue, "Incorrect hue")
		assert.Equal(uint16(0x00bb), sm.rainbowDelta, "Incorrect rainbowDelta")
		assert.Equal(uint16(0x00cc), sm.chasingHueWidth, "Incorrect chasingHueWidth")
		assert.Equal(uint16(0x00dd), sm.chasingHueDelta, "Incorrect chasingHueDelta")
		assert.Equal(uint8(0x0a), sm.breathingDelta, "Incorrect breathingDelta")
		assert.Equal(STATUS_SOLID, sm.state, "Incorrect state")
		assert.Equal(uint8(0xff), sm.brightness, "Incorrect state")
	})

	t.Run("Test with incorrect size value", func(t *testing.T) {
		t.Parallel()
		assert := assert.New(t)
		serializedStatusMessage := [12]byte{
			9,          // size
			0x00, 0xaa, // hue
			0x00, 0xbb, // rainbowDelta
			0x00, 0xcc, // chasingHueWidth
			0x00, 0xdd, // chasingHueDelta
			0x0a, // breathingDelta
			0,    // state
			0xff, // brightness
		}

		_, err := NewStatusMessage(bytes.NewBuffer(serializedStatusMessage[:]))
		assert.NotNil(err, "Expected StatusMessage construction to fail due to incorrect size")
	})

	t.Run("Test with unexpected state value", func(t *testing.T) {
		t.Parallel()
		assert := assert.New(t)
		serializedStatusMessage := [12]byte{
			12,         // size
			0xaa, 0x00, // hue
			0xbb, 0x00, // rainbowDelta
			0xcc, 0x00, // chasingHueWidth
			0xdd, 0x00, // chasingHueDelta
			0x0a, // breathingDelta
			99,   // state
			0xff, // brightness
		}

		_, err := NewStatusMessage(bytes.NewBuffer(serializedStatusMessage[:]))
		assert.NotNil(err, "Expected StatusMessage construction to fail due to unknown state value")
	})

	var tests []StatusTest = []StatusTest{
		{"breathing", STATUS_BREATHING},
		{"breathingOff", STATUS_BREATHING_OFF},
		{"chasing", STATUS_CHASING},
		{"chasingOff", STATUS_CHASING_OFF},
		{"rainbow", STATUS_RAINBOW},
		{"rainbowOff", STATUS_RAINBOW_OFF},
		{"solid", STATUS_SOLID},
		{"solidOff", STATUS_SOLID_OFF},
	}

	for _, test := range tests {
		name := test.name
		status := test.status
		t.Run(fmt.Sprintf("Test with %v state", name), func(t *testing.T) {
			t.Parallel()
			assert := assert.New(t)
			serializedStatusMessage := [12]byte{
				12,         // size
				0x00, 0xaa, // hue
				0x00, 0xbb, // rainbowDelta
				0x00, 0xcc, // chasingHueWidth
				0x00, 0xdd, // chasingHueDelta
				0x0a,   // breathingDelta
				status, // state
				0xff,   // brightness
			}

			sm, err := NewStatusMessage(bytes.NewBuffer(serializedStatusMessage[:]))
			assert.Nil(err, "Expected err to be nil")

			assert.Equalf(sm.state, status, "Expected state to be %v", status)
		})
	}
}
