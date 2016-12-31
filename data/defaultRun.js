// Here, you're writing the contents of a function with the following signature:
// function render(canvas, state, t)

// Get the context you want from the "canvas" argument
var ctx = canvas.getContext('2d');

ctx.fillStyle = '#000';
ctx.globalAlpha = 0.05;
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalAlpha = 1;

// You can store state in "state"
if (isNaN(state.x)) {
  state.x = canvas.width / 2;
  state.y = canvas.height / 5;
  state.vx = 2;
  state.vy = 0;
}

// The "t" argument gives you the milliseconds since the animation started
var radius = (Math.sin(t / 500) + 1) * 5 + 5;
var hue = (t / 100) % 360;

ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
ctx.beginPath();
ctx.arc(state.x, state.y, radius, 0, 2 * Math.PI, false);
ctx.fill();

state.x += state.vx;
state.y += state.vy;

if (state.x < radius || state.x >= canvas.width - radius) {
  state.vx = -state.vx;
  state.x += state.vx;
}

if (state.y < radius || state.y >= canvas.height - radius) {
  state.vy = -state.vy;
  state.y += state.vy;
}

var gravity = 0.2;

state.vy += gravity;
