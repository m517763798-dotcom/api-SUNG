const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "Please provide ?url=" });

  try {
    const BASE_URL = "https://snaptik.app/ar2";

    // GET البداية (بعض المواقع تحتاج الGET قبل الPOST)
    await axios.get(BASE_URL, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 });

    // إعداد POST
    const formData = new URLSearchParams();
    formData.append("id", videoUrl);
    formData.append("locale", "ar");
    formData.append("tt", "");

    const { data: html } = await axios.post(BASE_URL, formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Origin: "https://snaptik.app",
        Referer: BASE_URL,
      },
      timeout: 20000,
    });

    // سجل HTML للبحث لو احتجت (يساعد في الديباغ)
    console.log("HTML length:", html.length);

    // استخراج الروابط مع فلترة أفضل
    const $ = cheerio.load(html);
    const links = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (!href.startsWith("http")) return;

      // فلترة روابط واضحة للفيديو/الصوت
      if (href.includes(".mp4") || href.includes("/download?url=") || href.includes("/video/")) {
        links.push(href);
      }
    });

    // حاول استخراج أول رابط mp4 إن وُجد
    const firstMp4 = links.find(u => u.includes(".mp4")) || links[0];

    if (!firstMp4) {
      console.log("No mp4 in HTML. sample anchors count:", $("a").length);
      return res.status(404).json({ error: "No download links found" });
    }

    // إرجاع JSON بسيط للبوت
    return res.json({
      success: true,
      source: videoUrl,
      video: firstMp4,
      links
    });

  } catch (err) {
    console.error("API error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Internal server error", details: err.message || String(err) });
  }
};