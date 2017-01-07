<template>
  <div class="editor-pane"></div>
</template>

<script>
import 'ace-builds/src-min-noconflict/ace'
import 'ace-builds/src-min-noconflict/mode-javascript'
import 'ace-builds/src-min-noconflict/theme-monokai'
import * as _ from 'lodash/lodash.min'

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
      emitSourceUpdate(editor.getValue());
    }

    editor.on('change', _.debounce(handleChange, 250));
    editor.on('blur', handleBlur);
  }
}
</script>

<style lang="less">
.editor-pane {
  flex-basis: 50%;
}
</style>
