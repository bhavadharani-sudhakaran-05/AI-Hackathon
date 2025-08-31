import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Replace with your Instagram Access Token & User ID
const ACCESS_TOKEN = "YOUR_INSTAGRAM_ACCESS_TOKEN";
const INSTAGRAM_USER_ID = "YOUR_INSTAGRAM_USER_ID";

app.post("/analyze", async (req, res) => {
  try {
    const postsResp = await fetch(
      `https://graph.facebook.com/v19.0/${INSTAGRAM_USER_ID}/media?fields=id,caption,like_count,comments_count&access_token=${ACCESS_TOKEN}`
    );
    const postsData = await postsResp.json();

    let engagement = { likes: 0, comments: 0, shares: 0 };
    let sentiments = { positive: 0, neutral: 0, negative: 0 };

    postsData.data.forEach((post) => {
      engagement.likes += post.like_count || 0;
      engagement.comments += post.comments_count || 0;

      const caption = (post.caption || "").toLowerCase();
      if (caption.includes("love") || caption.includes("great"))
        sentiments.positive++;
      else if (caption.includes("bad") || caption.includes("hate"))
        sentiments.negative++;
      else sentiments.neutral++;
    });

    // Normalize sentiment percentages
    const total = sentiments.positive + sentiments.neutral + sentiments.negative;
    const sentimentPercent = {
      positive: ((sentiments.positive / total) * 100).toFixed(1),
      neutral: ((sentiments.neutral / total) * 100).toFixed(1),
      negative: ((sentiments.negative / total) * 100).toFixed(1),
    };

    res.json({
      platform: "Instagram",
      sentiment: sentimentPercent,
      engagement,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Instagram data" });
  }
});

app.listen(5000, () =>
  console.log("✅ Backend running on http://127.0.0.1:5000")
);
