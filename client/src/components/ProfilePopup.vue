<template>
  <popup title="Profile" v-if="popup.isOpen" v-bind:onClose="popup.close" class="profile-popup">
    <p>
      Signed in as Ates Goral
      &mdash;
      <button class="_action" v-on:click="signOut">Sign out</button>
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
    onSignOut: Function
  },
  methods: {
    signOut() {
      this.popup.close();
      this.onSignOut();
    }
  }
}
</script>

<style lang="less">
@import "common/button";

.profile-popup {
  ._frame {
    width: 600px;
  }
}
</style>
