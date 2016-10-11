<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1><!--
      --><button id="save" class="-accent-1" v-on:click="save">Save</button><!--
      --><button id="reset-state" class="-accent-2" v-on:click="resetState">Reset State</button><!--
      --><button id="toggle-layout" class="-accent-3" v-on:click="toggleLayout">Toggle Layout</button>
    </header>
    <main id="main" v-bind:class="{ '-horizontal-split': isLayoutHorizontal }">
      <editor-pane ref="editorPane"></editor-pane>
      <splitter v-bind:is-horizontal="isLayoutHorizontal" v-on:drag="resizeEditor"></splitter>
      <output-pane></output-pane>
    </main>
  </body>
</template>

<script>
import EditorPane from './components/EditorPane'
import Splitter from './components/Splitter'
import OutputPane from './components/OutputPane'

function resizeCanvas() {
  // debug('resizeCanvas');
  //
  // var bounds = canvas.parentNode.getBoundingClientRect();
  //
  // debug('bounds', bounds.width, bounds.height);
  //
  // canvas.width = bounds.width;
  // canvas.height = bounds.height;
}

function resetState() {
  // rendererState = {};
  // rendererEpoch = null;
}

function handleResize() {
  //debug('handleResize');

  resetState();
  setTimeout(resizeCanvas, 1);
}

export default {
  components: {
    EditorPane,
    Splitter,
    OutputPane
  },
  data() {
    return {
      isLayoutHorizontal: true
    }
  },
  methods: {
    save() {

    },
    resetState() {

    },
    toggleLayout() {
      this.isLayoutHorizontal = !this.isLayoutHorizontal
      handleResize();
    },
    resizeEditor(offset) {
      const mainEl = this.$el.querySelector('main');
      const editorPaneEl = this.$refs.editorPane.$el;
      const mainBounds = mainEl.getBoundingClientRect();
      const editorBounds = editorPaneEl.getBoundingClientRect();

      if (this.isLayoutHorizontal) {
        editorPaneEl.style.flexBasis = (editorBounds.width + offset) / mainBounds.width * 100 + '%';
      } else {
        editorPaneEl.style.flexBasis = (editorBounds.height + offset) / mainBounds.height * 100 + '%';
      }

      handleResize();
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

@errorMaskBg: hsla(70, 3%, 30%, 50%);

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
#editor-pane {
  flex-basis: 50%;
}
#output-pane {
  padding: 1px;
  box-sizing: border-box;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;

  #canvas-wrapper {
    flex: 1;

    canvas {
      position: absolute;
      background: #000;
    }
  }
}
#error {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 0;
  background: @errorMaskBg;
  color: @panelContent;
  padding: 1em;
  z-index: 2;
  display: none;
  overflow: auto;

  &:after {
    position: absolute;
    left: 50%;
    margin-left: -20em;
    top: 50%;
    margin-top: -20em;
    text-align: center;
    width: 40em;
    height: 40em;
    font-size: 40em;
    line-height: 40em;
    content: '\26a0';
    color: red;
    opacity: .25;
    transform: rotate(10deg);
  }
  &.-visible {
    display: block;
  }
}
</style>
