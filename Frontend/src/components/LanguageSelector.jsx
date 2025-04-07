import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

const LanguageSelector = () => {
  const { selectedLanguage, setSelectedLanguage } = useContext(AppContext);
  
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };
  
  return (
    <div className="language-container">
      <button 
        className={`language-button ${selectedLanguage === 'English' ? 'selected' : ''}`}
        onClick={() => handleLanguageChange('English')}
      >
        English
      </button>
      
      <button 
        className={`language-button ${selectedLanguage === 'Tamil' ? 'selected' : ''}`}
        onClick={() => handleLanguageChange('Tamil')}
      >
        தமிழ்
      </button>
      
      <button 
        className={`language-button ${selectedLanguage === 'Hindi' ? 'selected' : ''}`}
        onClick={() => handleLanguageChange('Hindi')}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageSelector;