package main

import (
	"net"
	"testing"
)

type MockMCU struct {
  port int
  conn *net.UDPConn
  close chan any
}

func NewMockMCU(port int) {
  var mock MockMCU
  mock.close = make(chan any)

  go func() {
    for {
      select {
      case <- mock.close:
        return
      default:
        mock.conn
      }
    }
  }()
}

func (m MockMCU) Close() {
}

func TestSendMessage(t *testing.T) {}

func TestClose(t *testing.T) {}

func TestGetMCUStatus(t *testing.T) {
}
