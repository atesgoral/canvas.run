<template>
  <div class="popup">
    <div class="_modal-mask"></div>
    <div class="_frame">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
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
  }
}
</style>
