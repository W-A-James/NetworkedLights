import dgram from 'node:dgram';
import { config } from 'dotenv';
import { CommandMessage, MCUStatusMessage } from './message.js';

config();

export class MCU {
  constructor(port) {
    this.mcuIP = process.env.NEOPIXEL_LIGHTS_IP ?? '192.168.1.220';
    this.mcuPort = Number(process.env.NEOPIXEL_LIGHTS_UDP_PORT ?? '9000');
    this.currentStatus = undefined;
    this.port = port;

    this.server = dgram.createSocket('udp4');

    this.server.on('listening', () => {
      console.log(`Listening on UDP port ${this.port}`);
    });
    this.server.on('message', (message, rinfo) => {
      if (rinfo.address !== this.mcuIP) {
        console.error('dropping packet');
        return;
      }
      try {
        const status = new MCUStatusMessage(message).decode();
        this.currentStatus = status;
      } catch (e) {
        console.error(e);
      }
    });
    this.server.bind(this.port);
  }

  /**
    * @param message {CommandMessage}
    * @returns {Promise<void>}
    * */
  async sendCommand(message) {
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

  /** @returns {Promise<StatusMessage>} */
  async sendStatusRequest() {
    const message = new CommandMessage('status', {});
    return await new Promise((resolve, reject) => {
      this.server.send(message.buffer, this.mcuPort, this.mcuIP, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  close() {
    this.server.close();
  }
};
