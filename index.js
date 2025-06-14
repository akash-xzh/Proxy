const express = require('express');
const axios = require('axios');

const app = express();

app.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing url query parameter');
  }

  try {
    const response = await axios({
  method: 'get',
  url,
  responseType: 'stream',
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://www.youtube.com/',
  }
});


    res.setHeader('content-type', response.headers['content-type'] || 'application/octet-stream');
    response.data.pipe(res);
    response.data.on('error', () => res.end());
  } catch (error) {
    res.status(400).send('Failed to fetch URL');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
