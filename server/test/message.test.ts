import { createSocket } from 'node:dgram';
import { setTimeout } from 'node:timers/promises';
import { join } from 'node:path';

import * as dotenv from 'dotenv';

import { CommandMessage } from '../src/message'

dotenv.config({
  path: join(__dirname, '.env')
});

const port = Number(process.env.MCU_PORT);
const ip = process.env.MCU_IP as string;

const messages = [
  new CommandMessage('on'),
  new CommandMessage('off'),
  new CommandMessage('rainbow', { delta: 4096, brightness: 128 }),
  new CommandMessage('chasing', { hueDelta: 100, hueWidth: 20_000, brightness: 127 }),
  new CommandMessage('solid', { hue: 20_000, brightness: 129 }),
  new CommandMessage('breathing', { delta: 2, hue: 8900, brightness: 130 })
];

(async () => {
  const sock = createSocket('udp4');
  sock.connect(port, ip, async () => {
    sock.on('message', (msg, rinfo) => {
      console.log(`Got ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
    });

    for (const message of messages) {
      console.log(`Sending '${message.op}' command to ${ip}:${port}...`);
      sock.send(message.buffer, (err, n) => {
        if (err) throw new Error('fail');
        console.log(`- sent ${n} bytes: ${message.buffer.toString('hex')}`);
      });

      await setTimeout(5000);
    }
    sock.close();
  });

})();
