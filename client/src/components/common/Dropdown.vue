<template>
  <transition name="fade-slide">
    <tab-trap class="dropdown" v-on:keyup.esc="dropdown.close">
      <slot></slot>
    </tab-trap>
  </transition>
</template>

<script>
import TabTrap from './TabTrap';

class Dropdown {
  constructor() {
    this.isOpen = false;

    this.open = () => {
      this.isOpen = true;
    };

    this.toggle = () => {
      this.isOpen = !this.isOpen;
    };

    this.close = () => {
      this.isOpen = false;
    };
  }
}

export default {
  components: {
    TabTrap
  },
  props: {
    dropdown: Object
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
  padding: .5em 0;

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
