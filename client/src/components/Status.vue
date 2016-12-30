<template>
  <transition name="fade">
    <div class="status" v-bind:class="{ '-success': status.type === 'SUCCESS', '-error': status.type === 'ERROR' }" v-if="status.isOpen">
      <span class="_message">{{ status.message }}</span>
    </div>
  </transition>
</template>

<script>
class Status {
  constructor() {
    this.isOpen = false;
    this.message = null;
    this.type = null;
  }

  open(type, message) {
    this.isOpen = true;
    this.type = type;
    this.message = message;

    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }

    return this;
  }

  info(message) {
    return this.open('INFO', message);
  }

  success(message) {
    return this.open('SUCCESS', message);
  }

  error(message) {
    return this.open('ERROR', message);
  }

  dismiss() {
    this.dismissTimeout = setTimeout(() => {
      this.isOpen = false;
      this.dismissTimeout = null;
    }, 3000);
  }
}

export default {
  props: {
    status: Object
  },
  Model: Status
}
</script>

<style lang="less">
@import "./common/colors";

@statusBgColor: @panelBgColor;
@statusContentColor: @panelContentColor;
@statusIndicatorInfoColor: @statusContentColor;
@statusIndicatorSuccessColor: @accent3Color;
@statusIndicatorErrorColor: @accent1Color;

.status {
  position: absolute;
  z-index: 20;
  top: 80px;
  left: 50%;
  text-align: center;
  color: @statusContentColor;

  > ._indicator {
    position: absolute;
    display: inline-block;
    width: 1rem;
    height: 1rem;
    top: .5rem;
    left: .5rem;
    background: @statusIndicatorInfoColor;
  }

  > ._message {
    position: relative;
    left: -50%;
    display: inline-block;
    background: @statusBgColor;
    padding: 0 2rem;
    line-height: 2rem;
    border-radius: 1rem;

    &:before {
      content: '';
      position: absolute;
      width: 1rem;
      height: 1rem;
      background: red;
      border-radius: .5rem;
      left: .5rem;
      top: .5rem;
      background: @statusIndicatorInfoColor;
    }
  }

  &.-success {
    > ._message:before {
      background: @statusIndicatorSuccessColor;
    }
  }

  &.-error {
    > ._message:before {
      background: @statusIndicatorErrorColor;
    }
  }

  &.fade-enter-active, &.fade-leave-active {
    transition: opacity .5s;
  }
  &.fade-enter, &.fade-leave-active {
    opacity: 0;
  }
}
</style>
