import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
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
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(5);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const countdownIntervalRef = useRef(null);

  const handleRecord = async () => {
    if (processingVoice || isRecording) return;
    
    setProcessingVoice(true);
    setRecordingStatus('Getting ready to record...');
    
    try {
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handling
      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunksRef.current.push(event.data);
      });
      
      // Set up stop handler
      mediaRecorder.addEventListener('stop', handleRecordingStopped);
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start countdown
      setSecondsLeft(7);
      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setRecordingStatus('Recording...');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingStatus('Error: Permission denied or microphone unavailable');
      cleanupRecording();
    }
  };
  
  const stopRecording = () => {
    // Clear countdown timer
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Stop media recorder if it exists and is recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingStatus('Processing audio...');
    } else {
      cleanupRecording();
    }
  };
  
  const handleRecordingStopped = async () => {
    try {
      // Process recorded audio
      if (audioChunksRef.current.length > 0) {
        setRecordingStatus('Converting speech to text...');
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Convert speech to text
        const text = await convertSpeechToText(
          audioBlob, 
          LANGUAGE_CONFIG[selectedLanguage].code
        );
        
        if (text && text.trim()) {
          onTextCaptured(text);
          setRecordingStatus('');
        } else {
          setRecordingStatus('Could not recognize speech. Please try again.');
          setTimeout(() => setRecordingStatus(''), 3000);
        }
      }
    } catch (error) {
      console.error('Speech to text conversion failed:', error);
      setRecordingStatus('Error converting speech to text.');
      setTimeout(() => setRecordingStatus(''), 3000);
    } finally {
      // Clean up
      cleanupRecording();
    }
  };
  
  const cleanupRecording = () => {
    // Stop and release media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset state
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setProcessingVoice(false);
  };

  return (
    <div className="audio-recorder">
      <button 
        onClick={handleRecord}
        disabled={processingVoice}
        className={`record-button ${isRecording ? 'recording' : ''}`}
        title={`Record voice in ${selectedLanguage}`}
      >
        <FontAwesomeIcon icon={faMicrophone} />
      </button>
      
      {recordingStatus && (
        <div className="recording-status">
          {recordingStatus}
          {isRecording && secondsLeft > 0 && (
            <span> ({secondsLeft}s)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;