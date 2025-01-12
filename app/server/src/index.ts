import * as dotenv from 'dotenv';

import { ControlServer } from './control_server';
import { error, log } from './utils';

dotenv.config();

const MCU_IP = process.env.MCU_IP;
const MCU_PORT = Number(process.env.MCU_PORT);
const LOCAL_UDP_PORT = Number(process.env.LOCAL_UDP_PORT);
const EXPRESS_PORT = Number(process.env.EXPRESS_PORT);
const STATIC_PATH = process.env.STATIC_PATH;

if (MCU_IP === undefined || STATIC_PATH === undefined || Number.isNaN(LOCAL_UDP_PORT) || Number.isNaN(MCU_PORT) || Number.isNaN(EXPRESS_PORT)) {
  throw new Error('Environment variables LOCAL_UDP_PORT, MCU_PORT, EXPRESS_PORT, STATIC_PATH and MCU_IP must be defined');
}

const controlServer = new ControlServer({
  httpPort: EXPRESS_PORT,
  localUDPPort: LOCAL_UDP_PORT,
  mcuUDPPort: MCU_PORT,
  mcuIP: MCU_IP,
  staticPath: STATIC_PATH
});

process.on('SIGINT', (s) => {
  log(`Received ${s}, attempting to shut down server gracefully`);

  controlServer.close().then(cleanClose => {
    process.exit(cleanClose ? 0 : 1);
  }, e => {
    error('Unexpected error while closing server', e);
    process.exit(1);
  });
});
