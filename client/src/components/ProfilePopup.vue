<template>
  <popup v-if="popup.isOpen" v-bind:onClose="popup.close" class="profile-popup">
    <h2>Profile</h2>
  </popup>
</template>

<script>
import Popup from './common/Popup'

export default {
  components: {
    Popup
  },
  props: {
    popup: Object
  },
  methods: {
  }
}
</script>

<style lang="less">
@import "common/button";

.profile-popup {

}
</style>
