import express from 'express';

import { MCU } from './mcu_interface';
import { CommandMessage } from './message';
import { log, debug, error } from './utils';
import { type Server } from 'http';
import { promisify } from 'node:util';

export interface ControlServerOptions {
  httpPort: number
  localUDPPort: number
  mcuIP: string
  mcuUDPPort: number
  staticPath: string
  mcuPollingIntervalMS?: number
  enableHTTP?: boolean
};

export class ControlServer {
  private app?: express.Express;
  private server?: Server;
  private readonly mcu: MCU;

  private readonly options: ControlServerOptions;

  constructor (options: ControlServerOptions) {
    this.options = options;
    const { localUDPPort, mcuIP, mcuUDPPort, mcuPollingIntervalMS } = options;
    this.mcu = new MCU(localUDPPort, mcuIP, mcuUDPPort, mcuPollingIntervalMS ?? 250);
    const enableHTTP = options.enableHTTP ?? true;
    if (enableHTTP) { this.initExpressServer(); }
  }

  initExpressServer (): void {
    if (this.app != null) return;
    this.app = express();
    this.app.use(express.static(this.options.staticPath));
    this.app.use(express.json());

    this.app.post('/api', (req, res) => {
      debug(`${req.ip} - ${req.method} ${req.path} ${JSON.stringify(req.body)}`);
      let command: CommandMessage;
      try {
        command = new CommandMessage(req.body.op, req.body.opts);
      } catch (e) {
        error(e);
        res.status(500).json({ ok: false, message: (e as Error).message ?? undefined });
        return;
      }

      this.mcu.sendCommand(command)
        .then(() => {
          res.status(200).json({ ok: true });
        },
        (e: Error) => {
          console.error(e);
          res.status(500).json({ ok: false, message: e.message });
        });
    });

    // Query MCU status
    this.app.get('/api', (_req, res) => {
      debug(`GET from ${_req.ip}`);
      if (this.mcu.currentStatus !== undefined) {
        res.status(200).json({ ok: true, status: this.mcu.currentStatus });
      } else {
        res.status(404).json({ ok: false, message: 'Failed to reach microcontroller' });
      }
    });

    const { httpPort, staticPath } = this.options;
    this.server = this.app.listen(httpPort, () => {
      log(`HTTP server listening on port ${httpPort}`);
      log(`HTTP server serving static files from ${staticPath}`);
    });

    this.server.on('error', (e) => {
      error('Fatal error encountered', e);
      this.close().catch(e => {
        error(e);
      });
    });
  }

  async close (): Promise<boolean> {
    let cleanClose = true;
    if (this.server != null) {
      try {
        await promisify(this.server?.close.bind(this.server))();
      } catch (e) {
        error('Failed to close http server gracefully', e);
        cleanClose = false;
      }
    }

    try {
      await this.mcu.close();
    } catch (e) {
      error('Failed to close mcu interface gracefully', e);
      cleanClose = false;
    }

    return cleanClose;
  }
}
