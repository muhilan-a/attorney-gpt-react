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
      body: JSON.stringify({ 
        text, 
        index, 
        language 
      }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
};

export const convertSpeechToText = async (audioBlob, language) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
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