<template>
  <div class="output-pane">
    <iframe ref="iframe"></iframe>
    <div class="_footer"></div>
    <div class="_iframe-overlay"></div>
    <div class="_error" v-bind:class="{ '-visible': error }">{{ error }}</div>
  </div>
</template>

<script>
import iframeBootstrap from './iframeBootstrap';
import iframeRuntime from './iframeRuntime';

export default {
  props: {
    layoutChangeCnt: Number,
    rendererSource: String,
    rendererState: Object,
    error: String
  },
  methods: {
    notifyIframe: function (type, data) {
      this.$refs.iframe.contentWindow.postMessage({ type, data }, '*');
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
    const bootstrapSrc = iframeBootstrap.toString();
    const runtimeSrc = iframeRuntime.toString();

    const iframeHtml = `<${'script'}>(${bootstrapSrc})()</${'script'}>`;

    const iframeUrl = `data:text/html;base64,${btoa(iframeHtml)}`;

    addEventListener('message', (e) => {
      if (e.data.type === 'IFRAME_READY') {
        this.notifyIframe('RUNTIME', runtimeSrc);
      }
    });

    this.$refs.iframe.src = iframeUrl;
  }
}
</script>

<style lang="less">
@import "common/colors";

.output-pane {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > iframe {
    padding: 1px;
    flex: 1;
    border: 0;
  }
  > ._footer {
    display: none;
    height: 30px;
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
    background: @errorMaskBgColor;
    color: @panelContentColor;
    padding: 1rem;
    z-index: 2;
    display: none;

    &:after {
      position: absolute;
      left: 50%;
      margin-left: -20rem;
      top: 50%;
      margin-top: -20rem;
      text-align: center;
      width: 40rem;
      height: 40rem;
      font-size: 40rem;
      line-height: 40rem;
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
