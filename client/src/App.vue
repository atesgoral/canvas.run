<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1><!--
      --><button id="save" class="-accent-1">Save</button><!--
      --><button id="reset-state" class="-accent-2">Reset State</button><!--
      --><button id="toggle-layout" class="-accent-3">Toggle Layout</button>
    </header>
    <main id="main" class="-horizontal-split">
      <editor-pane></editor-pane>
      <splitter></splitter>
      <output-pane></output-pane>
    </main>
  </body>
</template>

<script>
import EditorPane from './components/EditorPane'
import Splitter from './components/Splitter'
import OutputPane from './components/OutputPane'

export default {
  components: {
    EditorPane,
    Splitter,
    OutputPane
  }
}
</script>

<style lang="less">
  @headerHeight: 40px;
  @splitterSize: 13px;

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
  @splitterHandleBg: hsla(70, 3%, 30%, 50%);

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
  }
  #editor-pane {
    flex-basis: 50%;
  }
  #splitter {
    position: relative;
    z-index: 10;
    flex: 0 0 @splitterSize;
    background: @panelBg;
    height: @splitterSize;
    user-select: none;

    #splitter-handle {
      position: absolute;
      height: @splitterSize;
      background: @splitterHandleBg;
      left: 0;
      right: 0;
      cursor: ns-resize;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      flex-direction: row;
      user-select: none;

      &:after {
        content: '';
        position: absolute;
        left: 5px;
        right: 5px;
        height: 3px;
        border-radius: 1.5px;
        background: transparent;
        transition: background 250ms;
      }

      &:hover {
        &:after {
          background: @buttonHoverAccent3;
        }
      }
    }
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

  /* Layout */

  main.-horizontal-split {
    flex-direction: row;

    #splitter {
      height: auto;
      width: @splitterSize;

      #splitter-handle {
        height: auto;
        width: @splitterSize;
        top: 0;
        bottom: 0;
        cursor: ew-resize;
        flex-direction: column;

        &:after {
          left: auto;
          right: auto;
          height: auto;
          top: 5px;
          bottom: 5px;
          width: 3px;
        }
      }
    }
  }
</style>
