import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Library from './components/Library';
import Reader from './components/Reader';

function App() {
  return (
    <Router basename="/library">
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/read/:id" element={<Reader />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
