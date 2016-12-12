<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1>
      <button class="_tool -accent-3" v-on:click="save">Save</button>
      <button class="_tool -accent-1" v-on:click="resetState">Reset State</button>
      <button class="_tool -accent-2" v-on:click="toggleLayout">Toggle Layout</button>
      <span class="_right-aligned">
        <button class="_profile" v-if="profile">
          <span class="_picture" v-bind:style="{ backgroundImage: 'url(' + profile.pictureUrl + ')' }"></span>
          <span class="_display-name">{{ profile.displayName }}</span>
        </button>
        <button class="_tool -accent-3" v-on:click="signIn" v-if="!isSignedIn">Sign in</button>
        <button class="_tool -accent-1" v-on:click="signOut" v-if="isSignedIn">Sign out</button>
      </span>
    </header>
    <main v-bind:class="{ '-horizontal-split': isLayoutHorizontal }">
      <editor-pane
        ref="editorPane"
        v-bind:run="run"
        v-on:sourceUpdate="handleEditorSourceUpdate"
        v-on:syntaxError="handleEditorSyntaxError"></editor-pane>
      <splitter
        v-bind:is-horizontal="isLayoutHorizontal"
        v-on:drag="handleSplitterDrag"></splitter>
      <output-pane
        v-bind:layoutChangeCnt="layoutChangeCnt"
        v-bind:rendererSource="rendererSource"
        v-bind:rendererState="rendererState"
        v-bind:error="error"></output-pane>
      <!-- error element -->
    </main>
    <popup v-if="signInPopup.isOpen" v-bind:onClose="signInPopup.close">
      <h2>Sign in using:</h2>
      <div class="_auth">
        <button class="-facebook" title="Facebook" v-on:click="auth('facebook')"><span>Facebook</span></button>
        <button class="-twitter" title="Twitter" v-on:click="auth('twitter')"><span>Twitter</span></button>
        <button class="-github" title="GitHub" v-on:click="auth('github')"><span>GitHub</span></button>
        <button class="-google" title="Google" v-on:click="auth('google')"><span>Google</span></button>
      </div>
    </popup>
  </body>
</template>

<script>
import * as _ from 'lodash/lodash.min'
import 'whatwg-fetch';

import Popup from './components/Popup'
import EditorPane from './components/EditorPane'
import Splitter from './components/Splitter'
import OutputPane from './components/OutputPane'

function runIdToPath({ shortId, revision }) {
  return revision
    ? shortId + '/' + revision
    : shortId;
}

function pathToRunId(path) {
  const tokens = path.split('/');

  return {
    shortId: tokens[0],
    revision: tokens[1] || 0
  };
}

export default {
  components: {
    Popup,
    EditorPane,
    Splitter,
    OutputPane
  },
  data() {
    return {
      signInPopup: {
        isOpen: false,
        open: function () {
          this.isOpen = true;
          this.close = () => {
            this.isOpen = false;
          }
        }
      },
      isLayoutHorizontal: true,
      layoutChangeCnt: 0,
      run: null,
      rendererSource: null,
      rendererState: {},
      error: null,
      isSignedIn: false,
      profile: null,
      authPopupWindow: null
    }
  },
  mounted() {
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
        this.isSignedIn = true;
        this.profile = event.data.profile;
        break;
      case 'RUNTIME_ERROR':
        this.error = 'Runtime error';
        break;
      case 'COMPILATION_ERROR':
        this.error = 'Compilation error';
        break;
      }
    });

    Promise.resolve()
      .then(() => {
        const runId = pathToRunId(window.location.pathname.slice(1));

        const path = runId.shortId
          ? runIdToPath(runId)
          : 'default';

        return fetch('/api/runs/' + path, { credentials: 'same-origin' })
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
          history.replaceState(run, 'Run ' + runIdToPath(run), '/' + runIdToPath(run));
        } else {
          history.replaceState(run, 'Default run');
        }
      })
      .catch((error) => {
        this.error = error.message;
      });

      fetch('/api/profile', { credentials: 'same-origin' })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Not signed in');
          }
        })
        .then((profile) => {
          if (profile) {
            this.isSignedIn = true;
            this.profile = profile;
          }
        });
  },
  methods: {
    save() {
      if (!this.run) {
        return;
      }

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
          this.run = run;
          history.pushState(run, 'Run ' + runIdToPath(run), '/' + runIdToPath(run));
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
      this.isLayoutHorizontal = !this.isLayoutHorizontal
      this.resetState();
      this.notifyLayoutChange();
    },
    auth(provider) {
      this.signInPopup.close();

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
    },
    signIn() {
      this.signInPopup.open();
    },
    signOut() {
      fetch('/auth/signOut', { method: 'POST', credentials: 'same-origin' })
        .then((response) => {
          if (response.ok) {
            this.isSignedIn = false;
            this.profile = null;
          }
        });
        // @todo show error?
    },
    handleSplitterDrag(offset) {
      const mainEl = this.$el.querySelector('main');
      const editorPaneEl = this.$refs.editorPane.$el;
      const mainBounds = mainEl.getBoundingClientRect();
      const editorBounds = editorPaneEl.getBoundingClientRect();

      if (this.isLayoutHorizontal) {
        editorPaneEl.style.flexBasis = (editorBounds.width + offset) / mainBounds.width * 100 + '%';
      } else {
        editorPaneEl.style.flexBasis = (editorBounds.height + offset) / mainBounds.height * 100 + '%';
      }

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
@import "colors";
@import "button";

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
    transition: background 100ms;
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
._auth {
  display: flex;
  justify-content: center;

  @authButtonSize: 120px;

  > button {
    .button();

    border-radius: 10px;
    height: @authButtonSize;
    margin: 0 1rem;
    position: relative;
    transition: transform 50ms;
    width: @authButtonSize;
    margin-bottom: 2rem;

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
      background: url(/static/facebook_logo.png) 50% 50%;
      background-size: cover;
    }
    &.-twitter {
      background: url(/static/twitter_logo.png) 50% 50%;
      background-size: cover;
    }
    &.-github {
      background: white url(/static/github_logo.png) 50% 50%;
      background-size: cover;
    }
    &.-google {
      background: white url(/static/google_logo.png) 50% 50%;
      background-size: cover;
    }

    &:hover {
      transform: scale(1.05);
    }
  }
}
</style>
