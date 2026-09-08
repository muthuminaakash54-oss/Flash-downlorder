const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || "";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const downloads = path.join(os.tmpdir(), "streamforge-downloads");
fs.mkdirSync(downloads, { recursive: true });

function validUrl(value) {
  try {
    const u = new URL(value);
    return /youtube\.com|youtu\.be|facebook\.com|fb\.watch|tiktok\.com/i.test(u.hostname);
  } catch { return false; }
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile("yt-dlp", args, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout.trim());
    });
  });
}

app.post("/api/download", async (req, res) => {
  const { url, format = "mp4" } = req.body || {};
  if (!validUrl(url)) return res.status(400).json({ message: "Please enter a valid supported URL." });
  if (!["mp4", "mp3"].includes(format)) return res.status(400).json({ message: "Unsupported format." });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const output = path.join(downloads, `${id}.%(ext)s`);
  const common = ["--no-playlist", "--no-warnings", "--restrict-filenames"];

  try {
    let args;
    if (format === "mp3") {
      args = [...common, "--ffmpeg-location", ffmpegPath, "-x", "--audio-format", "mp3", "-o", output, url];
    } else {
      args = [...common, "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best", "--merge-output-format", "mp4", "--ffmpeg-location", ffmpegPath, "-o", output, url];
    }

    await runYtDlp(args);

    const candidates = fs.readdirSync(downloads).filter(n => n.startsWith(id + "."));
    if (!candidates.length) throw new Error("No output file was created.");
    const filename = candidates[0];

    res.json({
      downloadUrl: `${PUBLIC_URL || ""}/api/file/${encodeURIComponent(filename)}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "The media could not be processed. The URL may be unavailable, private, blocked, or unsupported by the processing service."
    });
  }
});

app.get("/api/file/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const file = path.join(downloads, filename);
  if (!fs.existsSync(file)) return res.status(404).send("File expired or not found.");
  res.download(file, filename, () => {
    setTimeout(() => fs.rm(file, { force: true }, () => {}), 10000);
  });
});

app.listen(PORT, () => console.log(`StreamForge running on port ${PORT}`));
