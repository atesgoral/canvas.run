<template>
  <transition name="fade">
    <div class="status" v-bind:class="{ '-success': status.type === 'SUCCESS', '-error': status.type === 'ERROR', '-pending': status.type === 'PENDING' }" v-if="status.isOpen">
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

  close() {
    this.isOpen = false;
    this.type = null;
    this.message = null;

    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
  }

  pending(message) { return this.open('PENDING', message); }
  info(message) { return this.open('INFO', message); }
  success(message) { return this.open('SUCCESS', message); }
  error(message) { return this.open('ERROR', message); }

  dismiss() {
    this.dismissTimeout = setTimeout(() => {
      this.dismissTimeout = null;
      this.close();
    }, 2000);
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
    padding: 0 1rem 0 2rem;
    line-height: 2rem;
    border-radius: 1rem;
  }

  .circle(@color) {
    content: '';
    position: absolute;
    left: .5rem;
    top: .5rem;
    width: 1rem;
    height: 1rem;
    border-radius: .5rem;
    background: @color;
  }

  .slice() {
    content: '';
    position: absolute;
    width: .5rem;
    height: .5rem;
    animation-name: spin;
    animation-duration: 1000ms;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    background: @statusIndicatorInfoColor;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  &.-pending {
    > ._message:before {
      .slice();
      left: .5rem;
      top: .5rem;
      border-top-left-radius: .5rem;
      transform-origin: bottom right;
    }

    > ._message:after {
      .slice();
      left: 1rem;
      top: 1rem;
      border-bottom-right-radius: .5rem;
      transform-origin: top left;
    }
  }

  &.-info {
    > ._message:before {
      .circle(@statusIndicatorInfoColor);
    }
  }
  &.-success {
    > ._message:before {
      .circle(@statusIndicatorSuccessColor);
    }
  }

  &.-error {
    > ._message:before {
      .circle(@statusIndicatorErrorColor);
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
