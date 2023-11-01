import dgram from 'node:dgram';
import { CommandMessage, MCUStatusMessage, type StatusMessage } from './message';

export class MCU {
  private readonly port: number;
  private readonly mcuIP: string;
  private readonly mcuPort: number;
  private readonly server: dgram.Socket;
  private _currentStatus: StatusMessage | undefined;

  constructor (port: number, mcuIP: string, mcuPort: number) {
    this.port = port;
    this.mcuIP = mcuIP;
    this.mcuPort = mcuPort;
    this._currentStatus = undefined;

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
        this._currentStatus = status;
      } catch (e) {
        console.error(e);
      }
    });
    this.server.bind(this.port);
  }

  async sendCommand (message: CommandMessage): Promise<void> {
    const sendSocket = dgram.createSocket('udp4');
    await new Promise((resolve, reject) => {
      sendSocket.send(message.buffer, this.mcuPort, this.mcuIP, (err) => {
        if (err != null) {
          sendSocket.close(() => { reject(err); });
        } else {
          sendSocket.close(() => { resolve(null); });
        }
      });
    });
  }

  async sendStatusRequest (): Promise<void> {
    const message = new CommandMessage('status');
    await new Promise((resolve, reject) => {
      this.server.send(message.buffer, this.mcuPort, this.mcuIP, (err) => {
        if (err != null) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  }

  get currentStatus (): StatusMessage | undefined {
    return this._currentStatus;
  }

  close (): void {
    this.server.close();
  }
};
