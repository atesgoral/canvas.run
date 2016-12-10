<template>
  <transition name="fade-slide">
    <div class="popup" tabindex="0" v-on:keyup.esc="onClose()">
      <div class="_modal-mask"></div>
      <div class="_frame">
        <button class="_close-button" title="Close" v-on:click="onClose()">Close</button>
        <div class="_content">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
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
@import "../button";

.popup {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-content: center;

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
    margin: 80px auto 0;
    display: inline-block;
    box-sizing: border-box;
    background: @panelBgColor;
    color: @panelContentColor;

    > ._close-button {
      .button();

      text-indent: -9999px;
      position: absolute;
      top: 0;
      right: 0;
      width: 3rem;
      height: 3rem;
      font-size: 1.5rem;
      line-height: 3rem;

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
    }

    > ._content {
      padding: 3rem;

      *:first-child {
        margin-top: 0;
      }

      *:last-child {
        margin-bottom: 0;
      }
    }
  }

  &.fade-slide-enter-active, &.fade-slide-leave-active {
    transition: opacity .5s;

    > ._frame {
      transition: transform .5s;
    }
  }
  &.fade-slide-enter, &.fade-slide-leave-active {
    opacity: 0;

    > ._frame {
      transform: translateY(-500px);
    }
  }
}
</style>
