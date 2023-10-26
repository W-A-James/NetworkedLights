import express from 'express';
import { MCU } from './mcu_interface.js';

const app = express();

const port = process.env.PORT ?? 3000;

// Set up exprses server for user interfacing
app.get('/', (req, res) => {
  res.send('Hello world');
});

app.post('/', (req, res) => {
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

// Set up datagram server to interface with mcu
