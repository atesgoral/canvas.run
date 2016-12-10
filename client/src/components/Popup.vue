<template>
  <div class="popup" tabindex="0" v-on:keyup.esc="onClose()">
    <div class="_modal-mask"></div>
    <div class="_frame">
      <button class="_close-button" v-on:click="onClose()">Close</button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    onClose: Function
  },
  // methods: {
  //   close(result) {
  //     this.onClose(result);
  //   }
  // },
  mounted() {
    this.$el.focus();
  }
}
</script>

<style lang="less">
@import "../colors";

.popup {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;

  > ._modal-mask {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: @modalMaskBgColor;
  }

  > ._frame {
    position: relative;
    z-index: 2;
    margin: 70px auto 0;
    width: 800px;
    height: 100px;
    background: @panelBgColor;
    color: @panelContentColor;

    > ._close-button {
      border: 0;
      background: transparent;
      text-indent: -9999px;
      position: absolute;
      top: 0;
      right: 0;
      width: 1.5em;
      height: 1.5em;
      font-size: 1.5em;
      line-height: 1.5em;
      cursor: pointer;

      &:before {
        content: '\2716';
        color: @buttonContentColor;
        position: absolute;
        text-indent: 0;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        text-align: center;
      }

      &:hover {
        &:before {
          color: @buttonHoverContentColor;
        }
      }

      &:focus {
        outline: none;
      }
    }
  }
}
</style>
