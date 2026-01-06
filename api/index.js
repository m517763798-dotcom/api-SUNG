module.exports = (req, res) => {
  res.json({
    name: "TikTok Downloader - SUNG-K4",
    version: "2.0.0",
    usage: "GET /api/tiktok?url={TikTok_video_link}",
    developer: "SUNG-K4"
  });
};