<template>
  <div class="output-pane">
    <iframe></iframe>
    <div class="_iframe-overlay"></div>
    <div class="_error" v-bind:class="{ '-visible': error }">{{ error }}</div>
  </div>
</template>

<script>
function iframeBootstrap() {
  const bodyEl = document.body;
  const canvasEl = document.getElementsByTagName('canvas')[0];

  bodyEl.style.margin = 0;
  bodyEl.style.padding = 0;
  bodyEl.style.height = '100%';
  canvasEl.style.position = 'absolute';
  canvasEl.style.background = '#000';

  let renderer = null;
  let rendererState = {};
  let epoch = null;

  function notifyParent(type, data) {
    window.parent.postMessage({
      type,
      data
    }, '*');
  }

  function resizeCanvas() {
    var bounds = canvasEl.parentNode.getBoundingClientRect();

    canvasEl.width = bounds.width;
    canvasEl.height = bounds.height;
  }

  window.addEventListener('message', (event) => {
    switch (event.data.type) {
    case 'RESIZE':
      resizeCanvas();
      break;
    case 'SOURCE':
      try {
        renderer = new Function('canvas', 'state', 't', event.data.data);
      } catch (err) {
        renderer = null;
        notifyParent('COMPILATION_ERROR');
      }
      break;
    case 'STATE':
      rendererState = event.data.data;
      epoch = null;
      break;
    }
  });

  var render = (t) => {
    window.requestAnimationFrame(render);

    if (!renderer || !rendererState) {
      return;
    }

    if (epoch === null) {
      epoch = t;
    }

    try {
      renderer.call(null, canvasEl, rendererState, t - epoch);
    } catch (err) {
      renderer = null;
      notifyParent('RUNTIME_ERROR');
    }
  };

  function run() {
    window.requestAnimationFrame(render);
  }

  resizeCanvas();
  run();
};

export default {
  props: {
    layoutChangeCnt: Number,
    rendererSource: String,
    rendererState: Object,
    error: String
  },
  methods: {
    notifyIframe: function (type, data) {
      this.iframeEl.contentWindow.postMessage({
        type,
        data
      }, '*');
    }
  },
  watch: {
    layoutChangeCnt: function () {
      this.notifyIframe('RESIZE');
    },
    rendererSource: function (source) {
      this.notifyIframe('SOURCE', source);
    },
    rendererState: function (state) {
      this.notifyIframe('STATE', state);
    }
  },
  mounted() {
    this.iframeEl = this.$el.querySelector('iframe');

    const bootstrapSrc = iframeBootstrap.toString();
      // .replace('iframeBootstrap', '')
      // .replace(/\s+(?![a-z])/gi, '')
      // .replace(/(^|[^a-z])\s+/gi, '$1');

    const iframeHtml = '<canvas></canvas>'
      + '<' + 'script>('
      + bootstrapSrc
      + ')();<' + '/script>';

    const iframeUrl = 'data:text/html;base64,' + btoa(iframeHtml);

    this.iframeEl.src = iframeUrl;
  }
}
</script>

<style lang="less">
@errorMaskBg: hsla(70, 3%, 30%, 50%);

// @todo from include
@panelContent: hsl(70, 3%, 75%);

.output-pane {
  padding: 1px;
  box-sizing: border-box;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > iframe {
    width: 100%;
    flex: 1;
    border: 0;
  }
  > ._iframe-overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
  > ._error {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: 0;
    background: @errorMaskBg;
    color: @panelContent;
    padding: 1em;
    z-index: 2;
    display: none;
    overflow: auto;

    &:after {
      position: absolute;
      left: 50%;
      margin-left: -20em;
      top: 50%;
      margin-top: -20em;
      text-align: center;
      width: 40em;
      height: 40em;
      font-size: 40em;
      line-height: 40em;
      content: '\26a0';
      color: red;
      opacity: .25;
      transform: rotate(10deg);
    }
    &.-visible {
      display: block;
    }
  }
}
</style>
