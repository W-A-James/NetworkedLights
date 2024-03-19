package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"time"
)

type msg struct {
	op   uint8
	size uint8
}

type MockMCU struct {
	conn  *net.UDPConn
	close chan any

	report chan msg
}

func (m *MockMCU) error() {
	m.report <- msg{
		op:   99,
		size: 99,
	}
}

func (m *MockMCU) runServer() {
	fmt.Println("Starting select loop")
	buffer := make([]byte, 32)
	for {
		select {
		case <-m.close:
			return
		default:
			fmt.Println("entering processing")
			time.Sleep(time.Second)
			m.conn.SetReadDeadline(time.Now().Add(time.Second * 10))
			fmt.Println("Waiting to read from connection")
			n, addr, err := m.conn.ReadFrom(buffer)
			fmt.Println("Finished reading")

			if err != nil {
				m.error()
				return
			}

			if n != 0 { // Didn't err
				fmt.Printf("Got %v bytes from %v\n", n, addr.String())
				if n != int(buffer[0]) {
					m.error()
					return
				} else {
					m.report <- msg{
						size: buffer[0],
						op:   buffer[1],
					}
					return
				}
			} else {
				m.error()
				return
			}
		}
	}
}

func NewMockMCU() MockMCU {
	mock := MockMCU{}
	var err error
	mock.close = make(chan any)
	mock.report = make(chan msg)

	s, err := net.ResolveUDPAddr("udp", ":9999")
	mock.conn, err = net.ListenUDP("udp", s)
	if err != nil {
		log.Fatalf("Failed to set up mock MCU listener: %v\n", err)
	}

	fmt.Printf("Started listening on %v %v\n", s.Network(), s.String())

	go mock.runServer()

	return mock
}

func (m MockMCU) Close() {
	fmt.Println("Closing mock mcu")
	defer m.conn.Close()
	m.close <- "close"
	close(m.close)
  close(m.report)
}

func main() {
	mcu := NewMockMCU()
	defer mcu.Close()

	report := <-mcu.report
	if report.size == 99 {
		fmt.Println("Failure")
		os.Exit(1)
	} else {
		fmt.Println("Success")
		os.Exit(0)
	}
}
