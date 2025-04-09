import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import AudioRecorder from './AudioRecorder';
import { fetchLlmResponse, generateAudio } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faVolumeHigh, faCommentDots } from '@fortawesome/free-solid-svg-icons';

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
    
    if (!inputMessage.trim() || inputMessage === currentQuestion || isLoading) return;
    
    await processUserMessage(inputMessage);
    setInputMessage('');
  };
  
  const handleVoiceInput = async (text) => {
    if (!text || text === currentQuestion || isLoading) return;
    
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
        // Add disclaimer prefix to response
        const fullResponse = "⚠️ **_Note: Information provided may be inaccurate._** \n\n\n" + response.text;
        
        // Add assistant message to chat
        setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
        
        // Generate audio for response
        if (response.text) {
          try {
            // Calculate the proper index for this audio
            const responseIndex = messages.filter(m => m.role === 'assistant').length;
            
            const result = await generateAudio(
              response.text, 
              responseIndex, 
              LANGUAGE_CONFIG[selectedLanguage].code
            );
            
            if (result && result.audioUrl) {
              // Make sure to use the full URL with http://localhost:5000 prefix
              const fullAudioUrl = `http://localhost:5000${result.audioUrl}`;
              setAudioResponses(prev => [...prev, fullAudioUrl]);
            }
          } catch (audioError) {
            console.error('Error generating audio:', audioError);
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
  
  // Helper function to convert Markdown-style syntax to HTML-like formatting
  const formatText = (text) => {
    // Convert **text** to <strong>text</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert _text_ to <em>text</em>
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    return formatted;
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
        <div className="message-avatar">
          {message.role === 'user' ? 
            <FontAwesomeIcon icon={faCommentDots} /> : 
            <img 
              src="/images/attorney-avatar.png" 
              alt="Attorney Avatar" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default-avatar.png';
              }}
            />
          }
        </div>
        <div className="message-bubble">
          <div className="message-content">
            {message.content.split('\n').map((line, i) => {
              // Use dangerouslySetInnerHTML only for simple formatting (bold, italic)
              return (
                <React.Fragment key={i}>
                  <span dangerouslySetInnerHTML={{ __html: formatText(line) }} />
                  {i < message.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </div>
          
          {isAssistant && assistantIndex >= 0 && assistantIndex < audioResponses.length && (
            <div className="message-audio">
              <audio 
                controls 
                src={audioResponses[assistantIndex]}
                onError={(e) => console.error("Audio error:", e)}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat-message">
            <div className="empty-chat-icon">
              <FontAwesomeIcon icon={faCommentDots} size="3x" />
            </div>
            <h3>Welcome to {currentMode}</h3>
            <p>Ask a question to get started. You can type or use voice input.</p>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="chat-message assistant loading">
            <div className="message-avatar">
              <img 
                src="/images/attorney-avatar.png" 
                alt="Attorney Avatar" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default-avatar.png';
                }}
              />
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
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
            placeholder={`Ask your legal question in ${selectedLanguage}...`}
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
            title="Send message"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          
          <AudioRecorder onTextCaptured={handleVoiceInput} />
        </form>
        
        {messages.length > 0 && (
          <button onClick={resetConversation} className="reset-button">
            <FontAwesomeIcon icon={faTrash} />
            <span style={{ marginLeft: '8px' }}>Reset Conversation</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;