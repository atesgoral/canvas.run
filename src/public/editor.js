function $(id) {
  if (id[0] === '#') {
    return document.getElementById(id.slice(1));
  }
}

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

  var editorPane = $('#editor-pane');

  var editor = ace.edit(editorPane);
  editor.$blockScrolling = Infinity;
  editor.setShowPrintMargin(false);
  editor.setTheme("ace/theme/monokai");
  editor.setFontSize(14);

  var session = editor.getSession();

  session.setMode("ace/mode/javascript");

  session.on('changeAnnotation', function () {
    var isErrorFound = session.getAnnotations().some(function (annotation) {
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

  var main = $('#main');
  var isLayoutHorizontal = true;

  function toggleLayout() {
    isLayoutHorizontal = !isLayoutHorizontal;

    main.className = isLayoutHorizontal ? '-horizontal-split' : '';

    handleResize();
  }

  $('#save').addEventListener('click', save);
  $('#reset-state').addEventListener('click', resetState);
  $('#toggle-layout').addEventListener('click', toggleLayout);

  var splitter = $('#splitter');
  var splitterHandle = $('#splitter-handle');
  var splitterDrag = null;

  function handleDragStart(event) {
    splitterDrag = {
      pos: isLayoutHorizontal ? splitter.offsetLeft : splitter.offsetTop,
      handlePos: isLayoutHorizontal ? splitterHandle.offsetLeft : splitterHandle.offsetTop,
      start: isLayoutHorizontal ? event.clientX : event.clientY
    };

    function handleDragMove(event) {
      if (splitterDrag) {
        var pos = isLayoutHorizontal ? event.clientX : event.clientY;
        var offset = pos - splitterDrag.start;

        if (isLayoutHorizontal) {
          splitterHandle.style.left = splitterDrag.handlePos + offset + 'px';
        } else {
          splitterHandle.style.top = splitterDrag.handlePos + offset + 'px';
        }
      }
    }

    function handleDragEnd(event) {
      if (splitterDrag) {
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('mousemove', handleDragMove);

        var pos = isLayoutHorizontal ? event.clientX : event.clientY;
        var offset = pos - splitterDrag.start;

        if (isLayoutHorizontal) {
          editorPane.style.flexBasis = (editorPane.offsetWidth + offset) / (main.offsetWidth - splitter.offsetWidth) * 100 + '%';
          splitterHandle.style.left = 0;
        } else {
          editorPane.style.flexBasis = (editorPane.offsetHeight + offset) / (main.offsetHeight - splitter.offsetHeight) * 100 + '%';
          splitterHandle.style.top = 0;
        }

        splitterDrag = null;

        handleResize();
      }
    }

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }

  splitterHandle.addEventListener('mousedown', handleDragStart);

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
    error.innerHTML = err.message + '\n\n' + err.stack;
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
