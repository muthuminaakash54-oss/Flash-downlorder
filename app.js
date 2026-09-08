/*
 StreamForge frontend.
 Set API_ENDPOINT to your own authorized backend endpoint.
 Expected POST JSON: { "url": "...", "format": "mp4"|"mp3" }
 Expected response JSON:
   { "downloadUrl": "https://..." }
*/
const API_ENDPOINT = "/api/download";

const input = document.getElementById("urlInput");
const downloadBtn = document.getElementById("downloadBtn");
const statusBox = document.getElementById("status");
const clearBtn = document.getElementById("clearBtn");
let format = "mp4";

document.querySelectorAll(".format").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".format").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    format = btn.dataset.format;
  });
});

clearBtn?.addEventListener("click", () => {
  input.value = "";
  setStatus("");
  input.focus();
});

function setStatus(text, type = "") {
  if (!statusBox) return;
  statusBox.className = "status " + type;
  statusBox.textContent = text;
}

function supportedUrl(value) {
  try {
    const u = new URL(value);
    return /youtube\.com|youtu\.be|facebook\.com|fb\.watch|tiktok\.com/i.test(u.hostname);
  } catch { return false; }
}

downloadBtn?.addEventListener("click", async () => {
  const url = input.value.trim();
  if (!url) return setStatus("Paste a video link first.", "error");
  if (!supportedUrl(url)) return setStatus("Please enter a valid YouTube, Facebook or TikTok URL.", "error");

  if (!API_ENDPOINT) {
    setStatus("This website needs to be opened from the deployed server to process downloads.", "info");
    return;
  }

  downloadBtn.disabled = true;
  setStatus("Processing your request…", "info");
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({url, format})
    });
    const data = await response.json();
    if (!response.ok || !data.downloadUrl) throw new Error(data.message || "The server could not create a download.");
    setStatus("Ready — opening your download.", "ok");
    window.location.href = data.downloadUrl;
  } catch (err) {
    setStatus(err.message || "Something went wrong.", "error");
  } finally {
    downloadBtn.disabled = false;
  }
});
