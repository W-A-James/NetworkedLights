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

const BRIGHTNESS_RANGE_INPUT = document.getElementById('brightness');
const HUE_RANGE_INPUT = document.getElementById('hue');
const BREATHING_DELTA_RANGE_INPUT = document.getElementById('breathingDelta');
const CHASING_HUE_WIDTH_RANGE_INPUT = document.getElementById('chasingHueWidth');
const CHASING_DELTA_RANGE_INPUT = document.getElementById('chasingDelta');
const RAINBOW_DELTA_RANGE_INPUT = document.getElementById('rainbowDelta');

const BRIGHTNESS_NUM_INPUT = document.getElementById('brightness-num');
const HUE_NUM_INPUT = document.getElementById('hue-num');
const BREATHING_DELTA_NUM_INPUT = document.getElementById('breathingDelta-num');
const CHASING_HUE_WIDTH_NUM_INPUT = document.getElementById('chasingHueWidth-num');
const CHASING_DELTA_NUM_INPUT = document.getElementById('chasingDelta-num');
const RAINBOW_DELTA_NUM_INPUT = document.getElementById('rainbowDelta-num');

const HUE_LABEL = document.getElementById('hue-label');
function getMCUStatus() {
  const req = new Request('/api', { method: 'GET' });

  fetch(req)
    .then(res => res.json())
    .then(status => {
      if (status.ok) {
        status = status.status;
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

// refresh mcu status every 0.25 seconds
setInterval(getMCUStatus, 250);

function sendDatatoMCU() {
  const selectedRadio = (() => {
    for (const radio of ANIMATION_RADIO_INPUTS) {
      if (radio.checked) return radio;
    }
  })();

  /** @type Command */
  const body = { op: selectedRadio.id, opts: { hue: HUE_RANGE_INPUT.value, brightness: BRIGHTNESS_RANGE_INPUT.value } };
  switch (selectedRadio.id) {
    case 'rainbow':
      body.opts.delta = RAINBOW_DELTA_RANGE_INPUT.value;
      break;
    case 'breathing':
      body.opts.delta = BREATHING_DELTA_RANGE_INPUT.value;
      break;
    case 'chasing':
      body.opts.hueWidth = CHASING_HUE_WIDTH_RANGE_INPUT.value;
      body.opts.hueDelta = CHASING_DELTA_RANGE_INPUT.value;
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
  const on = POWER_STATUS.innerText === 'On'
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

function connectRangeAndNumInputs(range, num) {
  range.addEventListener('change', () => {
    updateInputValue(range, num);
  });

  num.addEventListener('change', () => {
    updateInputValue(num, range);
  });
}

function updateInputValue(source, dest) {
  dest.value = source.value;
}

connectRangeAndNumInputs(BRIGHTNESS_RANGE_INPUT, BRIGHTNESS_NUM_INPUT);
updateInputValue(BRIGHTNESS_RANGE_INPUT, BRIGHTNESS_NUM_INPUT);

connectRangeAndNumInputs(HUE_RANGE_INPUT, HUE_NUM_INPUT);
updateInputValue(HUE_RANGE_INPUT, HUE_NUM_INPUT);
function changeHueBackgroundCoulour(event) {
  const hueVal = Number(event.target.value);
  if (Number.isFinite(hueVal) && hueVal <= 65536) {
    const hueDegrees = (hueVal / 65538) * 360;
    const hsl = `hsl(${Math.fround(hueDegrees)}deg 100% 50%)`;
    console.log(`Set bg colour to ${hsl}`);
    HUE_LABEL.setAttribute("style", `background-color: ${hsl} !important`);
  }
}
HUE_RANGE_INPUT.addEventListener('change', changeHueBackgroundCoulour);
HUE_NUM_INPUT.addEventListener('change', changeHueBackgroundCoulour);


connectRangeAndNumInputs(BREATHING_DELTA_RANGE_INPUT, BREATHING_DELTA_NUM_INPUT);
updateInputValue(BREATHING_DELTA_RANGE_INPUT, BREATHING_DELTA_NUM_INPUT);

connectRangeAndNumInputs(CHASING_HUE_WIDTH_RANGE_INPUT, CHASING_HUE_WIDTH_NUM_INPUT);
updateInputValue(CHASING_HUE_WIDTH_RANGE_INPUT, CHASING_HUE_WIDTH_NUM_INPUT);

connectRangeAndNumInputs(CHASING_DELTA_RANGE_INPUT, CHASING_DELTA_NUM_INPUT);
updateInputValue(CHASING_DELTA_RANGE_INPUT, CHASING_DELTA_NUM_INPUT);

connectRangeAndNumInputs(RAINBOW_DELTA_RANGE_INPUT, RAINBOW_DELTA_NUM_INPUT);
updateInputValue(RAINBOW_DELTA_RANGE_INPUT, RAINBOW_DELTA_NUM_INPUT);
