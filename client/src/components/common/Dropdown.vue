<template>
  <transition name="fade-slide">
    <div class="dropdown" v-on:keyup.esc="dropdown.close">
      <slot></slot>
    </div>
  </transition>
</template>

<script>
class Dropdown {
  constructor() {
    this.isOpen = false;

    this.open = () => {
      if (this.isOpen) {
        return;
      }

      this.isOpen = true;
    };

    this.close = () => {
      this.isOpen = false;
    };
  }
}

export default {
  props: {
    dropdown: Object
  },
  mounted() {
    this.restoreFocus();
  },
  methods: {
    getTabbables() {
      const selector = 'button, select, textarea, a[href], *[tabindex]';
      const candidates = Array.prototype.slice.call(this.$el.querySelectorAll(selector), 0);

      return candidates
        .filter((el) => {
          return el.tabIndex >= 0;
        });
    },
    restoreFocus() {
      const tabbables = this.getTabbables();

      if (tabbables.length) {
        tabbables[0].focus();
      }
    }
  },
  Model: Dropdown
};
</script>

<style lang="less">
@import "colors";
@import "button";

.dropdown {
  position: absolute;
  z-index: 10;
  background: @panelBgColor;
  color: @panelContentColor;

  > button {
    .button();

    font-size: .75rem;
    display: block;
    width: 100%;
    padding: .5rem 1rem;
    text-align: left;

    &:enabled {
      &:hover {
      }

      &:focus {
        color: #fff;
      }

      &:active {
      }
    }
  }
}
</style>
