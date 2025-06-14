const express = require('express');
const { spawn } = require('child_process');

const app = express();

app.get('/audio', (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send('Missing url parameter');
  }

  res.setHeader('Content-Type', 'audio/webm');

  const ytdlp = spawn('yt-dlp', [
    '-f', 'bestaudio',
    '-o', '-', 
    videoUrl
  ]);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ytdlp.on('error', (err) => {
    console.error('yt-dlp error:', err);
    res.status(500).end();
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.log(`yt-dlp exited with code ${code}`);
    }
    res.end();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
