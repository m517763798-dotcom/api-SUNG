import express from "express";
import puppeteer from "puppeteer";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

const BASE_URL = "https://ssstik.io/ar-1";

app.get("/", (req, res) => {
  res.json({ message: "Use /tiktok?url={TikTok_video_link}" });
});

app.get("/tiktok", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({
      error: "You must provide ?url=TikTok_video_link",
      example: "/api/tiktok?url=https://www.tiktok.com/@user/video/1234567890",
    });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 60000 });

    // إدخال رابط الفيديو
    await page.type("#main_page_text", videoUrl);

    // الضغط على الزر وإنتظار التحميل
    await Promise.all([
      page.click("#submit"),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ]);

    // استخراج روابط الفيديو
    const links = await page.$$eval("a[href]", (anchors) =>
      anchors
        .map((a) => {
          const href = a.href;
          if (!href.startsWith("http")) return null;
          if (href.includes(".mp4")) return { type: "video", url: href };
          return null;
        })
        .filter(Boolean)
    );

    if (!links.length) {
      return res.status(404).json({ error: "No video link found." });
    }

    const firstVideo = links[0];

    res.json({
      video: firstVideo.url,
      title: "TikTok Video",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch TikTok video.", details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

export const handler = serverless(app);