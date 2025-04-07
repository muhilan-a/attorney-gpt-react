import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import AudioRecorder from './AudioRecorder';
import { fetchLlmResponse, generateAudio } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Chat = () => {
  const { 
    messages, 
    setMessages,
    currentMode,
    audioResponses,
    setAudioResponses,
    selectedLanguage,
    LANGUAGE_CONFIG,
    currentQuestion,
    setCurrentQuestion,
    isLoading,
    setIsLoading,
    resetConversation
  } = useContext(AppContext);
  
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef(null);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || inputMessage === currentQuestion) return;
    
    await processUserMessage(inputMessage);
    setInputMessage('');
  };
  
  const handleVoiceInput = async (text) => {
    if (!text || text === currentQuestion) return;
    
    await processUserMessage(text);
  };
  
  const processUserMessage = async (text) => {
    setCurrentQuestion(text);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    
    try {
      // Get LLM response
      const response = await fetchLlmResponse(
        text, 
        currentMode, 
        LANGUAGE_CONFIG[selectedLanguage].code
      );
      
      if (response.text) {
        // Stream response (simulated)
        const fullResponse = "⚠️ **_Note: Information provided may be inaccurate._** \n\n\n" + response.text;
        
        // Add assistant message to chat
        setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
        
        // Generate audio for response
        if (response.text) {
          const audioUrl = await generateAudio(
            response.text, 
            messages.filter(m => m.role === 'assistant').length, 
            selectedLanguage
          );
          
          if (audioUrl) {
            setAudioResponses(prev => [...prev, audioUrl]);
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I encountered an error processing your request. Please try again." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderMessage = (message, index) => {
    const messageClass = `chat-message ${message.role}`;
    
    // Calculate assistant index for audio playback
    const isAssistant = message.role === 'assistant';
    const assistantIndex = isAssistant 
      ? messages.filter((m, i) => m.role === 'assistant' && i <= index).length - 1
      : -1;
    
    return (
      <div key={index} className={messageClass}>
        <div className="message-content">
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        
        {isAssistant && assistantIndex < audioResponses.length && (
          <div className="message-audio">
            <audio controls src={audioResponses[assistantIndex]}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="chat-message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef}></div>
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask your legal question..."
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          
          <AudioRecorder onTextCaptured={handleVoiceInput} />
        </form>
        
        {messages.length > 0 && (
          <button onClick={resetConversation} className="reset-button">
            Reset All Chat 🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;