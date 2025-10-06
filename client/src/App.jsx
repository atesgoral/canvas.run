import { Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/:username/:shortId" element={<Editor />} />
    </Routes>
  );
}

export default App;
