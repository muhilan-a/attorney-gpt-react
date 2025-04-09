import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

const ModeSelector = () => {
  const { currentMode, handleModeChange } = useContext(AppContext);
  
  const modes = [
    'AttorneyGPT', 
    'Draft Generation', 
    'Legal Research', 
    'Virtual Courts'
  ];
  
  return (
    <div className="mode-selector">
      <label htmlFor="mode-select">Select Mode:</label>
      <select 
        id="mode-select"
        value={currentMode}
        onChange={(e) => handleModeChange(e.target.value)}
      >
        {modes.map(mode => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModeSelector;