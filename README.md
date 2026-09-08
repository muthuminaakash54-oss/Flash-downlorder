# StreamForge — Full version

This ZIP contains the polished frontend plus a Node.js backend that calls `yt-dlp` for URLs you are authorized to process.

## Easiest deployment: Render
1. Create a GitHub repository and upload all files in this folder.
2. On Render choose **New → Web Service** and connect the repository.
3. Build command:
   `pip install -U yt-dlp && npm install`
4. Start command:
   `node server.js`
5. Deploy.
6. Open the Render URL. The Home page's Download button calls `/api/download`.

## Important
- This is a server-side media processor. It cannot guarantee every URL will work; sites change, some media is private/geo-restricted, and some hosts block automated/cloud requests.
- Use it only for content you own or have permission to download, and follow applicable platform terms and law.
- MP3 conversion uses the bundled `ffmpeg-static` package.
