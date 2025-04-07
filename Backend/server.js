// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure multer for handling audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Store audio files
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// API Endpoints
// 1. LLM endpoint - integrate with Python backend
app.post('/api/llm', async (req, res) => {
  try {
    const { text, mode, language } = req.body;
    
    const pythonProcess = spawn('python', [
      'bridge_scripts/llm_bridge.py',
      '--text', text,
      '--mode', mode,
      '--language', language
    ]);
    
    let responseData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'LLM processing failed' });
      }
      
      try {
        const parsedData = JSON.parse(responseData);
        return res.json(parsedData);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse LLM response' });
      }
    });
  } catch (error) {
    console.error('Error in LLM endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Speech to text endpoint
app.post('/api/speech-to-text', upload.single('audio'), (req, res) => {
  try {
    const audioFile = req.file.path;
    const language = req.body.language || 'en';
    
    const pythonProcess = spawn('python', [
      'bridge_scripts/speech_to_text_bridge.py',
      '--audio', audioFile,
      '--language', language
    ]);
    
    let resultData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
        fs.unlink(audioFile, (err) => {
            if (err) console.error('Error removing temporary file:', err);
          });
          
          if (code !== 0) {
            return res.status(500).json({ error: 'Speech to text processing failed' });
          }
          
          try {
            const parsedData = JSON.parse(resultData);
            return res.json(parsedData);
          } catch (e) {
            return res.status(500).json({ error: 'Failed to parse speech to text response' });
          }
        });
      } catch (error) {
        console.error('Error in speech-to-text endpoint:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // 3. Generate audio endpoint
    app.post('/api/generate-audio', async (req, res) => {
      try {
        const { text, index, language } = req.body;
        const outputDir = path.join(__dirname, 'audio');
        
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }
        
        const outputFile = path.join(outputDir, `response_audio_${index}.mp3`);
        
        const pythonProcess = spawn('python', [
          'bridge_scripts/tts_bridge.py',
          '--text', text,
          '--output', outputFile,
          '--language', language
        ]);
        
        let resultData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          resultData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          console.error(`Python Error: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            return res.status(500).json({ error: 'Text to speech processing failed' });
          }
          
          const audioUrl = `/audio/response_audio_${index}.mp3`;
          return res.json({ audioUrl });
        });
      } catch (error) {
        console.error('Error in generate-audio endpoint:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // 4. Translation endpoint
    app.post('/api/translate', async (req, res) => {
      try {
        const { text, sourceLang, targetLang } = req.body;
        
        if (sourceLang === targetLang) {
          return res.json({ translatedText: text });
        }
        
        const pythonProcess = spawn('python', [
          'bridge_scripts/translate_bridge.py',
          '--text', text,
          '--source', sourceLang,
          '--target', targetLang
        ]);
        
        let resultData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          resultData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          console.error(`Python Error: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            return res.status(500).json({ error: 'Translation failed' });
          }
          
          try {
            const parsedData = JSON.parse(resultData);
            return res.json(parsedData);
          } catch (e) {
            return res.status(500).json({ error: 'Failed to parse translation response' });
          }
        });
      } catch (error) {
        console.error('Error in translate endpoint:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });      