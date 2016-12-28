<template>
  <popup title="Settings" v-if="popup.isOpen" v-bind:onClose="popup.close" class="settings-popup">
    <p>
      Layout: {{ settings.isLayoutHorizontal ? 'Horizontal' : 'Vertical' }}
      &mdash;
      <button class="_action" v-on:click="toggleLayout">Toggle Layout</button>
    </p>
    <div class="_actions">
      <button class="_action" v-on:click="popup.close">Close</button>
    </div>
  </popup>
</template>

<script>
import Popup from './common/Popup'

export default {
  components: {
    Popup
  },
  props: {
    popup: Object,
    settings: Object,
    onToggleLayout: Function
  },
  methods: {
    toggleLayout() {
      this.onToggleLayout();
    }
  }
}
</script>

<style lang="less">
@import "common/button";

.settings-popup {
  ._frame {
    width: 600px;
  }
}
</style>
