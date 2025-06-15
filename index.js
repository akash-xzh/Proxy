const express = require('express');
const axios = require('axios');
const slugify = require('slugify');

const app = express();
app.use(express.json());

const downloadMap = {};

function generateShortId(length = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// YouTube MP3 conversion
app.get('/api/ytdl', async (req, res) => {
  const { url, quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await axios.post('https://api.dlsrv.online/api/convert', {
      url,
      quality: quality || '320'
    }, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'origin': 'https://y2meta.mobi',
        'referer': 'https://y2meta.mobi/',
        'user-agent': 'Mozilla/5.0'
      }
    });

    const actualDownloadUrl = response.data?.url;
    const title = response.data?.title || 'download';

    if (!actualDownloadUrl) {
      return res.status(500).json({ error: 'Invalid response from convert API' });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const shortId = generateShortId();

    downloadMap[shortId] = {
      url: actualDownloadUrl,
      type: 'mp3',
      title
    };

    const maskedUrl = `https://proxydl.onrender.com/download/${slug}-${shortId}.mp3`;
    res.json({ title, download: maskedUrl });
  } catch (err) {
    res.status(500).json({ error: 'Conversion failed', detail: err.message });
  }
});

// Video download API
app.get('/api/videodl', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await axios.get(`https://www.smfahim.xyz/alldl?url=${encodeURIComponent(url)}`);
    const data = response.data;

    const videoUrl = data?.links?.hd || data?.links?.sd;
    const title = data?.title || 'video';

    if (!videoUrl) {
      return res.status(500).json({ error: 'Video URL not found in API response' });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const shortId = generateShortId();

    downloadMap[shortId] = {
      url: videoUrl,
      type: 'mp4',
      title
    };

    const maskedUrl = `https://proxydl.onrender.com/video/${slug}-${shortId}.mp4`;
    res.json({ title, download: maskedUrl });
  } catch (err) {
    res.status(500).json({ error: 'Video fetch failed', detail: err.message });
  }
});

// MP3 download route
app.get('/download/:id', async (req, res) => {
  const { id } = req.params;
  const shortId = id.split('-').pop().replace('.mp3', '');

  const entry = downloadMap[shortId];

  if (!entry || entry.type !== 'mp3') {
    return res.status(404).json({ error: 'Invalid download ID' });
  }

  try {
    const response = await axios.get(entry.url, { responseType: 'stream' });
    res.setHeader('Content-Disposition', `attachment; filename="${entry.title}.mp3"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', detail: err.message });
  }
});

// MP4 stream route
app.get('/video/:id', async (req, res) => {
  const { id } = req.params;
  const shortId = id.split('-').pop().replace('.mp4', '');

  const entry = downloadMap[shortId];

  if (!entry || entry.type !== 'mp4') {
    return res.status(404).json({ error: 'Invalid video ID' });
  }

  try {
    const response = await axios.get(entry.url, { responseType: 'stream' });
    res.setHeader('Content-Disposition', `inline; filename="${entry.title}.mp4"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Video stream failed', detail: err.message });
  }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Proxy server running at ${PORT}`);
});
