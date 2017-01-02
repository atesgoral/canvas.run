<template>
  <popup title="Profile" v-bind:popup="popup" class="profile-popup">
    <p>
      <label>
        Display Name
        <input v-model="profile.displayName">
      </label>
    </p>
    <div class="_actions">
      <action-button class="_action" v-bind:action="update">Update</action-button>
      <button class="_action" v-on:click="signOut">Sign out</button>
      <button class="_action" v-on:click="popup.close">Close</button>
    </div>
  </popup>
</template>

<script>
import 'whatwg-fetch';

import Popup from './common/Popup';
import ActionButton from './common/ActionButton';

export default {
  components: {
    Popup,
    ActionButton
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

      this.popup.status.pending('Updating');

      return fetch('/api/profile', options)
        .then((response) => {
          if (!response.ok) {
            console.error(response.status);
            throw new Error('Profile update failed');
          }

          return response.json();
        })
        .then((profile) => {
          this.user.profile = profile;
          this.popup.status.success('Updated').dismiss();
        })
        .catch((error) => {
          console.error(error);
          this.popup.status.error('Update failed').dismiss();
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
