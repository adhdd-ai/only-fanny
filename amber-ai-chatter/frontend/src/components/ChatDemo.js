import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function ChatDemo() {
  const [messages, setMessages] = useState([
    { sender: 'system', text: 'Welcome! You are chatting with Amber (AI). All 22 training modules are active.' },
    { sender: 'amber', text: 'hey glad you found your way here... whats your name? 😊' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'fan', text: userMsg }]);
    setTyping(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        fanId: 'test_user',
        message: userMsg,
        threadId: 1
      });

      // Simulate typing delay
      await new Promise(r => setTimeout(r, 3000));

      setMessages(prev => [...prev, { 
        sender: 'amber', 
        text: response.data.response 
      }]);

    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'system', 
        text: 'Error: ' + err.message 
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with Amber</h2>
        <span className="status">● Online</span>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {typing && <div className="message amber typing">Amber is typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatDemo;
