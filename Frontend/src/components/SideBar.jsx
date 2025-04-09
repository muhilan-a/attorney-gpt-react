import React, { useContext } from 'react';
import ModeSelector from './ModeSelector';
import { AppContext } from '../contexts/AppContext';

const SideBar = () => {
  const { currentMode } = useContext(AppContext);
  
  const modeInstructions = {
    'AttorneyGPT': "Ask any legal question related to Indian law.",
    'Draft Generation': "Request assistance with legal document drafting.",
    'Legal Research': "Submit detailed legal research queries.",
    'Virtual Courts': "Present your case as an attorney for feedback."
  };
  
  return (
    <div className="sidebar">
      <h1>AttorneyGPT Modes</h1>
      <ModeSelector />
      
      <div className="mode-instructions">
        <h3>Instructions</h3>
        <p>{modeInstructions[currentMode]}</p>
      </div>
    </div>
  );
};

export default SideBar;