import { Link } from 'react-router-dom';
import './Header.css';

function Header({ run, isRunning, onStart, onStop, onSave }) {
  return (
    <header>
      <h1>
        <Link to="/">CanvasRun</Link>
      </h1>
      <div className="toolbar">
        <button
          className={`tool ${isRunning ? 'accent-1' : 'accent-3'}`}
          onClick={isRunning ? onStop : onStart}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        {!run?.shortId && (
          <button className="tool accent-3" onClick={onSave}>
            Save
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
