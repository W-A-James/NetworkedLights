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
function sendCommand (command) {
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

function getMCUStatus () {
  const req = new Request('/api', { method: 'GET' });
}

// refresh mcu status every 2 seconds
setInterval(getMCUStatus, 3000);

function sendDatatoMCU () {
  const animationRadios = document.getElementsByName('animation');
  const brightness = document.getElementById('brightness');
  const hue = document.getElementById('hue');
  const breathingDelta = document.getElementById('breathingDelta');
  const chasingHueWidth = document.getElementById('chasingHueWidth');
  const chasingDelta = document.getElementById('chasingDelta');
  const rainbowDelta = document.getElementById('rainbowDelta');

  const selectedRadio = (() => {
    for (const node of animationRadios) {
      if (node.checked) return node;
    }
  })();

  /** @type Command */
  const body = { op: selectedRadio.id, opts: { hue: hue.value, brightness: brightness.value } };
  switch (selectedRadio.id) {
    case 'rainbow':
      body.opts.delta = rainbowDelta.value;
      break;
    case 'breathing':
      body.opts.delta = breathingDelta.value;
      break;
    case 'chasing':
      body.opts.hueWidth = chasingHueWidth.value;
      body.opts.hueDelta = chasingDelta.value;
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
toggleButton.addEventListener('click', (e) => {
  const payload = { opts: {} };
  switch (toggleButton.getAttribute('data-state')) {
    case 'on':
      payload.op = 'off';
      toggleButton.setAttribute('data-state', 'off');
      toggleButton.innerText = 'Off';
      break;
    case 'off':
      payload.op = 'on';
      toggleButton.setAttribute('data-state', 'on');
      toggleButton.innerText = 'On';
      break;
    default:
      payload.op = 'on';
      toggleButton.setAttribute('data-state', 'on');
      toggleButton.innerText = 'On';
  }
  sendCommand(payload);
});
