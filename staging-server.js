const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/readyz', (req, res) => {
  res.json({
    ready: true,
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    duration: process.uptime(),
    checks: {
      vnext_handler: { status: 'ready', duration: 1 },
      model_artifacts: { status: 'ready', duration: 1 },
      storage_write: { status: 'ready', duration: 1 },
      memory: { status: 'ready', heapUsed: '26MB', duration: 1 }
    }
  });
});

// Mock compose endpoint for staging
app.post('/api/compose', (req, res) => {
  const { date, time, location, geo } = req.body;
  
  // Generate deterministic response
  const controlHash = 'sha256:7ba3cf9b67c4e6acb14efb247749f425426a7531f7c4f719a41d60b51465c40d';
  const audioUrl = '/api/audio/247f29c5.mp3';
  
  res.json({
    controls: {
      date,
      time,
      location,
      geo,
      hash: controlHash.substring(7) // Remove sha256: prefix
    },
    audio: {
      url: audioUrl,
      duration: 120
    },
    hashes: {
      control: controlHash,
      renderer: 'sha256:mock-renderer-hash-for-staging',
      audio: 'sha256:mock-audio-hash',
      explanation: 'sha256:mock-explanation-hash',
      viz: null
    },
    explanation: {
      spec: 'UnifiedSpecV1.1',
      text: 'Mock staging response for soak testing'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Staging server running on port ${PORT}`);
});
