<template>
  <transition name="fade-slide">
    <div class="popup" v-on:keyup.esc="popup.close">
      <div class="_modal-mask"></div>
      <button type="button" class="_tab-trap" v-on:focus="restoreFocus(-1)"></button>
      <div class="_frame" ref="frame">
        <h2 class="_title">{{ title }}</h2>
        <status v-bind:status="popup.status"></status>
        <div class="_content">
          <slot></slot>
        </div>
        <button type="button" class="_close-button" title="Close" v-on:click="popup.close">Close</button>
      </div>
      <button type="button" class="_tab-trap" v-on:focus="restoreFocus(0)"></button>
    </div>
  </transition>
</template>

<script>
import Status from './Status';

class Popup {
  constructor() {
    this.isOpen = false;
    this.status = new Status.Model();

    this.close = () => {
      this.isOpen = false;
    };
  }

  open() {
    this.isOpen = true;
  }
}

export default {
  components: {
    Status
  },
  props: {
    title: String,
    popup: Object
  },
  mounted() {
    this.restoreFocus(0);
  },
  methods: {
    restoreFocus(idx) {
      const selector = 'input, button, select, textarea, a[href], *[tabindex]';
      const candidates = Array.prototype.slice.call(this.$refs.frame.querySelectorAll(selector), 0);
      const tabbables = candidates
        .filter((el) => {
          return el.tabIndex >= 0;
        })
        .slice(idx);

      if (tabbables.length) {
        tabbables[0].focus();
      }
    }
  },
  Model: Popup
}
</script>

<style lang="less">
@import "colors";
@import "button";

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

  > ._tab-trap {
    position: absolute;
    left: -9999px;
  }

  > ._frame {
    position: relative;
    z-index: 2;
    margin: 80px auto 0;
    display: inline-block;
    box-sizing: border-box;
    background: @panelBgColor;
    color: @panelContentColor;

    > ._title {
      height: 3rem;
      font-size: 1.5rem;
      line-height: 3rem;
      margin: 0;
      text-transform: uppercase;
      text-align: center;
      opacity: 0.75;
    }

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

      &:enabled:hover {
        &:before {
          color: @buttonHoverContentColor;
        }
      }

      &:focus {
        &:before {
          color: @accent2Color;
        }
      }
    }

    > .status {
      position: absolute;
      bottom: .5rem;
      left: 50%;
      z-index: 2;
    }

    > ._content {
      padding: 3rem;

      > *:first-child {
        margin-top: 0;
      }

      > *:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        text-transform: uppercase;
        font-size: 12/16rem;

        input {
          margin: 4px 0 0;
          width: 100%;
          box-sizing: border-box;
          padding: 8px;
          border: 1px solid @inputBackgroundColor;
          border-radius: 4px;
          background: @inputBackgroundColor;
          color: @inputContentColor;
          font-size: 1rem;

          &:focus {
            outline: none;
            border: 1px solid @accent2Color;
          }

          &::selection {
            background: @accent2Color;
            color: @inputBackgroundColor;
          }
        }

        ._error {
          text-transform: none;
          font-size: 1rem;
          margin-top: 4px;

          &:before {
            content: '';
            display: inline-block;
            width: .75rem;
            height: .75rem;
            border-radius: .375rem;
            background: @accent1Color;
            margin-right: .25rem;
          }
        }
      }

      ._action {
        .button();

        font-size: 12/16rem;
        text-transform: uppercase;

        padding: 8px;
        border: 1px solid @buttonBorderColor;
        border-radius: 4px;

        &:enabled:hover {
          border-color: @buttonHoverBorderColor;
        }

        &:focus {
          border-color: @accent2Color;
        }
      }
      > ._actions {
        margin-top: 3rem;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;

        > button {
          margin-left: 4px;
        }
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
