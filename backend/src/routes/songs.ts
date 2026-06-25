import { Router } from "express";
import { env } from "../env.js";

export const songsRouter = Router();

const JAMENDO_BASE = "https://api.jamendo.com/v3.0";

// GET /songs/search?q=query&limit=10
songsRouter.get("/search", async (req, res) => {
  const q = req.query.q as string;
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  if (!q) { res.status(400).json({ error: "q is required" }); return; }

  try {
    const url = new URL(`${JAMENDO_BASE}/tracks/`);
    url.searchParams.set("client_id", env.JAMENDO_CLIENT_ID);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("search", q);
    url.searchParams.set("include", "musicinfo");
    url.searchParams.set("audioformat", "mp32");
    url.searchParams.set("imagesize", "200");

    const response = await fetch(url.toString());
    const data = await response.json() as {
      results: Array<{
        id: string;
        name: string;
        artist_name: string;
        image: string;
        audio: string;
        shareurl: string;
        duration: number;
      }>;
    };

    const tracks = (data.results || []).map((t) => ({
      jamendoId: t.id,
      name: t.name,
      artist: t.artist_name,
      albumImage: t.image,
      audioUrl: t.audio,
      shareUrl: t.shareurl,
      duration: t.duration,
    }));

    res.json(tracks);
  } catch (err) {
    console.error("Jamendo search error:", err);
    res.status(502).json({ error: "Failed to search Jamendo" });
  }
});
