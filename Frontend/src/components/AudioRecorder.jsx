import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { startRecording, stopRecording } from '../services/audioService';
import { convertSpeechToText } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';

const AudioRecorder = ({ onTextCaptured }) => {
  const { 
    selectedLanguage, 
    LANGUAGE_CONFIG, 
    processingVoice, 
    setProcessingVoice 
  } = useContext(AppContext);
  
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    mediaRecorder: null,
    stream: null
  });
  const [recordingStatus, setRecordingStatus] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(5);

  const handleRecord = async () => {
    if (processingVoice) return;
    
    setProcessingVoice(true);
    setRecordingStatus('Getting ready to record...');
    
    try {
      await startRecording(setRecordingState, setAudioBlob);
      
      // Start countdown
      setSecondsLeft(5);
      const countdownInterval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setRecordingStatus(`Recording... ${secondsLeft} seconds remaining`);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingStatus('Error starting recording.');
      setProcessingVoice(false);
    }
  };

  const handleStopRecording = async () => {
    if (stopRecording(recordingState)) {
      setRecordingStatus('Converting speech to text...');
      
      setTimeout(async () => {
        if (audioBlob) {
          try {
            const text = await convertSpeechToText(
              audioBlob, 
              LANGUAGE_CONFIG[selectedLanguage].code
            );
            
            if (text && text.trim()) {
              onTextCaptured(text);
            } else {
              setRecordingStatus('Could not recognize speech. Please try again.');
            }
          } catch (error) {
            console.error('Speech to text conversion failed:', error);
            setRecordingStatus('Error converting speech to text.');
          }
        }
        
        setRecordingStatus('');
        setProcessingVoice(false);
      }, 1000);
    }
  };

  return (
    <div className="audio-recorder">
      <button 
        onClick={handleRecord}
        disabled={processingVoice}
        className="record-button"
        title={`Record voice in ${selectedLanguage}`}
      >
        <FontAwesomeIcon icon={faMicrophone} />
      </button>
      
      {recordingStatus && (
        <div className="recording-status">
          {recordingStatus}
          {recordingState.isRecording && (
            <span> ({secondsLeft}s)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
