<template>
  <popup title="Profile" v-if="popup.isOpen" v-bind:onClose="popup.close" class="profile-popup">
    <p>
      <label>
        Display Name
        <input value="Ates Goral">
      </label>
    </p>
    <div class="_actions">
      <button class="_action" v-on:click="update" v-bind:disabled="true">Update</button>
      <button class="_action" v-on:click="signOut">Sign out</button>
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
    user: Object
  },
  methods: {
    signOut() {
      this.popup.close();
      this.$emit('signOut');
    },
    update() {

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
