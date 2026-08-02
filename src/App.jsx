import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react'; // 1. Added useEffect
import { LoginSignup } from './login/login.jsx';
import { LibraryArr } from './library/library.jsx';

function App() {
  useEffect(() => {
    const handleKeyDown = (e) => {(Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault(); 
        alert('Printing is disabled on this website.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/library" element={<LibraryArr />} />
      </Routes>
    </Router>
  );
}

export default App;
