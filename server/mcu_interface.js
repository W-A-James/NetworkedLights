import dgram from 'node:dgram';
import { CommandMessage, MCUStatusMessage } from './message.js';

export class MCU {
  constructor(port, mcuIP, mcuPort) {
    if (typeof port !== 'number' || Number.isNaN(port)) throw new Error(`port must be a number; got: ${port}`);
    if (typeof mcuIP !== 'string') throw new Error(`mcuIP must be a string representing MCU IP address; got: ${mcuIP}`);
    if (typeof mcuPort !== 'number' || Number.isNaN(mcuPort)) throw new Error(`mcuPort must be a number; got: ${mcuPort}`);
    this.port = port;
    this.mcuIP = mcuIP;
    this.mcuPort = mcuPort;
    this.currentStatus = undefined;

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
