<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1>
      <button class="_tool -accent-3" v-on:click="save" v-if="run">{{ run.shortId ? 'Update' : 'Save' }}</button>
      <button class="_tool -accent-1" v-on:click="resetState" v-if="run">Reset State</button>
      <span class="_right-aligned">
        <button class="_tool -accent-2" v-on:click="showSettings">Settings</button>
        <button class="_profile" v-on:click="showProfile" v-if="user">
          <span class="_picture" v-bind:style="{ backgroundImage: 'url(' + user.profile.pictureUrl + ')' }"></span>
          <span class="_display-name">{{ user.profile.displayName }}</span>
        </button>
        <button class="_tool -accent-3" v-on:click="signIn" v-if="!user">Sign in</button>
      </span>
    </header>
    <status v-bind:status="status"></status>
    <main v-bind:class="{ '-horizontal-split': settings.isLayoutHorizontal }">
      <editor-pane
        ref="editorPane"
        v-bind:style="{ flexBasis: settings.splitterPercentage + '%' }"
        v-bind:run="run"
        v-on:sourceUpdate="handleEditorSourceUpdate"
        v-on:syntaxError="handleEditorSyntaxError"></editor-pane>
      <splitter
        v-bind:is-horizontal="settings.isLayoutHorizontal"
        v-on:drag="handleSplitterDrag"></splitter>
      <output-pane
        v-bind:layoutChangeCnt="layoutChangeCnt"
        v-bind:rendererSource="rendererSource"
        v-bind:rendererState="rendererState"
        v-bind:error="error"></output-pane>
      <!-- error element -->
    </main>
    <sign-in-popup v-bind:popup="signInPopup"></sign-in-popup>
    <profile-popup v-bind:popup="profilePopup" v-bind:user="user" v-on:signOut="signOut"></profile-popup>
    <settings-popup v-bind:popup="settingsPopup" v-bind:settings="settings" v-on:toggleLayout="toggleLayout"></settings-popup>
  </body>
</template>

<script>
import * as _ from 'lodash/lodash.min'
import 'whatwg-fetch';

import Popup from './components/common/Popup'
import Status from './components/Status'
import EditorPane from './components/EditorPane'
import Splitter from './components/Splitter'
import OutputPane from './components/OutputPane'
import SignInPopup from './components/SignInPopup'
import ProfilePopup from './components/ProfilePopup'
import SettingsPopup from './components/SettingsPopup'

export default {
  components: {
    Status,
    EditorPane,
    Splitter,
    OutputPane,
    SignInPopup,
    ProfilePopup,
    SettingsPopup
  },
  data() {
    return {
      signInPopup: new Popup.Model(),
      profilePopup: new Popup.Model(),
      settingsPopup: new Popup.Model(),
      status: new Status.Model(),
      layoutChangeCnt: 0,
      run: null,
      rendererSource: null,
      rendererState: {},
      error: null,
      user: null,
      settings: {
        isLayoutHorizontal: true,
        splitterPercentage: 50
      }
    }
  },
  watch: {
    settings: {
      handler: (settings) => {
        localStorage.setItem('settings', JSON.stringify(settings));
      },
      deep: true
    }
  },
  mounted() {
    try {
      Object.assign(this.settings, JSON.parse(localStorage.getItem('settings')));
    } catch (e) {}

    window.addEventListener('resize', _.debounce(() => {
      this.resetState();
      this.notifyLayoutChange();
    }, 250));

    window.addEventListener('popstate', (event) => {
      if (event.state) {
        this.run = event.state;
      }
    });

    window.addEventListener('message', (event) => {
      switch (event.data.type) {
      case 'SIGNED_IN':
        this.user = event.data.user;
        break;
      case 'RUNTIME_ERROR':
        this.error = 'Runtime error';
        break;
      case 'COMPILATION_ERROR':
        this.error = 'Compilation error';
        break;
      }
    });

    const path = window.location.pathname.slice(1);

    Promise.resolve()
      .then(() => {
        const tokens = path.split('/');
        const mode = tokens[0];
        const shortId = tokens[1];
        const revision = tokens[2];

        let url = '/api/runs/';

        if (shortId) {
          url += shortId;

          if (revision) {
            url += '/' + revision;
          }
        } else {
          url += 'default';
        }

        this.status.pending('Loading');

        return fetch(url, { credentials: 'same-origin' })
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              switch (response.status) {
              case 404:
                throw new Error('Run not found');
              default:
                throw new Error('Could not fetch run');
              }
            }
          });
      })
      .then((run) => {
        this.run = run;

        if (run.shortId) {
          history.replaceState(run, 'Run ' + run.shortId, '/' + path);
        } else {
          history.replaceState(run, 'Default run');
        }

        this.status.close();
      })
      .catch((error) => {
        this.run = { source: '' };
        this.status.error(error.message).dismiss();
      });

      // @todo isInitializing etc. to hide Sign in button while this is happening
      fetch('/api/user', { credentials: 'same-origin' })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            return null;
            // @todo handle non-403 response
            // throw new Error();
          }
        })
        .then((user) => this.user = user);
  },
  methods: {
    save() {
      this.status.pending('Saving');

      const formData = new FormData();

      if (this.run.shortId) {
        formData.append('shortId', this.run.shortId);
      }

      formData.append('source', this.run.source);

      fetch('/api/runs', { method: 'POST', body: formData, credentials: 'same-origin' })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            console.error(response.status);
            throw new Error('Saving failed');
          }
        })
        .then((run) => {
          if (run.shortId !== this.run.shortId) {
            history.pushState(run, 'Run ' + run.shortId, '/' + 'edit' + '/' + run.shortId);
          } else {
            history.replaceState(run, 'Run ' + run.shortId, '/' + 'edit' + '/' + run.shortId);
          }
          this.run = run;
          this.status.success('Saved').dismiss();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Saving failed').dismiss();
        });
    },
    resetState() {
      this.rendererState = {};
    },
    notifyLayoutChange() {
      window.setTimeout(() => {
        this.layoutChangeCnt++;
      }, 1);
    },
    toggleLayout() {
      this.settings.isLayoutHorizontal = !this.settings.isLayoutHorizontal
      this.resetState();
      this.notifyLayoutChange();
    },
    signIn() {
      this.signInPopup.open();
    },
    signOut() {
      fetch('/auth/signOut', { method: 'POST', credentials: 'same-origin' })
        .then((response) => {
          if (response.ok) {
            this.user = null;
          }
        });
        // @todo show error?
    },
    showProfile() {
      this.profilePopup.open();
    },
    showSettings() {
      this.settingsPopup.open();
    },
    handleSplitterDrag(offset) {
      const mainEl = this.$el.querySelector('main');
      const editorPaneEl = this.$refs.editorPane.$el;
      const mainBounds = mainEl.getBoundingClientRect();
      const editorBounds = editorPaneEl.getBoundingClientRect();

      this.settings.splitterPercentage = this.settings.isLayoutHorizontal
        ? (editorBounds.width + offset) / mainBounds.width * 100
        : (editorBounds.height + offset) / mainBounds.height * 100;

      this.resetState();
      this.notifyLayoutChange();
    },
    handleEditorSourceUpdate(source) {
      this.run.source = source;
      this.rendererSource = source;
      this.error = null;
    },
    handleEditorSyntaxError() {
      console.log('syntax error');
      this.rendererSource = null;
      this.error = 'Syntax error';
    }
  }
}
</script>

<style lang="less">
@import "components/common/colors";
@import "components/common/button";

@headerHeight: 40px;

@logoVPadding: 10px;
@logoHPadding: 50px;
@logoHeight: @headerHeight - @logoVPadding * 2;
@logoAspectRatio: 2036 / 280;

body {
  font-family: 'Varela Round', sans-serif;
  font-size: 100%;
  margin: 0;
  padding: 0;
  background: @bodyBgColor;
}
header {
  display: flex;
  align-items: baseline;
  height: @headerHeight;
  background: @panelBgColor;
  color: @panelContentColor;

  > h1 {
    display: inline;
    margin: 0;
    padding-left: @logoHPadding;
    padding-right: @headerHeight;
    height: @headerHeight;
    line-height: @headerHeight;
    font-size: 1rem;

    a {
      cursor: pointer;
      text-indent: -9999px;
      display: inline-block;
      height: @logoHeight;
      width: @logoHeight * @logoAspectRatio;
      vertical-align: middle;
      background: url(/static/logo.png) 0 0 no-repeat;
      background-size: contain;
      opacity: .75;

      &:hover {
        opacity: 1;
      }
    }
  }

  ._tool {
    .button();

    height: @headerHeight;
    line-height: @headerHeight;
    padding: 0 5px;
    font-size: 0.75rem;
    margin-right: 4px;
    position: relative;
    overflow: hidden;
    text-transform: uppercase;

    &:after {
      content: '';
      position: absolute;
      left: 5px;
      right: 5px;
      height: 3px;
      border-radius: 1.5px;
      bottom: -3px;
      transition: bottom 100ms;
    }

    &:hover {
      &:after {
        bottom: 6px;
      }
    }

    &:active {
      &:after {
        bottom: 8px;
      }
    }

    &.-accent-1:after { background: @buttonHoverAccent1Color; }
    &.-accent-2:after { background: @buttonHoverAccent2Color; }
    &.-accent-3:after { background: @buttonHoverAccent3Color; }
  }

  ._right-aligned {
    flex-grow: 1;
    text-align: right;
    margin-right: 50px;

    > ._profile {
      .button();

      padding-right: 0;
      font-size: 1rem;

      ._picture {
        display: inline-block;
        vertical-align: middle;
        width: @headerHeight - 10px;
        height: @headerHeight - 10px;
        border-radius: (@headerHeight - 10px) / 2;

        background-repeat: no-repeat;
        background-position: 50% 50%;
        background-size: cover;
      }

      ._display-name {
        display: inline-block;
        margin-left: 5px;
        font-size: 0.75rem;
      }
    }

    > ._tool {
      margin-left: 4px;
      margin-right: 0;
    }
  }
}
main {
  position: absolute;
  top: @headerHeight;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;

  &.-horizontal-split {
    flex-direction: row;
  }
}
</style>
