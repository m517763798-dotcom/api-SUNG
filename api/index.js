export default function handler(req, res) {
  res.status(200).json({
    name: "TikTok Downloader - SUNG-K4",
    version: "2.0.0",
    usage: "GET /api/tiktok?url={TikTok_video_link}",
    developer: "SUNG-K4"
  });
}