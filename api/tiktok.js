import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

const BASE_URL = "https://ssstik.io/ar-1";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// API endpoint
app.get("/", (req, res) => {
  res.status(200).json({ message: "Use /tiktok?url={TikTok_link}" });
});

app.get("/tiktok", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({
      error: "You must provide ?url=TikTok_video_link",
      example: "/api/tiktok?url=https://www.tiktok.com/@user/video/1234567890",
    });
  }

  try {
    const links = await fetchTikTokLinks(videoUrl);
    if (!links.length) {
      return res.status(404).json({ error: "No download links found." });
    }

    // نأخذ أول رابط فيديو
    const firstVideo = links.find((l) => l.type === "video");

    if (!firstVideo) {
      return res.status(404).json({ error: "No video link found." });
    }

    res.json({
      video: firstVideo.url,          // رابط mp4 مباشر للبوت
      title: "TikTok Video"           // عنوان افتراضي للبوت
    });
  } catch (err) {
    res.status(500).json({
      error: "Error fetching download links",
      details: err.message,
    });
  }
});

// دالة استخراج الروابط من ssstik.io/ar-1
async function fetchTikTokLinks(videoUrl) {
  // GET لجلب الصفحة أولاً
  await axios.get(BASE_URL, { headers: { "User-Agent": USER_AGENT } });

  const formData = new URLSearchParams();
  formData.append("id", videoUrl);
  formData.append("locale", "ar");
  formData.append("tt", "");

  const { data: html } = await axios.post(BASE_URL, formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
      Origin: BASE_URL,
      Referer: BASE_URL,
    },
  });

  const $ = cheerio.load(html);
  const links = [];

  $("a").each((i, el) => {
    const href = $(el).attr("href") || "";
    if (!href.startsWith("http")) return;

    let type = "unknown";
    if (href.includes(".mp4")) type = "video";
    if (href.includes(".mp3")) type = "audio";

    if (!links.find((l) => l.url === href)) {
      links.push({ type, url: href });
    }
  });

  return links;
}

// تصدير التطبيق كـ Serverless Function
export const handler = serverless(app);