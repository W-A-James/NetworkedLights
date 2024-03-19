package main

import (
	"log"

	cs "github.com/W-A-James/NetworkedLights/go_server/internal/clientServer"
	"github.com/W-A-James/NetworkedLights/go_server/internal/utils"
)

func main() {
	var env utils.Env
	var err error

	// get environment variables
	env, err = utils.GetEnvVariables()
	if err != nil {
		log.Fatalln(err)
	}

	// start app
	server := cs.NewServer(env.McuIp, env.McuUdpPort, env.NetLightsTcpPort)
	server.Start()
}
