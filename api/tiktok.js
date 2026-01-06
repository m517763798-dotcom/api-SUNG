const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "Please provide a TikTok video URL using ?url=" });

  try {
    const BASE_URL = "https://snaptik.app/ar2";

    // GET الصفحة الرئيسية
    await axios.get(BASE_URL, { headers: { "User-Agent": "Mozilla/5.0" } });

    // إعداد بيانات POST
    const formData = new URLSearchParams();
    formData.append("id", videoUrl);
    formData.append("locale", "ar");
    formData.append("tt", "");

    // POST للحصول على HTML
    const { data: html } = await axios.post(BASE_URL, formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Origin: "https://snaptik.app",
        Referer: BASE_URL,
      },
      timeout: 15000,
    });

    // استخراج روابط التحميل
    const $ = cheerio.load(html);
    const links = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (!href.startsWith("http")) return;
      let type = "unknown";
      if (href.includes(".mp4")) type = "video";
      if (href.includes(".mp3")) type = "audio";
      links.push({ type, url: href });
    });

    if (links.length === 0) return res.json({ error: "No download links found" });

    res.json({ videoUrl, links });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};