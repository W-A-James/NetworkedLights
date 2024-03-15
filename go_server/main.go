package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
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

func makeRouter(commandServer *CommandServer) *gin.Engine {
	var err error
	router := gin.Default()
	router.Static("/", "../server/public")

	// Establish /api POST endpoint
	// On POST
	//  serialize a command message from the data in the POST request
	//  send message to MCU
	commandPostEndpoint := func(c *gin.Context) {
		var jsonData ClientCommand

		if c.Bind(&jsonData) == nil {
			command := NewCommandMessage()
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
			err = commandServer.SendMessage(command)
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
		statusMessage := NewCommandMessage()
		statusMessage.Status()
		err := commandServer.SendMessage(statusMessage)
		if err != nil {
			log.Printf("Failed to send status message: %v\n", err)
		}
	}
	router.GET("/api/status", statusGETApiEndpoint)
	router.POST("/api/command", commandPostEndpoint)

	return router
}

func getEnvVariables() (Env, error) {
	// Load environment variables
	//  MCU_IP               - IP of MCU controlling lights
	//  MCU_UDP_PORT         - UDP port of MCU controlling lights
	//  NET_LIGHTS_TCP_PORT  - TCP port to open HTTP server on
	//  NET_LIGHTS_UDP_PORT  - TCP port to communicate with MCU on

	var env Env
	var err error

	env.mcuIp = os.Getenv("MCU_IP")
	env.mcuUdpPort, err = strconv.Atoi(os.Getenv("MCU_UDP_PORT"))
	if err != nil {
		return env, err
	}

	env.netLightsTcpPort, err = strconv.Atoi(os.Getenv("NET_LIGHTS_TCP_PORT"))
	if err != nil {
		return env, err
	}

	env.netLightsUdpPort, err = strconv.Atoi(os.Getenv("NET_LIGHTS_UDP_PORT"))
	if err != nil {
		return env, err
	}

	return env, nil
}

func main() {
	env, err := getEnvVariables()
	if err != nil {
		log.Fatalln(err)
	}

	commandServer, err := NewCommandServer(env.mcuIp, env.mcuUdpPort)
	if err != nil {
		log.Fatalf("Failed to initialize command server: %v\n", err)
	}

	router := makeRouter(&commandServer)

	router.Run(fmt.Sprintf(":%v", env.netLightsTcpPort))
}
