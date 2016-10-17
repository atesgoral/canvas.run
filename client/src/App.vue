<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1><!--
    --><button id="save" class="-accent-1" v-on:click="save">Save</button><!--
    --><button id="reset-state" class="-accent-2" v-on:click="resetState">Reset State</button><!--
    --><button id="toggle-layout" class="-accent-3" v-on:click="toggleLayout">Toggle Layout</button><!--
    --><button id="sign-in" class="-accent-1" v-on:click="signIn" v-if="!isSignedIn">Sign in</button><!--
    --><button id="sign-out" class="-accent-1" v-on:click="signOut" v-if="isSignedIn">Sign out</button>
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
        v-bind:renderer="renderer"
        v-bind:rendererState="rendererState"
        v-bind:error="error"
        v-on:runtimeError="handleRuntimeError"></output-pane>
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
      renderer: null,
      rendererState: {},
      error: null,
      isSignedIn: false
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
      switch (event.data) {
      case 'SIGNED_IN':
        this.isSignedIn = true;
        break;
      case 'SIGNED_OUT':
        this.isSignedIn = false;
        break;
      }
    });

    Promise.resolve()
      .then(() => {
        const runId = pathToRunId(window.location.pathname.slice(1));

        if (runId.shortId) {
          return fetch('/api/runs/' + runIdToPath(runId))
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

      fetch('/api/runs', { method: 'POST', body: formData })
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
      setTimeout(() => {
        this.layoutChangeCnt++;
      }, 1);
    },
    toggleLayout() {
      this.isLayoutHorizontal = !this.isLayoutHorizontal
      this.resetState();
      this.notifyLayoutChange();
    },
    signIn() {
      window.open('/auth/facebook', 'auth', 'width=500,height=600,menubar=no,toolbar=no,location=no,personalbar=no');
    },
    signOut() {
      window.open('/auth/signOut', 'signOut', 'width=500,height=600,menubar=no,toolbar=no,location=no,personalbar=no');
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
      try {
        this.run.source = source;
        this.renderer = new Function('canvas', 'state', 't', source);
        this.error = null;
      } catch (err) {
        this.renderer = null;

        if (err) {
          this.error = 'Compilation error';
        }
      }
    },
    handleEditorSyntaxError() {
      console.log('syntax error');
      this.renderer = null;
      this.error = 'Syntax error';
    },
    handleRuntimeError() {
      this.error = 'Runtime error';
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

body {
  font-family: 'Varela Round', sans-serif;
  font-size: 100%;
  margin: 0;
  padding: 0;
  background: #000;
}
header {
  height: @headerHeight;
  background: @panelBg;
  color: @panelContent;

  h1 {
    display: inline;
    margin: 0;
    padding-left: 15px;
    padding-right: @headerHeight;
    height: @headerHeight;
    line-height: @headerHeight;
    font-size: 1em;
    color: @panelHeading;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: hsl(0, 0%, 100%);
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
