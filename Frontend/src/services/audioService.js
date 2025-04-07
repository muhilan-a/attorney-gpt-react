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
    if (recordingState.isRecording) {
      recordingState.mediaRecorder.stop();
      recordingState.stream.getTracks().forEach(track => track.stop());
      return true;
    }
    return false;
  };