package main

import (
	"bytes"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"sync"
)

type CommandServer struct {
	mcuAddress string
	port       int

	mcuStatusLock *sync.Mutex
	mcuStatus     StatusMessage

	udpServer net.PacketConn
	close chan any
	bytes     []byte
}

func NewCommandServer(mcuAddress string, port int) (CommandServer, error) {
	var cs CommandServer
	var err error
	cs.close = make(chan any)
	cs.udpServer, err = net.ListenPacket("udp4", mcuAddress)
	cs.bytes = make([]byte, 7)

	if err != nil {
		return cs, err
	}

	go func() {
		for {
			select {
			case <-cs.close:
        return
			default:
				n, addr, err := cs.udpServer.ReadFrom(cs.bytes)
				if err != nil {
					log.Fatalf("Failed with error %v\n", err)
				}
				log.Printf("Read %v bytes from %v\n", n, addr)

				if addr.String() != cs.mcuAddress {
					fmt.Fprintf(os.Stderr, "Dropping packed\n")
				}
				// Create MCU status message from buffer
				cs.mcuStatusLock.Lock()
				cs.mcuStatus, err = StatusMessageFromBuffer(*bytes.NewBuffer(cs.bytes))
				cs.mcuStatusLock.Unlock()
			}
		}
	}()

	return cs, nil
}

func (cs CommandServer) SendMessage(message CommandMessage) error {
	udpServer, err := net.ResolveUDPAddr("udp", strconv.Itoa(cs.port))
	if err != nil {
		return err
	}

	conn, err := net.DialUDP("udp", nil, udpServer)
	if err != nil {
		return err
	}
	defer conn.Close()

	_, err = conn.Write(message.buff.Bytes())
	if err != nil {
		return err
	}

	return nil
}

func (cs CommandServer) Close() error {
  cs.close <- "close"
  close(cs.close)
	return cs.udpServer.Close()
}

func (cs CommandServer) GetMCUStatus() StatusMessage {
	cs.mcuStatusLock.Lock()
	defer cs.mcuStatusLock.Unlock()
	return cs.mcuStatus
}
