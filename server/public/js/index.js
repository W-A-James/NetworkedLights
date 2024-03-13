/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Collect data from form, call fetch to send data to backend

/** @typedef {Object} Options
  * @property {number=} hue
  * @property {number=} brightness
  * @property {number=} delta
  * @property {number=} hueDelta
  * @property {number=} hueWidth
  */

/** @typedef {Object} Command
  * @property {'rainbow'|'chasing'|'breathing'|'on'|'off'|'solid'} op
  * @property {Options} opts
  */

/** @param command {Command} */
function sendCommand(command) {
  const req = new Request('/api', {
    method: 'POST',
    headers: new Headers({ 'content-type': 'application/json' }),
    body: JSON.stringify(command)
  });

  fetch(req)
    .then(async response => {
      if (response.status === 200) {
        return await response.json();
      } else {
        throw new Error('Failure on API server!', { cause: await response.json() });
      }
    })
    .then(console.debug)
    .catch(console.error);
}

const POWER_STATUS = document.getElementById('currentPower');
const ANIMATION_STATUS = document.getElementById('currentAnimation');
const BRIGHTNESS_STATUS = document.getElementById('currentBrightness');
const HUE_STATUS = document.getElementById('currentHue');
const BREATHING_DELTA_STATUS = document.getElementById('currentBreathingDelta');
const CHASING_HUE_WIDTH_STATUS = document.getElementById('currentChasingHueWidth');
const CHASING_DELTA_STATUS = document.getElementById('currentChasingDelta');
const RAINBOW_DELTA_STATUS = document.getElementById('currentRainbowDelta');

const ANIMATION_RADIO_INPUTS = document.getElementsByName('animation');
const BRIGHTNESS_INPUT = document.getElementById('brightness');
const HUE_INPUT = document.getElementById('hue');
const BREATHING_DELTA_INPUT = document.getElementById('breathingDelta');
const CHASING_HUE_WIDTH_INPUT = document.getElementById('chasingHueWidth');
const CHASING_DELTA_INPUT = document.getElementById('chasingDelta');
const RAINBOW_DELTA_INPUT = document.getElementById('rainbowDelta');

function getMCUStatus() {
  const req = new Request('/api', { method: 'GET' });

  fetch(req)
    .then(res => res.json())
    .then(status => {
      if (status.ok) {
        status = status.status;
	console.log(status);
        POWER_STATUS.innerText = `${status.state.includes('Off') ? 'Off' : 'On'}`;
        ANIMATION_STATUS.innerText = `${status.state.split('Off')[0]}`;
        BRIGHTNESS_STATUS.innerText = `${status.brightness}`;
        HUE_STATUS.innerText = `${status.hue}`;
        BREATHING_DELTA_STATUS.innerText = `${status.bDelta}`;
        CHASING_HUE_WIDTH_STATUS.innerText = `${status.cHueWidth}`;
        CHASING_DELTA_STATUS.innerText = `${status.cHueDelta}`;
        RAINBOW_DELTA_STATUS.innerText = `${status.rDelta}`;
      } else {
        throw new Error(status.message);
      }
    })
    .catch(console.error);
}

// refresh mcu status every 0.5 seconds
setInterval(getMCUStatus, 500);

function sendDatatoMCU() {
  const selectedRadio = (() => {
    for (const radio of ANIMATION_RADIO_INPUTS) {
      if (radio.checked) return radio;
    }
  })();

  /** @type Command */
  const body = { op: selectedRadio.id, opts: { hue: HUE_INPUT.value, brightness: BRIGHTNESS_INPUT.value } };
  switch (selectedRadio.id) {
    case 'rainbow':
      body.opts.delta = RAINBOW_DELTA_INPUT.value;
      break;
    case 'breathing':
      body.opts.delta = BREATHING_DELTA_INPUT.value;
      break;
    case 'chasing':
      body.opts.hueWidth = CHASING_HUE_WIDTH_INPUT.value;
      body.opts.hueDelta = CHASING_DELTA_INPUT.value;
      break;
    case 'solid':
      break;
  }

  sendCommand(body);
}

document.getElementById('submit').addEventListener('click', (e) => {
  e.preventDefault();
  sendDatatoMCU();
});

const toggleButton = document.getElementById('toggle');
toggleButton.addEventListener('click', (event) => {
  event.preventDefault();
  const on = POWER_STATUS.innerText=== 'On'
    ? true
    : POWER_STATUS.innerText === 'Off'
      ? false
      : undefined;
  const payload = { opts: {} };
  switch (on) {
    case true:
      payload.op = 'off';
      toggleButton.innerText = 'Off';
      break;
    case false:
      payload.op = 'on';
      toggleButton.innerText = 'On';
      break;
    default:
      toggleButton.innerText = 'Disabled';
  }

  if (payload.op)
    sendCommand(payload);
});
