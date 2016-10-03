function $(id) {
  if (id[0] === '#') {
    return document.getElementById(id.slice(1));
  }
}

function initialize() {
  var rendererState = {};
  var rendererEpoch = null;
  var renderer = null;
  var hasSyntaxError = false;

  var editor = ace.edit($('#editor'));
  editor.$blockScrolling = Infinity;
  editor.setShowPrintMargin(false);
  editor.getSession().setMode("ace/mode/javascript");

  editor.getSession().on('changeAnnotation', function () {
    var isErrorFound = editor.getSession().getAnnotations().some(function (annotation) {
      return annotation.type === 'error';
    });

    if (isErrorFound) {
      if (!hasSyntaxError) {
        hasSyntaxError = true;
        renderer = null;
        renderError('Syntax errors found');
      }
    } else {
      if (hasSyntaxError) {
        hasSyntaxError = false;
        compileRenderer();
      }
    }
  });

  function compileRenderer() {
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
      editor.focus();
      compileRenderer();
    })
    .catch(renderError);

  function save() {
    var formData = new FormData();

    if (currentRun.shortId) {
      formData.set('shortId', currentRun.shortId);
    }

    formData.set('source', editor.getValue());

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
        editor.focus();
      });
  }

  function toggleLayout() {
    var main = $('#main');

    if (main.className === '-horizontal-split') {
      main.className = '';
    } else {
      main.className = '-horizontal-split';
    }

    handleResize();
  }

  $('#save').addEventListener('click', save);
  $('#reset-state').addEventListener('click', resetState);
  $('#toggle-layout').addEventListener('click', toggleLayout);

  window.addEventListener('popstate', function (event) {
    if (event.state) {
      currentRun = event.state;
      editor.setValue(currentRun.source, -1);
      editor.focus();
    }
  });

  function handleSourceChange() {
    if (!hasSyntaxError) {
      compileRenderer();
    }
  }

  editor.on('change', _.debounce(handleSourceChange, 250));

  var canvas = $('#canvas');
  var error = $('#error');

  function resizeCanvas() {
    canvas.width = canvas.parentNode.offsetWidth;
    canvas.height = canvas.parentNode.offsetHeight;
  }

  resizeCanvas();

  function resetState() {
    rendererState = {};
    rendererEpoch = null;
  }

  function handleResize() {
    resetState();
    resizeCanvas();
  }

  window.addEventListener('resize', _.debounce(handleResize, 250));

  function renderError(err) {
    error.className = '-visible';
    error.innerHTML = err.stack
      ? err.stack
      : err.message ? err.message : err;
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

setTimeout(initialize, 1);
