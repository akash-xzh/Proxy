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

app.get('/api/ytdl', async (req, res) => {
  const { url, quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  };

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
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
      }
    });

    const actualDownloadUrl = response.data?.url;
    const title = response.data?.title || 'download';

    if (!actualDownloadUrl) {
      return res.status(500).json({ error: 'Invalid response from convert API' });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const shortId = generateShortId();
    const downloadId = `${slug}-${shortId}`;
    downloadMap[downloadId] = actualDownloadUrl;

    const maskedUrl = `${req.hostname}` +'/download/'+`${downloadId}.mp3`;
    res.json({ title: title, download: maskedUrl });
  } catch (err) {
    res.status(500).json({ error: 'Conversion failed', detail: err.message });
  }
});

app.get('/download/:id', async (req, res) => {
  const id = req.params.id;
  const realUrl = downloadMap[id];

  if (!realUrl) {
    return res.status(404).json({ error: 'Invalid download ID' });
  }

  try {
    const response = await axios.get(realUrl, {
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', 'attachment; filename="download.mp3"');
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', detail: err.message });
  }
});

const PORT = 2000;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://140.238.246.35:${PORT}`);
});
