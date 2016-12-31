<template>
  <popup title="Profile" v-bind:onClose="popup.close" class="profile-popup">
    <p>
      <label>
        Display Name
        <input v-model="profile.displayName">
      </label>
    </p>
    <div class="_actions">
      <button class="_action" v-on:click="update">Update</button>
      <button class="_action" v-on:click="signOut">Sign out</button>
      <button class="_action" v-on:click="popup.close">Close</button>
    </div>
  </popup>
</template>

<script>
import 'whatwg-fetch';

import Popup from './common/Popup'

export default {
  components: {
    Popup
  },
  data() {
    return {
      profile: {
        displayName: null
      }
    };
  },
  props: {
    popup: Object,
    user: Object
  },
  mounted() {
    Object.assign(this.profile, this.user.profile);
  },
  methods: {
    signOut() {
      this.popup.close();
      this.$emit('signOut');
    },
    update() {
      const body = JSON.stringify(this.profile);
      const headers = new Headers();

      headers.append('Content-Type', 'application/json');
      headers.append('Content-Length', body.length);

      const options = {
        method: 'PUT',
        headers,
        body,
        credentials: 'same-origin'
      };

      fetch('/api/profile', options)
        .then((response) => {
          if (!response.ok) {
            console.error(response.status);
            throw new Error('Profile update failed');
          }

          return response.json();
        })
        .then((profile) => {
          this.user.profile = profile;
        });
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
