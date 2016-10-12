var debug = window.location.search.match(/d=1/)
  ? function () {
    console.log.apply(console, arguments);
  }
  : function () {};

function initialize() {
  debug('Initializing');

  var rendererState = {};
  var rendererEpoch = null;
  var renderer = null;
  var hasSyntaxError = false;

  function compileRenderer() {
    debug('compileRenderer');

    try {
      renderer = new Function('canvas', 'state', 't', editor.getValue());
      hideError();
    } catch (err) {
      renderer = null;

      if (err) {
        renderError(err);
      }
    }
  }

  var currentRun = null;

  Promise.resolve()
    .then(function () {
      var shortId = window.location.pathname.slice(1);

      if (shortId) {
        return fetch('/api/runs/' + encodeURIComponent(shortId))
          .then(function (response) {
            if (response.ok) {
              return response.json();
            } else {
              switch (response.status) {
              case 404:
                throw new Error('Run not found');
              default:
                throw new Error('Could not fetch run');
              }
            }
          });
      } else {
        return {
          source: $('#default').innerHTML
        };
      }
    })
    .then(function (run) {
      currentRun = run;
      editor.setValue(run.source, -1);
      //editor.focus();
      compileRenderer();
    })
    .catch(renderError);

  function save() {
    var source = editor.getValue();

    if (!source) {
      return;
    }

    var formData = new FormData();

    if (currentRun.shortId) {
      formData.append('shortId', currentRun.shortId);
    }

    formData.append('source', source);

    fetch('/api/runs', { method: 'POST', body: formData })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          console.error(response.status);
          throw 'Saving failed';
        }
      })
      .then(function (run) {
        currentRun = run;
        history.pushState(currentRun, 'Run ' + currentRun.shortId, '/' + currentRun.shortId);
        //editor.focus();
      });
  }

  window.addEventListener('popstate', function (event) {
    debug('popstate');

    if (event.state) {
      currentRun = event.state;
      editor.setValue(currentRun.source, -1);
      //editor.focus();
    }
  });

  function handleSourceChange() {
    if (!hasSyntaxError) {
      compileRenderer();
    }
  }

  editor.on('change', _.debounce(handleSourceChange, 1000));

  var canvas = $('#canvas');
  var error = $('#error');

  function resizeCanvas() {
    debug('resizeCanvas');

    var bounds = canvas.parentNode.getBoundingClientRect();

    debug('bounds', bounds.width, bounds.height);

    canvas.width = bounds.width;
    canvas.height = bounds.height;
  }

  function resetState() {
    rendererState = {};
    rendererEpoch = null;
  }

  function handleResize() {
    debug('handleResize');

    resetState();
    setTimeout(resizeCanvas, 1);
  }

  handleResize();

  window.addEventListener('resize', _.debounce(handleResize, 250));

  function renderError(err) {
    error.className = '-visible';
    error.innerHTML = err.message
      ? err.message : err;
  }

  function hideError() {
    error.className = '';
  }

  function render(t) {
    requestAnimationFrame(render);

    if (rendererEpoch === null) {
      rendererEpoch = t;
    }

    if (renderer) {
      try {
        renderer.call(null, canvas, rendererState, t - rendererEpoch);
        hideError();
      } catch (err) {
        renderer = null;

        if (err) {
          renderError(err);
        }
      }
    }
  }

  requestAnimationFrame(render);
}

setTimeout(initialize, 100);
