import dgram from 'node:dgram';
import { config } from 'dotenv';
import { CommandMessage, MCUStatusMessage } from './message.js';

config();

export class MCU {
  constructor (port) {
    this.mcuIP = process.env.NEOPIXEL_LIGHTS_IP ?? '192.168.1.220';
    this.mcuPort = Number(process.env.NEOPIXEL_LIGHTS_UDP_PORT ?? '9000');
    this.currentStatus = {};
    this.port = port;
    this.server = dgram.createSocket('udp4');

    this.server.on('error', (err) => {
      console.error(err);
    });

    this.server.on('message', (msg, rinfo) => {
      /** @type {StatusMessage} */
      let statusMessage;
      try {
        statusMessage = new MCUStatusMessage(msg).decode();
        this.currentStatus = statusMessage;
      } catch (e) {
        console.error(e);
      }
    });

    this.server.on('listening', () => {
      console.log(`UDP server listening ${this.server.address().address}:${this.server.address().port}`);
    });

    this.server.bind(this.port);
  }

  /**
    * @param message {CommandMessage}
    * @returns {Promise<void>}
    * */
  async sendCommand (message) {
    const sendSocket = dgram.createSocket('udp4');
    await new Promise((resolve, reject) => {
      sendSocket.send(message.buffer, this.mcuPort, this.mcuIP, (err) => {
        if (err) {
          sendSocket.close(() => { reject(err); });
        } else {
          sendSocket.close(resolve);
        }
      });
    });
  }

  async sendStatusRequest () {
    const sendSocket = dgram.createSocket('udp4');
    const message = new CommandMessage('status', {});
    await new Promise((resolve, reject) => {
      sendSocket.send(message, this.mcuPort, this.mcuIP, (err) => {
        if (err) {
          sendSocket.close(() => { reject(err); });
        } else {
          sendSocket.close(resolve)
        }
      });
    });
  }

  close () {
    this.server.close();
  }
};
