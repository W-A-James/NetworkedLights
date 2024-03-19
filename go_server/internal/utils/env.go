package utils

import (
	"os"
	"strconv"
)

type Env struct {
	McuIp            string
	McuUdpPort       int
	NetLightsTcpPort int
	NetLightsUdpPort int
}

func GetEnvVariables() (Env, error) {
	// Load environment variables
	//  MCU_IP               - IP of MCU controlling lights
	//  MCU_UDP_PORT         - UDP port of MCU controlling lights
	//  NET_LIGHTS_TCP_PORT  - TCP port to open HTTP server on
	//  NET_LIGHTS_UDP_PORT  - TCP port to communicate with MCU on

	var env Env
	var err error

	env.McuIp = os.Getenv("MCU_IP")
	env.McuUdpPort, err = strconv.Atoi(os.Getenv("MCU_UDP_PORT"))
	if err != nil {
		return env, err
	}

	env.NetLightsTcpPort, err = strconv.Atoi(os.Getenv("NET_LIGHTS_TCP_PORT"))
	if err != nil {
		return env, err
	}

	env.NetLightsUdpPort, err = strconv.Atoi(os.Getenv("NET_LIGHTS_UDP_PORT"))
	if err != nil {
		return env, err
	}

	return env, nil
}
