<template>
  <popup title="Profile" v-bind:popup="popup" class="profile-popup">
    <p>
      <label>
        Display Name
        <input v-model="profile.displayName">
        <div class="_error" v-if="errorMap.displayName">{{ errorMap.displayName }}</div>
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

function trim(s) {
  return s.replace(/^\s*(.*?)\s*$/, '$1');
}

class ValidationError extends Error {
  constructor(message, map) {
    super(message);
    this.map = map;
  }
}

function normalizeProfile(profile) {
  return {
    displayName: profile.displayName && trim(profile.displayName)
  };
}

function validateProfile(profile) {
  const errorMap = {};

  if (!profile.displayName) {
    errorMap.displayName = 'Display name should not be empty';
  }

  if (Object.keys(errorMap).length) {
    throw new ValidationError('Validation failed', errorMap);
  }

  return profile;
}

export default {
  components: {
    Popup,
    ActionButton
  },
  data() {
    return {
      profile: {
        displayName: null
      },
      errorMap: {
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
      return Promise
        .resolve(this.profile)
        .then(normalizeProfile)
        .then(validateProfile)
        .then((profile) => {
          const body = JSON.stringify(profile);
          const headers = new Headers();

          headers.append('Content-Type', 'application/json');
          headers.append('Content-Length', body.length);

          const options = {
            method: 'PUT',
            headers,
            body,
            credentials: 'same-origin'
          };

          this.errorMap = {};
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
              Object.assign(this.profile, profile);
              this.popup.status.success('Updated').dismiss();
            });
        })
        .catch((error) => {
          // @todo This currently doesn't work with Babel
          // if (error instanceof ValidationError) {
          if (error.map) {
            this.errorMap = error.map;
            this.popup.status.error(error.message).dismiss();
          } else {
            console.error(error);
            this.popup.status.error('Update failed').dismiss();
          }
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
