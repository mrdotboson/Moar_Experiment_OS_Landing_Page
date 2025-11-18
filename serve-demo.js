const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const FILE_PATH = path.join(__dirname, 'visual-condition-list-demo.html');

const server = http.createServer((req, res) => {
  // Serve the HTML file
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(FILE_PATH, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Visual Condition List Demo running at:`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log('Press Ctrl+C to stop the server\n');
});

