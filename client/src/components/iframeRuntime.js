export default () => {
  const bodyEl = document.body;
  const canvasEl = document.createElement('canvas');

  bodyEl.appendChild(canvasEl);

  bodyEl.style.margin = 0;
  bodyEl.style.padding = 0;
  bodyEl.style.height = '100%';
  bodyEl.style.overflow = 'hidden';
  canvasEl.style.position = 'absolute';
  canvasEl.style.background = '#000';

  let renderer = null;
  let rendererState = {};
  let epoch = null;

  function resizeCanvas() {
    var bounds = canvasEl.parentNode.getBoundingClientRect();

    canvasEl.width = bounds.width;
    canvasEl.height = bounds.height;
  }

  window.onMessage = (event) => {
    switch (event.data.type) {
    case 'RESIZE':
      resizeCanvas();
      break;
    case 'SOURCE':
      try {
        renderer = new Function('canvas', 'state', 't', event.data.data);
      } catch (err) {
        console.error(err);
        renderer = null;
        notifyParent('COMPILATION_ERROR');
      }
      break;
    case 'STATE':
      rendererState = event.data.data;
      epoch = null;
      break;
    }
  };

  function render(t) {
    requestAnimationFrame(render);

    if (!renderer || !rendererState) {
      return;
    }

    if (epoch === null) {
      canvasEl.getContext('2d').clearRect(0, 0, canvasEl.width, canvasEl.height);
      epoch = t;
    }

    try {
      renderer.call(null, canvasEl, rendererState, t - epoch);
    } catch (err) {
      console.error(err);
      renderer = null;
      notifyParent('RUNTIME_ERROR');
    }
  }

  function run() {
    requestAnimationFrame(render);
  }

  resizeCanvas();
  run();
}
