import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import Header from './Header';
import EditorPane from './EditorPane';
import OutputPane from './OutputPane';
import './Editor.css';

const DEFAULT_SOURCE = `// Here, you're writing the contents of a function with the following signature:
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

state.vy += gravity;
`;

function Editor() {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const { settings, session } = useStore();

  const [run, setRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [editorSource, setEditorSource] = useState('');
  const [rendererSource, setRendererSource] = useState(null);

  useEffect(() => {
    fetchRun();
  }, [shortId]);

  const fetchRun = async () => {
    const url = shortId ? `/api/runs/${shortId}` : '/api/runs/default';

    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (response.ok) {
        const data = await response.json();
        setRun(data);
        setEditorSource(data.source);
      }
    } catch (error) {
      console.error('Error fetching run:', error);
      setRun({ source: DEFAULT_SOURCE });
      setEditorSource(DEFAULT_SOURCE);
    }
  };

  const handleStart = () => {
    setRendererSource(editorSource);
    setIsRunning(true);
  };

  const handleStop = () => {
    setRendererSource(null);
    setIsRunning(false);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('source', editorSource);

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      if (response.ok) {
        const savedRun = await response.json();
        navigate(`/${savedRun.owner?.profile?.username || ''}/${savedRun.shortId}`);
        setRun(savedRun);
      }
    } catch (error) {
      console.error('Error saving run:', error);
    }
  };

  if (!run) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editor-container">
      <Header
        run={run}
        isRunning={isRunning}
        onStart={handleStart}
        onStop={handleStop}
        onSave={handleSave}
      />
      <main className={settings.isLayoutHorizontal ? 'horizontal-split' : ''}>
        <EditorPane
          source={editorSource}
          onChange={setEditorSource}
        />
        <OutputPane
          source={rendererSource}
          isRunning={isRunning}
        />
      </main>
    </div>
  );
}

export default Editor;
