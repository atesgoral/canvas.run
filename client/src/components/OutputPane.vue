<template>
  <div class="output-pane">
    <div class="_canvas-wrapper">
      <canvas></canvas>
    </div>
    <div class="_error"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'Hello Vue!'
    }
  },
  mounted() {
    const canvasEl = this.$el.querySelector('canvas');
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

  > ._canvas-wrapper {
    flex: 1;

    > canvas {
      position: absolute;
      background: #000;
    }
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
