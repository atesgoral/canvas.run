<template>
  <popup title="Sign in" v-if="popup.isOpen" v-bind:onClose="popup.close" class="sign-in-popup">
    <h3>Sign in using:</h3>
    <div class="_auth-methods">
      <button class="-facebook" title="Facebook" v-on:click="auth('facebook')"><span>Facebook</span></button>
      <button class="-twitter" title="Twitter" v-on:click="auth('twitter')"><span>Twitter</span></button>
      <button class="-github" title="GitHub" v-on:click="auth('github')"><span>GitHub</span></button>
      <button class="-google" title="Google" v-on:click="auth('google')"><span>Google</span></button>
    </div>
    <p class="_actions">
      <button class="_action" v-on:click="popup.close">Cancel</button>
    </p>
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
    auth(provider) {
      this.popup.close();

      if (this.authPopupWindow && !this.authPopupWindow.closed) {
        this.authPopupWindow.close();
      }

      const width = 600;
      const height = 500;
      const left = window.screenX + Math.floor(Math.max(0, window.outerWidth - width) / 2);
      const top = window.screenY + Math.floor(Math.max(0, window.outerHeight - height) / 2);
      const featureMap = {
        width,
        height,
        left,
        top,
        menubar: 0,
        toolbar: 0,
        location: 0,
        personalbar: 0
      };
      const featureStr = Object.keys(featureMap)
        .map(name => `${name}=${featureMap[name]}`)
        .join();
      this.authPopupWindow = window.open('/auth/' + provider, 'auth', featureStr);
    }
  }
}
</script>

<style lang="less">
@import "common/button";

.sign-in-popup {
  ._auth-methods {
    display: flex;
    justify-content: center;
    margin-left: -1rem;
    margin-right: -1rem;

    @authButtonSize: 120px;

    > button {
      .button();

      border: 1px solid @buttonBorderColor;
      border-radius: 10px;
      height: @authButtonSize;
      margin: 0 1rem;
      position: relative;
      transition: transform 50ms;
      width: @authButtonSize;
      margin-bottom: 2rem;

      &:after {
        content: '';
        position: absolute;
        border-radius: 7px;
        left: 3px;
        right: 3px;
        top: 3px;
        bottom: 3px;
        background-size: cover;
        background-position: 50% 50%;
      }

      > span {
        position: absolute;
        left: 0;
        width: 100%;
        top: @authButtonSize;
        margin-top: 1rem;
        height: 2rem;
        line-height: 2rem;
        font-size: 1rem;
      }

      &.-facebook {
        &:after {
          background-image: url(/static/facebook_logo.png);
        }
      }
      &.-twitter {
        &:after {
          background-image: url(/static/twitter_logo.png);
        }
      }
      &.-github {
        &:after {
          background-color: white;
          background-image: url(/static/github_logo.png);
        }
      }
      &.-google {
        &:after {
          background-color: white;
          background-image: url(/static/google_logo.png);
        }
      }

      &:hover {
        border-color: @buttonHoverBorderColor;
      }
    }
  }
}
</style>
