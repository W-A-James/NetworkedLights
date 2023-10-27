import express from 'express';
import { MCU } from './mcu_interface.js';
import { CommandMessage } from './message.js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.static('./public'));
app.use(express.json());

const EXPRESS_TCP_PORT = Number(process.env.EXPRESS_PORT);
const LOCAL_UDP_PORT = Number(process.env.LOCAL_UDP_PORT);
const MCU_IP = process.env.MCU_IP;
const MCU_PORT = Number(process.env.MCU_PORT);

/** @type {MCU} */
let mcu;

app.post('/api', async (req, res) => {
  try {
    const command = new CommandMessage(req.body.op, req.body.opts);
    await mcu.sendCommand(command);
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get('/api', async (req, res) => {
  // Query MCU status
  try {
    await mcu.sendStatusRequest();
    res.status(200).json({ ok: true, status: mcu.currentStatus });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.listen(EXPRESS_TCP_PORT, () => {
  console.log(`HTTP server listening on port ${EXPRESS_TCP_PORT}`);
  mcu = new MCU(LOCAL_UDP_PORT, MCU_IP, MCU_PORT);
});
