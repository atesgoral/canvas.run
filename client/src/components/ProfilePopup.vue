<template>
  <popup title="Profile" v-bind:popup="popup" class="profile-popup">
    <p>
      <p class="_instructions" v-if="instructions">{{ instructions }}</p>
      <label>
        Username
        <input v-model="profile.username">
        <div class="_error" v-if="errorMap.username">{{ errorMap.username }}</div>
      </label>
      <label>
        Display Name
        <input v-model="profile.displayName">
        <div class="_error" v-if="errorMap.displayName">{{ errorMap.displayName }}</div>
      </label>
    </p>
    <div class="_actions">
      <action-button class="_action" v-bind:action="update">Update</action-button>
      <button type="button" class="_action" v-on:click="signOut">Sign out</button>
      <button type="button" class="_action" v-on:click="popup.close">Close</button>
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
    username: profile.username && trim(profile.username),
    displayName: profile.displayName && trim(profile.displayName)
  };
}

function validateProfile(profile) {
  const errorMap = {};

  if (!profile.displayName) {
    errorMap.displayName = 'Display name should not be empty';
  }

  if (!profile.username) {
    errorMap.username = 'Username should not be empty';
  } else if (!/^[a-z0-9]+$/.test(profile.username)) {
    errorMap.username = 'Username should consist of only lowercase English letters and numbers';
  } else if (/^\d/.test(profile.username)) {
    errorMap.username = 'Username should start with a letter';
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
      instructions: null,
      profile: {
        username: null,
        displayName: null
      },
      errorMap: {
        username: null,
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

    if (!this.profile.username) {
      this.instructions = 'Please pick a username consisting of only lowercase English letters or numbers, and that starts with a letter.';
      this.profile.username = this.profile.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/^\d+/, '');
    }
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
              this.instructions = null;
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
