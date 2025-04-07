import React, { useContext } from 'react';
import { AppProvider, AppContext } from './contexts/AppContext';
import SideBar from './components/SideBar';
import LanguageSelector from './components/LanguageSelector';
import Chat from './components/Chat';
import './styles/App.css';

const AppContent = () => {
  const { currentMode } = useContext(AppContext);
  
  const modeImages = {
    'AttorneyGPT': '/images/AttorneyGPTcover.png',
    'Draft Generation': '/images/LegalDraftcover.png',
    'Legal Research': '/images/LegalResearchcover.png',
    'Virtual Courts': '/images/VirtualCourtcover.png'
  };
  
  return (
    <div className="app">
      <SideBar />
      
      <div className="main-content">
        <div className="header">
          <img 
            src={modeImages[currentMode]} 
            alt={`${currentMode} header`}
            className="mode-header-image"
          />
        </div>
        
        <LanguageSelector />
        <Chat />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;