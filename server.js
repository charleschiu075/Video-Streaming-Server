const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// 靜態路由
app.use(express.static('public'));
app.use('/streamed', express.static(path.join(__dirname, 'streamed')));

// 上傳儲存位置
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('video'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');

  const inputPath = path.resolve(file.path); // 加保險
  const outputDir = path.join(__dirname, 'streamed', file.filename);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'output.m3u8');
  
  // 關鍵：加入雙引號以防空白路徑
  const command = `ffmpeg -i "${inputPath}" -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('轉檔錯誤:', err);
      console.error('stderr:', stderr);
      return res.status(500).json({ error: '轉檔失敗' });
    }

    res.send({ message: '上傳成功', streamPath: `/streamed/${file.filename}/output.m3u8` });
  });
});

app.listen(port, () => {
  console.log(`伺服器運行中：http://localhost:${port}`);
});
