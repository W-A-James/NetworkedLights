package mcu

import (
	"bytes"
	"fmt"
	"log"
	"net"
	"os"
	"sync"
	"time"
)

type CommandServer struct {
	mcuAddress string // host:port pair of MCU
	port       int    // local udp port to listen on

	mcuStatusLock *sync.Mutex
	mcuStatus     StatusMessage

	conn  *net.UDPConn
	close chan any
}

func NewCommandServer(mcuAddress string, port int) (*CommandServer, error) {
	var cs CommandServer
	var err error
	cs.close = make(chan any)

	cs.mcuAddress = mcuAddress
	s, err := net.ResolveUDPAddr("udp", fmt.Sprintf(":%v", port))
	c, err := net.ListenUDP("udp", s)

	if err != nil {
		return &cs, err
	}

	cs.conn = c

	// Start
	go func() {
		buffer := make([]byte, 64)
		defer cs.conn.Close()
		for {
			select {
			case <-cs.close:
				return
			default:
				n, addr, err := cs.conn.ReadFromUDP(buffer)
				log.Printf("Read %v bytes from %v\n", n, addr)

				if n != 0 {
					if addr.String() != cs.mcuAddress {
						fmt.Fprintf(os.Stderr, "Dropping packet\n")
					}
					// Create MCU status message from buffer
					log.Println("locking")
					cs.mcuStatusLock.Lock()
					cs.mcuStatus, err = NewStatusMessage(bytes.NewBuffer(buffer[0 : n-1]))
					log.Println("unlocking")
					cs.mcuStatusLock.Unlock()
				}
				if err != nil {
					log.Printf("Failed with error %v\n", err)
				}
			}
			time.Sleep(time.Millisecond * 100)
		}
	}()

	return &cs, nil
}

func (cs *CommandServer) SendMessage(message CommandMessage) error {
	// FIXME: target the MCU's ip and port
	s, err := net.ResolveUDPAddr("udp", cs.mcuAddress)
	if err != nil {
		return err
	}

	log.Println("Sending message to mcu")
	conn, err := net.DialUDP("udp", nil, s)
	if err != nil {
		return err
	}
	log.Println("Set up socket to send message to mcu")
	defer conn.Close()

	b := message.buff.Bytes()
	n, err := conn.Write(b)
	if err != nil {
		log.Println(err)
		return err
	}
	log.Printf("Successfully Sent %v bytes to %v", n, s)

	return nil
}

func (cs *CommandServer) Close() {
	cs.close <- "close"
}

func (cs *CommandServer) GetMCUStatus() StatusMessage {
	cs.mcuStatusLock.Lock()
	defer cs.mcuStatusLock.Unlock()
	return cs.mcuStatus
}
