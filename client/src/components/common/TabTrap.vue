<template>
  <div class="tab-trap">
    <button type="button" v-on:focus="restoreFocus(-1)"></button>
    <slot></slot>
    <button type="button" v-on:focus="restoreFocus(0)"></button>
  </div>
</template>

<script>
export default {
  mounted: function () {
    this.restoreFocus(0);
  },
  methods: {
    restoreFocus: function (idx) {
      const selector = 'input, button, select, textarea, a[href], *[tabindex]';
      const candidates = Array.prototype.slice.call(this.$el.querySelectorAll(selector), 0);
      const tabbables = candidates
        .slice(1, -1)
        .filter(function (el) {
          return el.tabIndex >= 0;
        })
        .slice(idx);

      if (tabbables.length) {
        tabbables[0].focus();
      }
    }
  }
};
</script>

<style lang="less">
.tab-trap {
  > button:first-child,  > button:last-child {
    position: absolute !important;
    left: -9999px !important;
  }
}
</style>
