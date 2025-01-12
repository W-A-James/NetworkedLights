import * as dgram from 'node:dgram';
import { log } from '../src/utils';
import { promisify } from 'node:util';

export class MockMCU {
  sock: dgram.Socket;
  status: Buffer;
  packetsSent: number;
  options: { port: number, controlServerIP: string, controlServerPort: number };

  constructor (options: { port: number, controlServerIP: string, controlServerPort: number }) {
    this.options = options;
    this.status = Buffer.alloc(12).fill(0);
    this.status.writeUint8(12, 0);
    this.packetsSent = 0;

    this.sock = dgram.createSocket('udp4');
    this.sock.on('listening', () => {
      log(`MockMCU listening on UDP port ${options.port}`);
    });

    this.sock.on('error', () => {
      log('MockMCU errored');
      this.close().catch(e => { log('Failed to close MockMCU', e); });
    });

    this.sock.on('message', () => {
      this.sock.send(
        this.status,
        this.options.controlServerPort,
        this.options.controlServerIP,
        (error, _) => {
          if (error != null) { return; }
          this.packetsSent++;
        });
    });

    this.sock.bind(options.port);
  }

  async close (): Promise<void> {
    await promisify(this.sock.close.bind(this.sock))();
  }
}
