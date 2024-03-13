const canvas = document.getElementById('colour-selector');
const output = document.getElementById('colour-out');
const CANVAS_SIZE = 200;

function inCircle(clientX, clientY, circleX, circleY, radius) {
  return ((clientX - circleX) ** 2 + (clientY - circleY) ** 2) <= (radius * radius);

}

window.addEventListener('load', () => {
  canvas.width = canvas.height = `${CANVAS_SIZE}`;
  output.width = output.height = '10';

  const ctx = canvas.getContext('2d');
  const outCtx = output.getContext('2d');
  drawColourWheelArcs(ctx);

  canvas.addEventListener('mousedown', event => {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const bbox = canvas.getBoundingClientRect();
    let { x, y } = event;
    x -= bbox.x;
    y -= bbox.y;

    const mouseInCircle = inCircle(x, y, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 75);

    const ySubCentre = y - CANVAS_SIZE / 2;
    const xSubCentre = x - CANVAS_SIZE / 2;
    if (mouseInCircle) {
      console.debug('in circle');
      let hueRads = Math.atan2(xSubCentre, ySubCentre);
      console.debug(`x: ${xSubCentre}, y: ${ySubCentre}, theta: ${hueRads}`);

      outCtx.fillStyle = `hsl(${180 * hueRads / Math.PI}deg 100% 50%)`;
      outCtx.fillRect(0, 0, output.clientWidth, output.clientHeight);

      drawColourWheelArcs(ctx);

      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, 5, 5);
    } else {
      console.debug('mouse not in circle');
    }
  })
});

function drawColourWheelArcs(ctx) {
  console.debug('drawing colour wheel');
  const slices = 360;
  const radius = 80;
  const stops = 2;

  ctx.lineWidth = 0;
  for (let i = 0; i < slices; i++) {
    const startAngle = (i / slices) * 2 * Math.PI;
    const endAngle = startAngle + (2 * Math.PI / slices);
    const midAngle = (startAngle + endAngle) / 2;
    const midX = (radius * Math.sin(midAngle)) + CANVAS_SIZE / 2;
    const midY = (radius * Math.cos(midAngle)) + CANVAS_SIZE / 2;

    const hue = midAngle * 180 / Math.PI;

    const gradient = ctx.createLinearGradient(CANVAS_SIZE / 2, CANVAS_SIZE / 2, midX, midY);
    for (let j = 0; j < stops + 1; j++) {
      const sat = 100 * j / stops;
      const colour = `hsl(${hue}deg ${100}% 60% / 100%)`;
      gradient.addColorStop(j / stops, colour);
    }

    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, radius, startAngle - Math.PI / 2, endAngle - Math.PI / 2);
    ctx.moveTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
  }
}

