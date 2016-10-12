<template>
  <div class="editor-pane"></div>
</template>

<script>
import 'ace-builds/src-min-noconflict/ace'
import 'ace-builds/src-min-noconflict/mode-javascript'
import 'ace-builds/src-min-noconflict/theme-monokai'

export default {
  data() {
    return {
      msg: 'Hello Vue!'
    }
  },
  mounted() {
    const editor = ace.edit(this.$el)

    editor.$blockScrolling = Infinity
    editor.setShowPrintMargin(false)
    editor.setTheme('ace/theme/monokai')
    editor.setFontSize(14)

    const session = editor.getSession()

    session.setMode('ace/mode/javascript')

    session.on('changeAnnotation', () => {
      var isErrorFound = session.getAnnotations().some(annotation => {
        return annotation.type === 'error';
      });

      // if (isErrorFound) {
      //   if (!hasSyntaxError) {
      //     hasSyntaxError = true;
      //     renderer = null;
      //     renderError('Syntax errors found');
      //   }
      // } else {
      //   if (hasSyntaxError) {
      //     hasSyntaxError = false;
      //     compileRenderer();
      //   }
      // }
    });
  }
}
</script>

<style lang="less">
.editor-pane {
  flex-basis: 50%;
}
</style>
