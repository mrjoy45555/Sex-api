// filename: xnxxApi.js

const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = "joyapi"; // চাইলে কাস্টমাইজ করো

app.use(cors());

app.get("/xnxx/search", async (req, res) => {
  const { q, key } = req.query;
  if (!q) return res.status(400).json({ error: "Missing search query" });
  if (key !== API_KEY) return res.status(403).json({ error: "Invalid API key" });

  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(`https://www.xnxx.com/search/${encodeURIComponent(q)}`);

    const results = await page.evaluate(() => {
      const items = [];
      const nodes = document.querySelectorAll(".thumb-block");

      nodes.forEach(node => {
        const title = node.querySelector("a").title;
        const url = node.querySelector("a").href;
        const time = node.querySelector(".duration")?.innerText || "N/A";
        const views = node.querySelector(".metadata span")?.innerText || "N/A";
        const thumb = node.querySelector("img")?.src || "";

        items.push({ title, url, time, views, thumb });
      });

      return items.slice(0, 10);
    });

    await browser.close();
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: "Search failed", message: err.message });
  }
});

app.get("/xnxx/download", async (req, res) => {
  const { video_link, key } = req.query;
  if (!video_link) return res.status(400).json({ error: "Missing video link" });
  if (key !== API_KEY) return res.status(403).json({ error: "Invalid API key" });

  try {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(video_link);

    const data = await page.evaluate(() => {
      const title = document.querySelector("h1")?.innerText || "Unknown";
      const video = document.querySelector("video")?.src;
      return { title, video };
    });

    await browser.close();

    if (!data.video) return res.status(404).json({ error: "No video found" });

    res.json({ title: data.title, video: data.video });
  } catch (err) {
    res.status(500).json({ error: "Download failed", message: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ XNXX Private API running.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
