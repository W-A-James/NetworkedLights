import express from 'express';
import { MCU } from './mcu_interface.js';
import { CommandMessage } from './message.js';
import { config } from 'dotenv';
config();

const app = express();
app.use(express.static('./public'));
app.use(express.json());

const expressPort = process.env.PORT ?? 3000;
const mcuPort = process.env.LOCAL_UDP_PORT ?? 9999;

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
});

app.listen(expressPort, () => {
  console.log(`HTTP server listening on port ${expressPort}`);
  mcu = new MCU(mcuPort);
});
