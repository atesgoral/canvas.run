<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1><!--
     --><button id="save" class="-accent-1" v-on:click="save">Save</button><!--
     --><button id="reset-state" class="-accent-2" v-on:click="resetState">Reset State</button><!--
     --><button id="toggle-layout" class="-accent-3" v-on:click="toggleLayout">Toggle Layout</button><!--
     --><button id="sign-in" class="-accent-1" v-on:click="signIn('facebook')" v-if="!isSignedIn">Sign in with Facebook</button><!--
     --><button id="sign-in" class="-accent-1" v-on:click="signIn('twitter')" v-if="!isSignedIn">Sign in with Twitter</button><!--
     --><button id="sign-in" class="-accent-1" v-on:click="signIn('github')" v-if="!isSignedIn">Sign in with GitHub</button><!--
     --><button id="sign-out" class="-accent-1" v-on:click="signOut" v-if="isSignedIn">Sign out</button><!--
     --><span v-if="profile" class="_profile">
        <span class="_picture" v-bind:style="{ backgroundImage: 'url(' + profile.pictureUrl + ')' }"></span><!--
     --><span class="_display-name">{{ profile.displayName }}</span>
      </span>
    </header>
    <main id="main" v-bind:class="{ '-horizontal-split': isLayoutHorizontal }">
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
<script type="text/default" id="default">// Here, you're writing the contents of a function with the following signature:
// function render(canvas, state, t)

// Get the context you want from the "canvas" argument
var ctx = canvas.getContext('2d');

ctx.fillStyle = '#000';
ctx.globalAlpha = 0.05;
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalAlpha = 1;

// You can store state in "state"
if (isNaN(state.x)) {
  state.x = canvas.width / 2;
  state.y = canvas.height / 5;
  state.vx = 2;
  state.vy = 0;
}

// The "t" argument gives you the milliseconds since the animation started
var radius = (Math.sin(t / 500) + 1) * 5 + 5;
var hue = (t / 100) % 360;

ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
ctx.beginPath();
ctx.arc(state.x, state.y, radius, 0, 2 * Math.PI, false);
ctx.fill();

state.x += state.vx;
state.y += state.vy;

if (state.x < radius || state.x >= canvas.width - radius) {
  state.vx = -state.vx;
  state.x += state.vx;
}

if (state.y < radius || state.y >= canvas.height - radius) {
  state.vy = -state.vy;
  state.y += state.vy;
}

var gravity = 0.2;

state.vy += gravity;</script>
  </body>
</template>

<script>
import * as _ from 'lodash/lodash.min'
import 'whatwg-fetch';

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
    EditorPane,
    Splitter,
    OutputPane
  },
  data() {
    return {
      isLayoutHorizontal: true,
      layoutChangeCnt: 0,
      run: null,
      rendererSource: null,
      rendererState: {},
      error: null,
      isSignedIn: false,
      profile: null,
      signInPopup: null
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

        if (runId.shortId) {
          return fetch('/api/runs/' + runIdToPath(runId), { credentials: 'same-origin' })
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
        } else {
          return {
            source: this.$el.querySelector('#default').innerHTML
          };
        }
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
    signIn(provider) {
      if (this.signInPopup && !this.signInPopup.closed) {
        this.signInPopup.focus();
        // @todo reload URL
      } else {
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
        this.signInPopup = window.open('/auth/' + provider, 'signIn', featureStr);
      }
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
@headerHeight: 40px;

@panelBg: hsl(70, 3%, 30%);
@panelHeading: hsl(70, 3%, 85%);
@panelContent: hsl(70, 3%, 75%);
@buttonBg: transparent;
@buttonContent: hsl(70, 3%, 75%);
@buttonHoverContent: hsl(7, 3%, 100%);
@buttonHoverAccent1: hsl(15, 100%, 60%);
@buttonHoverAccent2: hsl(45, 100%, 60%);
@buttonHoverAccent3: hsl(70, 100%, 60%);

@logoVPadding: 10px;
@logoHPadding: 50px;
@logoHeight: @headerHeight - @logoVPadding * 2;
@logoAspectRatio: 2036 / 280;

body {
  font-family: 'Varela Round', sans-serif;
  font-size: 100%;
  margin: 0;
  padding: 0;
  background: #000;
}
header {
  display: flex;
  align-items: baseline;
  height: @headerHeight;
  background: @panelBg;
  color: @panelContent;

  h1 {
    display: inline;
    margin: 0;
    padding-left: @logoHPadding;
    padding-right: @headerHeight;
    height: @headerHeight;
    line-height: @headerHeight;
    font-size: 1em;

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

  button {
    margin: 0;
    padding: 0 5px;
    border: none;
    height: @headerHeight;
    line-height: @headerHeight;
    font-size: 0.75em;
    cursor: pointer;
    margin-right: 4px;
    transition: background 100ms;
    background: @buttonBg;
    color: @buttonContent;
    position: relative;
    overflow: hidden;
    font-family: 'Varela Round', sans-serif;
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
      color: @buttonHoverContent;

      &:after {
        bottom: 6px;
      }
    }

    &:active {
      &:after {
        bottom: 8px;
      }
    }

    &:focus {
      outline: none;
    }

    &.-accent-1:after { background: @buttonHoverAccent1; }
    &.-accent-2:after { background: @buttonHoverAccent2; }
    &.-accent-3:after { background: @buttonHoverAccent3; }
  }

  ._profile {
    margin-left: auto;
    margin-right: 10px;

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
      margin-left: 5px;
      font-size: 0.75em;
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
