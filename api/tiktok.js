import puppeteer from "puppeteer";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ خطأ: "يُسمح فقط بطريقة GET" });
  }

  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({
      خطأ: "يجب إرسال وسيط ?url=رابط_تيك_توك",
      مثال: "/api/tiktok?url=https://www.tiktok.com/@user/video/1234567890",
    });
  }

  try {
    const result = await fetchTikTokLinks(videoUrl);
    if (!result.عدد_الروابط) {
      return res.status(404).json({ خطأ: "لم يتم العثور على روابط تحميل." });
    }

    const اول_فيديو = result.الروابط.find((l) => l.نوع === "فيديو");
    const اول_صوت = result.الروابط.find((l) => l.نوع === "صوت");

    res.status(200).json({
      نجاح: true,
      المصدر: result.المصدر,
      فيديو: اول_فيديو ? اول_فيديو.الرابط : null,
      صوت: اول_صوت ? اول_صوت.الرابط : null,
      جميع_الروابط: result.الروابط,
    });
  } catch (err) {
    res.status(500).json({
      خطأ: "حدث خطأ أثناء استخراج الروابط.",
      التفاصيل: err.message,
    });
  }
}

async function fetchTikTokLinks(videoUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://ssstik.io", { waitUntil: "networkidle2", timeout: 60000 });

  await page.type("#main_page_text", videoUrl);
  await Promise.all([
    page.click("#submit"),
    page.waitForNavigation({ waitUntil: "networkidle2" }),
  ]);

  const links = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => {
        const href = a.href;
        const text = a.innerText.trim().toLowerCase();
        if (!href.startsWith("http")) return null;
        let نوع = "غير معروف";
        if (href.includes(".mp4")) نوع = "فيديو";
        if (href.includes(".mp3")) نوع = "صوت";
        return { نوع, الرابط: href, وصف: text || "تحميل" };
      })
      .filter(Boolean)
  );

  await browser.close();

  return { المصدر: videoUrl, عدد_الروابط: links.length, الروابط: links };
    }
