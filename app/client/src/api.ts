import { StatusProps } from './common';

type RainbowOptions = {
  delta: number;
};

type BreathingOptions = {
  breathingDelta: number;
};

type ChasingOptions = {
  hueWidth: number;
  hueDelta: number;
};

export type Command = {
  op: string;
  opts: (RainbowOptions | BreathingOptions | ChasingOptions | {}) & { brightness: number, hue: number },

};

export async function sendCommand(command: Command) {
  const req = new Request('/api', {
    method: 'POST',
    headers: new Headers({ 'content-type': 'application/json' }),
    body: JSON.stringify(command)
  });

  try {
    const response = await fetch(req);
    if (response.status === 200) {
      console.debug(await response.json());
    } else {
      throw new Error('Failure on API server!', { cause: await response.json() });
    }
  } catch (error) {
    console.error(error);
  }
}

export async function pollMCUStatus(): Promise<StatusProps> {
  const req = new Request('/api', { method: 'GET' });

  const response = await fetch(req);
  const json = await response.json();
  if (json.ok) {
    const status = json.status;

    const rv: StatusProps = {
      power: status.state.includes('Off') ? false : true,
      animation: status.state.split('Off')[0],
      brightness: status.brightness,
      hue: status.hue,
      breathingDelta: status.bDelta,
      chasingHueWidth: status.cHueWidth,
      chasingHueDelta: status.cHueDelta,
      rainbowDelta: status.rDelta,
    };
    return rv;
  } else {
    throw new Error(json.message);
  }
}

export async function sendDataToMCU(status: StatusProps) {
  let body: Command;
  const op = status.animation;
  switch (status.animation) {
    case 'rainbow':
      body = {
        op,
        opts: {
          delta: status.rainbowDelta,
          brightness: status.brightness,
          hue: status.hue
        }
      };
      break;
    case 'breathing':
      body = {
        op,
        opts: {
          delta: status.breathingDelta,
          brightness: status.brightness,
          hue: status.hue
        }
      };
      break;
    case 'chasing':
      body = {
        op,
        opts: {
          hueDelta: status.chasingHueDelta,
          hueWidth: status.chasingHueWidth,
          brightness: status.brightness,
          hue: status.hue
        }
      };
      break;
    case 'solid':
      body = {
        op,
        opts: {
          brightness: status.brightness,
          hue: status.hue
        }
      };
      break;
    default:
      throw new Error(`Invalid op: ${op}`);
  }

  await sendCommand(body);
}
