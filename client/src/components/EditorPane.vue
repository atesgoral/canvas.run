<template>
  <div class="editor-pane"></div>
</template>

<script>
import 'ace-builds/src-min-noconflict/ace'
import 'ace-builds/src-min-noconflict/mode-javascript'
import 'ace-builds/src-min-noconflict/theme-monokai'

export default {
  props: {
    source: String
  },
  watch: {
    source: function (source) {
      this.editor.setValue(source, -1);
    }
  },
  mounted() {
    ace.config.set('workerPath', '/static');

    const editor = ace.edit(this.$el)

    this.editor = editor;

    editor.$blockScrolling = Infinity
    editor.setShowPrintMargin(false)
    editor.setTheme('ace/theme/monokai')
    editor.setFontSize(14)

    const session = editor.getSession()

    session.setMode('ace/mode/javascript')
    session.setUseSoftTabs(true)
    session.setTabSize(2)

    const emitSyntaxError = () => {
      this.$emit('syntaxError');
    };

    const emitSourceUpdate = (source) => {
      this.$emit('sourceUpdate', source);
    };

    let hasSyntaxError = false;

    session.on('changeAnnotation', () => {
      const isErrorFound = session.getAnnotations().some(annotation => {
        return annotation.type === 'error';
      });

      if (isErrorFound) {
        if (!hasSyntaxError) {
          hasSyntaxError = true;
          emitSyntaxError();
        }
      } else {
        if (hasSyntaxError) {
          hasSyntaxError = false;
          emitSourceUpdate(editor.getValue());
        }
      }
    });

    function handleChange(event) {
      if (!hasSyntaxError) {
        emitSourceUpdate(editor.getValue());
      }
    }

    function handleBlur() {
      // @todo: stop existing change debounce
      emitSourceUpdate(editor.getValue());
    }

    editor.on('input', handleChange);
    editor.on('blur', handleBlur);

    editor.focus();
  }
}
</script>

<style lang="less">
@import './common/colors';

.ace_keyword { color: @accent1Color !important; }
.ace_storage { color: @accent5Color !important; }
.ace_string { color: @accent2Color !important; }
.ace_numeric { color: @accent4Color !important; }
.ace_language { color: @accent3Color !important; }

.editor-pane {
  flex-basis: 50%;

  @gutterIndicatorSize: 9px;

  .gutterIndicator(@color) {
    background: none;
    position: relative;

    &:before {
      content: '';
      position: absolute;
      left: 2px;
      top: 50%;
      margin-top: -@gutterIndicatorSize / 2;
      display: inline-block;
      width: @gutterIndicatorSize;
      height: @gutterIndicatorSize;
      border-radius: @gutterIndicatorSize / 2;
      background: @color;
    }
  }

  .ace_gutter-cell.ace_info { .gutterIndicator(@panelContentColor); opacity: .75; }
  .ace_gutter-cell.ace_warning { .gutterIndicator(@accent2Color); }
  .ace_gutter-cell.ace_error { .gutterIndicator(@accent1Color); }
}
</style>
