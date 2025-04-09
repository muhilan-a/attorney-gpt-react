
const API_URL = 'http://localhost:5000/api';
export const translateText = async (text, sourceLang, targetLang) => {
    try {
      if (sourceLang === targetLang) {
        return text;
      }
  
      const response = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, sourceLang, targetLang }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      return text; // Return original text on error
    }
  };