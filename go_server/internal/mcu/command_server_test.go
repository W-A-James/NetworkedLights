package mcu

import (
	"os/exec"
	"testing"
	"time"
)

func TestSendMessage(t *testing.T) {
  t.Parallel()
	t.Log("starting test")
	mockMCU := exec.Command("../../bin/mock_mcu")
	err := mockMCU.Start()
	if err != nil {
		t.Fatalf("Failed to start mock mcu")
	}

	cs, err := NewCommandServer("127.0.0.1:9999", 9998)
	if err != nil {
		t.Fatalf("Failed to start Command Server: %v", err)
	}
	defer cs.Close()

	t.Log("Started command server")

	t.Log("building status message")
	statusCommand := NewCommandMessage()
	statusCommand.Status()
	t.Log("built command message")

	// Sleep before sending command to mock mcu
	time.Sleep(time.Second * 5)
	t.Log("Sending message")
	err = cs.SendMessage(statusCommand)
	if err != nil {
		t.Fatalf("Failed to send message: %v", err)
	}

	t.Log("waiting for subprocess to exit")
	err = mockMCU.Wait()
	if err != nil {
		t.Log("failed to wait for process exit", err)
	} else {
		t.Log("subprocess exited")
	}
}

func TestClose(t *testing.T) {}

func TestGetMCUStatus(t *testing.T) {
}
