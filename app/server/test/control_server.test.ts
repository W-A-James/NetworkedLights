import { it, describe, before, after } from 'node:test';
import { memoryUsage } from 'node:process';
import { setTimeout } from 'node:timers/promises';
import { type WriteStream, createWriteStream } from 'node:fs';

import { ControlServer } from '../src/control_server';
import { MockMCU } from './utils';
import { promisify } from 'node:util';

/* eslint-disable @typescript-eslint/no-floating-promises */

describe('ControlServer', function () {
  describe('memory usage', function () {
    let mockMCU: MockMCU;
    let controlServer: ControlServer;
    const ip = '127.0.0.1';
    const mockMCUPort = 9898;
    const controlServerPort = 9899;
    const httpPort = 0;
    let ws: WriteStream;

    before(() => {
      mockMCU = new MockMCU({ port: mockMCUPort, controlServerIP: ip, controlServerPort });
      controlServer = new ControlServer({ localUDPPort: controlServerPort, httpPort, mcuIP: '127.0.0.1', mcuUDPPort: 9898, mcuPollingIntervalMS: 100, enableHTTP: false, staticPath: __dirname });
      ws = createWriteStream('./control_server_memory_profile.json', { flags: 'w' });
      ws.write('[');
    });

    after(async () => {
      await mockMCU.close();
      await controlServer.close();

      ws.write('{}]');
      await promisify(ws.close.bind(ws))();
    })

    it('does not use unbounded memory', async function () {
      const N = 3600;
      for (let i = 0; i < N; i++) {
        const usage = { ...memoryUsage(), t: performance.now() };
        await setTimeout(1000);
        console.log(`${i + 1}of${N} - Num Packets sent: ${mockMCU.packetsSent}`);
        ws.write(`${JSON.stringify(usage)},`);
      }
    });
  });
});
