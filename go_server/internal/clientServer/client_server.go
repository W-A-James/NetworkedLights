package clientserver

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"networked_lights_server/internal/mcu"
)

type ClientCommand struct {
	op   string
	opts struct {
		Hue        uint16 `json:"hue"`
		Brightness uint8  `json:"brightness"`
		Delta      uint16 `json:"delta"`
		HueDelta   uint16 `json:"hueDelta"`
		HueWidth   uint16 `json:"hueWidth"`
	}
}

type Env struct {
	mcuIp            string
	mcuUdpPort       int
	netLightsTcpPort int
	netLightsUdpPort int
}

type Server struct {
	commandServer *mcu.CommandServer
	router        *gin.Engine
	mcuAddress    string
	mcuUdpPort    int
	httpPort      int
}

func NewServer(mcuAddress string, mcuUdpPort int, httpPort int) Server {
	var s Server
	var err error

	s.mcuAddress = mcuAddress
	s.mcuUdpPort = mcuUdpPort
	s.httpPort = httpPort
	// make command server
	s.commandServer, err = mcu.NewCommandServer(mcuAddress, mcuUdpPort)
	if err != nil {
		log.Fatalf("Failed to initialize command server: %v\n", err)
	}
	s.makeRouter()

	// make router
	return s
}

func (s *Server) Start() {
	s.router.Run(fmt.Sprintf(":%v", s.httpPort))
}

func (s *Server) makeRouter() {
	var err error
	s.router = gin.Default()
	s.router.Static("/", "../../../server/public")

	// Establish /api POST endpoint
	// On POST
	//  serialize a command message from the data in the POST request
	//  send message to MCU
	commandPostEndpoint := func(c *gin.Context) {
		var jsonData ClientCommand

		if c.Bind(&jsonData) == nil {
			command := mcu.NewCommandMessage()
			switch jsonData.op {
			case "rainbow":
				command.Rainbow(jsonData.opts.Delta, jsonData.opts.Brightness)
				break
			case "chasing":
				command.Chasing(jsonData.opts.HueWidth, jsonData.opts.HueDelta, jsonData.opts.Brightness)
				break
			case "breathing":
				command.Chasing(jsonData.opts.HueWidth, jsonData.opts.HueDelta, jsonData.opts.Brightness)
				break
			case "on":
			case "off":
				command.Power()
				break
			case "solid":
				command.Solid(jsonData.opts.Hue, uint8(jsonData.opts.Delta))
				break
			default:
				log.Fatalln("Unidentified options")
			}
			err = s.commandServer.SendMessage(command)
			if err != nil {
				log.Printf("Failed to write message: %v\n", err)
			}
		}
	}

	// Establish /api GET endpoint
	// On Get
	//  send status request to MCU
	//  marshall status request to send to client
	//  reply to client with MCU status
	statusGETApiEndpoint := func(c *gin.Context) {
		statusMessage := mcu.NewCommandMessage()
		statusMessage.Status()
		err := s.commandServer.SendMessage(statusMessage)
		if err != nil {
			log.Printf("Failed to send status message: %v\n", err)
		}
	}
	s.router.GET("/api/status", statusGETApiEndpoint)
	s.router.POST("/api/command", commandPostEndpoint)
}
