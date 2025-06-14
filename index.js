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
