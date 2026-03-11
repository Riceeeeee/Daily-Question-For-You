const http = require("http");
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "love-daily-app");

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.join(baseDir, urlPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Không tìm thấy nội dung.");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", getContentType(filePath));
    fs.createReadStream(filePath).pipe(res);
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});

