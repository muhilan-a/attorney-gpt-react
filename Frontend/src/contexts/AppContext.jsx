import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [currentMode, setCurrentMode] = useState('AttorneyGPT');
  const [audioResponses, setAudioResponses] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [processingVoice, setProcessingVoice] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Language configuration
  const LANGUAGE_CONFIG = {
    'English': { code: 'en', gtts_code: 'en', name: 'English' },
    'Tamil': { code: 'ta', gtts_code: 'ta', name: 'Tamil' },
    'Hindi': { code: 'hi', gtts_code: 'hi', name: 'Hindi' }
  };

  const resetConversation = () => {
    setMessages([]);
    setAudioResponses([]);
    setCurrentQuestion(null);
  };

  const handleModeChange = (newMode) => {
    if (newMode !== currentMode) {
      setCurrentMode(newMode);
      setMessages([]);
      setAudioResponses([]);
    }
  };

  const value = {
    messages,
    setMessages,
    currentMode,
    setCurrentMode,
    audioResponses,
    setAudioResponses,
    selectedLanguage,
    setSelectedLanguage,
    processingVoice,
    setProcessingVoice,
    currentQuestion,
    setCurrentQuestion,
    isLoading,
    setIsLoading,
    LANGUAGE_CONFIG,
    resetConversation,
    handleModeChange
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// src/services/api.js
const API_URL = 'http://localhost:5000/api';

export const fetchLlmResponse = async (text, mode, language) => {
  try {
    const response = await fetch(`${API_URL}/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, mode, language }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching LLM response:', error);
    throw error;
  }
};

export const generateAudio = async (text, index, language) => {
  try {
    const response = await fetch(`${API_URL}/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, index, language }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data.audioUrl;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
};

export const convertSpeechToText = async (audioBlob, language) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', language);

    const response = await fetch(`${API_URL}/speech-to-text`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error converting speech to text:', error);
    throw error;
  }
};