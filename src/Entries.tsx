// Entries.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import EntryPage from './EntryPage.tsx';
import './App.css';

export default function Entries() {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="app">
      <Sidebar />
      <div className="main-container">
        <EntryPage />
      </div>
    </div>
  );
}
