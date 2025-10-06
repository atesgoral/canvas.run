import { useEffect, useRef, useState } from 'react';
import './OutputPane.css';

function OutputPane({ source, isRunning }) {
  const canvasRef = useRef(null);
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!source || !isRunning) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const state = {};
    let animationId;
    let startTime = Date.now();

    try {
      // Create the render function from source
      const renderFn = new Function('canvas', 'state', 't', source);

      const animate = () => {
        try {
          const t = Date.now() - startTime;
          renderFn(canvas, state, t);
          animationId = requestAnimationFrame(animate);
        } catch (err) {
          console.error('Runtime error:', err);
          setError('Runtime error');
          cancelAnimationFrame(animationId);
        }
      };

      setError(null);
      animate();
    } catch (err) {
      console.error('Compilation error:', err);
      setError('Compilation error');
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [source, isRunning]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="output-pane">
      <canvas ref={canvasRef} className="output-canvas"></canvas>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default OutputPane;
