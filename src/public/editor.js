function $(id) {
  if (id[0] === '#') {
    return document.getElementById(id.slice(1));
  }
}

function initialize() {
  var editor = ace.edit($('#editor'));
  editor.$blockScrolling = Infinity;

  editor.getSession().setMode("ace/mode/javascript");

  var rendererState = {};
  var renderer = null;

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

  var shortId = window.location.pathname.slice(1);

  Promise.resolve()
    .then(function () {
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
      editor.setValue(run.source, -1);
      editor.focus();
      compileRenderer();
    })
    .catch(renderError);

  function save() {
    var formData = new FormData();

    if (shortId) {
      formData.set('shortId', shortId);
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
        history.pushState(run, 'Run ' + run.shortId, '/' + run.shortId);
      });
  }

  $('#save').addEventListener('click', save);

  window.addEventListener('popstate', function (event) {
    if (event.state) {
      editor.setValue(event.state.source, -1);
      editor.focus();
    }
  });

  editor.on('change', _.debounce(compileRenderer, 250));

  var canvas = $('#canvas');
  var error = $('#error');

  function resizeCanvas() {
    canvas.width = canvas.parentNode.offsetWidth;
    canvas.height = canvas.parentNode.offsetHeight;
  }

  resizeCanvas();

  function handleResize() {
    rendererState = {};
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

    if (renderer) {
      try {
        renderer.call(null, canvas, rendererState, t);
        hideError();
      } catch (err) {
        renderer = null;

        if (err) {
          renderError(err);
        }
      }
    }
  }

  render();
}

setTimeout(initialize, 1);
