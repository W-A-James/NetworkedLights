import dgram from 'node:dgram';
import { Message } from './message.js';

const NEOPIXEL_LIGHTS_IP = "192.168.1.220";
const NEOPIXEL_LIGHTS_UDP_PORT = "1234";

export class MCU {
  constructor(port = 9999) {
    this.mcuIP = NEOPIXEL_LIGHTS_IP;
    this.mcuPort = NEOPIXEL_LIGHTS_UDP_PORT;

    this.port = port;

    this.server = dgram.createSocket('udp4');

    this.server.on('error', (err) => { });
    this.server.on('message', (msg, rinfo) => {
    });
    this.server.on('listening', () => {
      console.log(`UDP server listening ${this.server.address().address}:${this.server.address().port}`);
    });

    this.server.send
    this.server.bind(this.port);
  }

  /**
    * @param message {Message}
    * */
  send(message) {
  }

  close() {
    this.server.close();
  }
};


