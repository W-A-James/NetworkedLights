import { setInterval, clearInterval } from 'node:timers';

import { MockMCU } from '../utils';
import { log } from '../../src/utils';

const mcu = new MockMCU({ port: 9898, controlServerIP: '127.0.0.1', controlServerPort: 9999 });

const logger = setInterval(() => {
  log(`Packets sent: ${mcu.packetsSent}`)
}, 500);

process.on('SIGINT', () => {
  console.log('\nAttempting to close gracefully...');

  clearInterval(logger);
  mcu.close()
    .then(() => {
      console.log('Closed gracefully');
      process.exit(0);
    })
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
})
