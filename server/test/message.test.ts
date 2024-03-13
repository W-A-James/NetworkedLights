import { createSocket } from 'node:dgram';
import { CommandMessage } from '../src/message'


const onMessage = new CommandMessage('on');
const offMessage = new CommandMessage('off');
const rainbowMessage = new CommandMessage('rainbow', { delta: 4096, brightness: 128 });
const chasingMessage = new CommandMessage('chasing', { hueDelta: 100, hueWidth:20_000, brightness: 127 });
const solidMessage = new CommandMessage('solid', { hue: 20_000, brightness: 129 });
const breathingMessage = new CommandMessage('breathing', { delta: 2, hue: 8900, brightness: 130 });

(async () => {
  const server = createSocket('udp4');
  server.connect(9000, '192.168.1.220', async () => {
    server.on('message', (msg, rinfo) => {
      console.log(msg.toString('utf8'));
    });

    for (const message of [onMessage, offMessage, chasingMessage, rainbowMessage, solidMessage, breathingMessage]) {
      server.send(message.buffer, (err, n) => {
        if (err) throw new Error('fail');
        console.log(`sent ${n} bytes: ${message.buffer.toString('hex')}`);
      });

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    server.close();
  });

})();
