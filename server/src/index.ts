import express from 'express';
import * as dotenv from 'dotenv';

import { MCU } from './mcu_interface';
import { CommandMessage } from './message';

dotenv.config();

const app = express();
app.use(express.static('./public'));
app.use(express.json());

const EXPRESS_TCP_PORT = Number(process.env.EXPRESS_PORT);
const LOCAL_UDP_PORT = Number(process.env.LOCAL_UDP_PORT);
const MCU_IP = process.env.MCU_IP;
const MCU_PORT = Number(process.env.MCU_PORT);

let mcu: MCU;

app.post('/api', (req, res) => {
  let command: CommandMessage;
  try {
    command = new CommandMessage(req.body.op, req.body.opts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: (e as Error).message ?? undefined });
    return;
  }

  mcu.sendCommand(command)
    .then(() => {
      res.status(200).json({ ok: true });
    },
    (e: Error) => {
      console.error(e);
      res.status(500).json({ ok: false, message: e.message });
    });
});

// Query MCU status
app.get('/api', (_, res) => {
  mcu.sendStatusRequest().then(
    () => {
      if (mcu.currentStatus !== undefined) {
        res.status(200).json({ ok: true, status: mcu.currentStatus });
      } else {
        res.status(404).json({ ok: false, message: 'Failed to reach microcontroller' });
      }
    },
    (e: Error) => {
      console.error(e);
      res.status(500).json({ ok: false, message: e.message });
    }
  );
});

const server = app.listen(EXPRESS_TCP_PORT, () => {
  console.log(`HTTP server listening on port ${EXPRESS_TCP_PORT}`);

  if (MCU_IP === undefined || Number.isNaN(LOCAL_UDP_PORT) || Number.isNaN(MCU_PORT)) {
    console.error('Environment variables LOCAL_UDP_PORT, MCU_PORT, and MCU_IP must be defined');
    server.close();
    return;
  }

  mcu = new MCU(LOCAL_UDP_PORT, MCU_IP, MCU_PORT);
});
