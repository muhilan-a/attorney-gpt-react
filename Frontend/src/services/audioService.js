// audioService.js - These are not used directly anymore as we've moved the logic into the AudioRecorder component
// This file is kept for compatibility with other parts of the app that might use it

const API_URL = 'http://localhost:5000/api';

export const startRecording = async (setRecordingState, setAudioBlob) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      setAudioBlob(audioBlob);
    });

    mediaRecorder.start();
    setRecordingState({
      isRecording: true,
      mediaRecorder,
      stream
    });

    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

export const stopRecording = (recordingState) => {
  if (recordingState && recordingState.isRecording && recordingState.mediaRecorder) {
    try {
      recordingState.mediaRecorder.stop();
      if (recordingState.stream) {
        recordingState.stream.getTracks().forEach(track => track.stop());
      }
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }
  return false;
};