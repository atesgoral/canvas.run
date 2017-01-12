<template>
  <transition name="fade-slide">
    <div class="popup" v-on:keyup.esc="popup.close">
      <div class="_modal-mask"></div>
      <tab-trap>
        <div class="_frame" ref="frame">
          <h2 class="_title">{{ title }}</h2>
          <status v-bind:status="popup.status"></status>
          <div class="_content">
            <slot></slot>
          </div>
          <button type="button" class="_close-button" title="Close" v-on:click="popup.close">Close</button>
        </div>
      </tab-trap>
    </div>
  </transition>
</template>

<script>
import TabTrap from './TabTrap';
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
    TabTrap,
    Status
  },
  props: {
    title: String,
    popup: Object
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

  > ._modal-mask {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: @modalMaskBgColor;
  }

  > .tab-trap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-content: center;

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
        font-size: 1.25rem;
        line-height: 3rem;
        margin: 0;
        text-transform: uppercase;
        text-align: center;
        opacity: 0.5;
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

        &:enabled {
          &:hover {
            &:before {
              color: @buttonHoverContentColor;
            }
          }

          &:focus {
            &:before {
              color: @accent5Color;
            }
          }

          &:active {
            &:before {
              color: @accent3Color;
            }
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

        @dotSize: .75rem;
        @dotGap: .25em;

        .text-dot(@color) {
          text-indent: -(@dotSize + @dotGap);

          &:before {
            content: '';
            display: inline-block;
            width: @dotSize;
            height: @dotSize;
            border-radius: @dotSize / 2;
            background: @color;
            margin-right: @dotGap;
          }
        }

        ._instructions {
          font-size: 1rem;

          .text-dot(@accent5Color);
        }

        label {
          display: block;
          text-transform: uppercase;
          font-size: 12/16rem;
          margin-bottom: 1rem;

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
              border: 1px solid @accent5Color;
            }

            &::selection {
              background: darken(@accent5Color, 20%);
            }
          }

          ._error {
            text-transform: none;
            font-size: 1rem;
            margin-top: 4px;

            .text-dot(@accent1Color);
          }
        }

        ._action {
          .button();

          font-size: 12/16rem;
          text-transform: uppercase;

          padding: 8px;
          border: 1px solid @buttonBorderColor;
          border-radius: 4px;

          &:enabled {
            &:hover {
              border-color: @buttonHoverBorderColor;
            }

            &:active {
              color: @accent3Color;
              border-color: @accent3Color;
            }
          }

          &:focus {
            border-color: @accent5Color;
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
}
</style>
