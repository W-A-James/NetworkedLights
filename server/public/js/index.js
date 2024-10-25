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
async function sendCommand(command) {
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

/**
  * Send a request to the API server to query for the microcontroller's current state
  * and display it in the UI
  **/
async function pollMCUStatus() {
  const req = new Request('/api', { method: 'GET' });

  try {
    const response = await fetch(req);
    const json = await response.json();
    if (json.ok) {
      const status = json.status;
      POWER_STATUS.innerText = `${status.state.includes('Off') ? 'Off' : 'On'}`;
      ANIMATION_STATUS.innerText = `${status.state.split('Off')[0]}`;
      BRIGHTNESS_STATUS.innerText = `${status.brightness}`;
      HUE_STATUS.innerText = `${status.hue}`;
      BREATHING_DELTA_STATUS.innerText = `${status.bDelta}`;
      CHASING_HUE_WIDTH_STATUS.innerText = `${status.cHueWidth}`;
      CHASING_DELTA_STATUS.innerText = `${status.cHueDelta}`;
      RAINBOW_DELTA_STATUS.innerText = `${status.rDelta}`;
    } else {
      throw new Error(json.message);
    }
  } catch (error) {
    console.error(error);
  }
}

// refresh mcu status every 0.25 seconds
setInterval(pollMCUStatus, 250);

async function sendDatatoMCU() {
  const selectedRadio = (() => {
    for (const radio of ANIMATION_RADIO_INPUTS) {
      if (radio.checked) return radio;
    }
  })();

  /** @type Command */
  const body = {
    op: selectedRadio.id,
    opts: {
      hue: Number(HUE_RANGE_INPUT.value),
      brightness: Number(BRIGHTNESS_RANGE_INPUT.value)
    }
  };
  switch (selectedRadio.id) {
    case 'rainbow':
      body.opts.delta = Number(RAINBOW_DELTA_RANGE_INPUT.value);
      break;
    case 'breathing':
      body.opts.delta = Number(BREATHING_DELTA_RANGE_INPUT.value);
      break;
    case 'chasing':
      body.opts.hueWidth = Number(CHASING_HUE_WIDTH_RANGE_INPUT.value);
      body.opts.hueDelta = Number(CHASING_DELTA_RANGE_INPUT.value);
      break;
    case 'solid':
      break;
  }

  await sendCommand(body);
}

document.getElementById('submit').addEventListener('click', (e) => {
  e.preventDefault();
  sendDatatoMCU();
});

const toggleButton = document.getElementById('toggle');
toggleButton.addEventListener('click', async (event) => {
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
    await sendCommand(payload);
});

/**
  * Ties together values of provided range and num parameters which are HTML input elements of the
  * respective types
  * */
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

// Brightness inputs
connectRangeAndNumInputs(BRIGHTNESS_RANGE_INPUT, BRIGHTNESS_NUM_INPUT);
updateInputValue(BRIGHTNESS_RANGE_INPUT, BRIGHTNESS_NUM_INPUT);

// Hue Inputs
connectRangeAndNumInputs(HUE_RANGE_INPUT, HUE_NUM_INPUT);

// Sync range and num inputs on startup
updateInputValue(HUE_RANGE_INPUT, HUE_NUM_INPUT);

// Set hue label's background colour to corresponding HSL colour with full saturation and 50%
// lightness
function changeHueBackgroundColour(event) {
  const hueVal = Number(event.target.value);
  if (Number.isFinite(hueVal) && hueVal <= 65535) {
    const hueDegrees = (hueVal / 65535) * 360;
    const hsl = `hsl(${Math.fround(hueDegrees)}deg 100% 50%)`;
    HUE_LABEL.setAttribute("style", `background-color: ${hsl} !important`);
  }
}
// Invoke once to have hue set correctly
changeHueBackgroundColour({ target: HUE_RANGE_INPUT });
HUE_RANGE_INPUT.addEventListener('change', changeHueBackgroundColour);
HUE_NUM_INPUT.addEventListener('change', changeHueBackgroundColour);

// Breathing delta inputs 
connectRangeAndNumInputs(BREATHING_DELTA_RANGE_INPUT, BREATHING_DELTA_NUM_INPUT);
updateInputValue(BREATHING_DELTA_RANGE_INPUT, BREATHING_DELTA_NUM_INPUT);

// Chasing hue width inputs
connectRangeAndNumInputs(CHASING_HUE_WIDTH_RANGE_INPUT, CHASING_HUE_WIDTH_NUM_INPUT);
updateInputValue(CHASING_HUE_WIDTH_RANGE_INPUT, CHASING_HUE_WIDTH_NUM_INPUT);

// Chasing delta inputs
connectRangeAndNumInputs(CHASING_DELTA_RANGE_INPUT, CHASING_DELTA_NUM_INPUT);
updateInputValue(CHASING_DELTA_RANGE_INPUT, CHASING_DELTA_NUM_INPUT);

// Rainbow delta inputs
connectRangeAndNumInputs(RAINBOW_DELTA_RANGE_INPUT, RAINBOW_DELTA_NUM_INPUT);
updateInputValue(RAINBOW_DELTA_RANGE_INPUT, RAINBOW_DELTA_NUM_INPUT);
