import { useEffect, useRef } from 'react';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import './EditorPane.css';

function EditorPane({ source, onChange }) {
  const editorRef = useRef(null);
  const aceEditorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !aceEditorRef.current) {
      aceEditorRef.current = ace.edit(editorRef.current, {
        mode: 'ace/mode/javascript',
        theme: 'ace/theme/monokai',
        fontSize: 14,
        showPrintMargin: false,
        highlightActiveLine: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: false,
      });

      aceEditorRef.current.session.on('change', () => {
        onChange(aceEditorRef.current.getValue());
      });
    }

    return () => {
      if (aceEditorRef.current) {
        aceEditorRef.current.destroy();
        aceEditorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (aceEditorRef.current && source !== aceEditorRef.current.getValue()) {
      aceEditorRef.current.setValue(source, -1);
    }
  }, [source]);

  return (
    <div className="editor-pane">
      <div ref={editorRef} className="ace-editor"></div>
    </div>
  );
}

export default EditorPane;
