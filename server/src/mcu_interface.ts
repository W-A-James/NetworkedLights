import dgram from 'node:dgram';
import { CommandMessage, MCUStatusMessage, type StatusMessage } from './message';
import { log, error } from './utils';

export class MCU {
  private readonly port: number;
  private readonly mcuIP: string;
  private readonly mcuPort: number;
  private readonly udpSock: dgram.Socket;

  private readonly statusPollerId: NodeJS.Timeout;
  private _currentStatus: StatusMessage | undefined;

  constructor (port: number, mcuIP: string, mcuPort: number, pollingIntervalMS: number) {
    this.port = port;
    this.mcuIP = mcuIP;
    this.mcuPort = mcuPort;

    this._currentStatus = undefined;
    this.udpSock = dgram.createSocket('udp4');

    this.udpSock.on('listening', () => {
      log(`Listening on UDP port ${this.port}`);
    });

    this.udpSock.on('message', (message, rinfo) => {
      if (rinfo.address !== this.mcuIP) {
        error('dropping packet');
        return;
      }
      try {
        const status = new MCUStatusMessage(message).decode();
        this._currentStatus = status;
      } catch (e) {
        error(e);
      }
    });

    this.udpSock.on('error', (e) => {
      error('Socket Error! Closing MCU interface', e);
      this.close();
    })

    this.statusPollerId = setInterval(() => {
      this.pollMCU().then(
        _success => {},
        error => {
          error(error);
        });
    }, pollingIntervalMS);

    this.udpSock.bind(this.port);
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

  async pollMCU (): Promise<boolean> {
    const statusCommand = new CommandMessage('status');
    return await new Promise((resolve, reject) => {
      this.udpSock.send(
        statusCommand.buffer,
        this.mcuPort,
        this.mcuIP,
        (error, bytes) => {
          if (error != null) { reject(error); return; }
          resolve(bytes === statusCommand.buffer.length);
        });
    });
  }

  get currentStatus (): StatusMessage | undefined {
    return this._currentStatus;
  }

  close (): void {
    this.udpSock.close();
    clearTimeout(this.statusPollerId);
  }
};
