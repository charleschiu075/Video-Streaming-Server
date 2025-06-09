const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/streamed', express.static(path.join(__dirname, 'streamed')));

// 建立上傳資料夾
const upload = multer({ dest: 'uploads/' });

// 上傳影片並觸發轉檔
app.post('/upload', upload.single('video'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');

  const inputPath = file.path;
  const outputDir = path.join(__dirname, 'streamed', file.filename);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'output.m3u8');

  const command = `ffmpeg -i ${inputPath} -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls ${outputPath}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('轉檔錯誤:', err);
      return res.status(500).send('轉檔失敗');
    }
    res.send({ message: '上傳成功', streamPath: `/streamed/${file.filename}/output.m3u8` });
  });
});

app.listen(port, () => {
  console.log(`伺服器運行中：http://localhost:${port}`);
});
