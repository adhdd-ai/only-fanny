import React from 'react';
import ChatDemo from './components/ChatDemo';
import './styles.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>💬 Amber AI</h1>
        <p>Complete AI Chatter System (22 Training Modules)</p>
      </header>
      <main>
        <ChatDemo />
      </main>
    </div>
  );
}

export default App;
