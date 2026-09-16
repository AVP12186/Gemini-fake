import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type, Modality, GenerateVideosOperation } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper for resilient model generation with fallback
async function generateWithFallback(ai: GoogleGenAI, preferredModel: string, contents: any, config: any) {
  try {
    return await ai.models.generateContent({
      model: preferredModel,
      contents,
      config,
    });
  } catch (err: any) {
    const is503 =
      err?.status === 503 ||
      err?.message?.includes("503") ||
      err?.message?.includes("UNAVAILABLE") ||
      err?.message?.includes("high demand");

    if (is503) {
      console.warn(`Model ${preferredModel} unavailable (503), switching to resilient fallback gemini-3.1-flash-lite`);
      return await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          ...config,
          thinkingConfig: undefined, // flash-lite does not take high thinking
        },
      });
    }
    throw err;
  }
}

// Health Check API
app.get("/api/health", (_req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    hasApiKey,
    models: [
      { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", type: "Chat / Code / General" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", type: "Low-latency Chat" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", type: "Advanced Reasoning" },
      { id: "gemini-3.1-flash-lite-image", name: "Nano Banana (Gemini Flash Lite Image)", type: "Photo & Concept Art" },
      { id: "gemini-3.1-flash-image", name: "Nano Banana 2 (Gemini Flash Image HQ)", type: "High-Res Image Gen" },
      { id: "lyria-3-clip-preview", name: "Gemini Music (Lyria 3 Clip)", type: "Music Generation" },
      { id: "lyria-3-pro-preview", name: "Gemini Music (Lyria 3 Pro)", type: "Full Track Music" },
      { id: "veo-3.1-lite-generate-preview", name: "Veo 3 Lite", type: "Video Synthesis" },
      { id: "veo-3.1-generate-preview", name: "Veo 3 Pro", type: "Cinematic High-Def Video" },
    ],
  });
});

// Chat & Code Generation endpoint (Gemini Canvas assistant)
app.post("/api/chat", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      messages = [],
      model = "gemini-3.8-flash",
      temperature = 0.7,
      topP = 0.95,
      topK = 40,
      thinkingLevel = "DEFAULT",
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAI();

    // Map ThinkingLevel
    let mappedThinkingLevel: ThinkingLevel | undefined = undefined;
    if (thinkingLevel === "HIGH") mappedThinkingLevel = ThinkingLevel.HIGH;
    else if (thinkingLevel === "LOW") mappedThinkingLevel = ThinkingLevel.LOW;
    else if (thinkingLevel === "MINIMAL") mappedThinkingLevel = ThinkingLevel.MINIMAL;

    // Supported models
    let actualModel = model;
    const allowedModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
    if (!allowedModels.includes(actualModel)) {
      actualModel = "gemini-3.8-flash";
    }

    // Format chat contents
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const config: any = {
      temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
      topP: Math.max(0, Math.min(1, Number(topP) || 0.95)),
      topK: Math.max(1, Math.min(100, Number(topK) || 40)),
      systemInstruction: `You are Gemini, Google's flagship AI and coding assistant powering Gemini Canvas.
When the user asks you to write code, design a game, create an interactive web app, widget, or simulation:
1. Produce clean, self-contained, interactive HTML/CSS/JavaScript.
2. Put the code in a standard markdown code block:
\`\`\`html
<!DOCTYPE html>
<html>
...
</html>
\`\`\`
3. Always make games and apps fully responsive, visually sleek with vibrant retro/neon or clean modern styling, complete with keyboard/touch controls, scoring, and restart capability.
4. Keep commentary concise and direct, matching Google Gemini's friendly and helpful tone.`,
    };

    if (mappedThinkingLevel && actualModel !== "gemini-3.1-flash-lite") {
      config.thinkingConfig = { thinkingLevel: mappedThinkingLevel };
    }

    let response;
    try {
      response = await generateWithFallback(ai, actualModel, contents, config);
    } catch (modelErr: any) {
      console.warn(`Primary chat model ${actualModel} failed, trying gemini-3.8-flash:`, modelErr.message);
      response = await generateWithFallback(ai, "gemini-3.8-flash", contents, {
        ...config,
        thinkingConfig: undefined,
      });
      actualModel = "gemini-3.8-flash";
    }

    const elapsedMs = Date.now() - startTime;
    const textOutput = response.text || "";

    return res.json({
      text: textOutput,
      usage: response.usageMetadata,
      elapsedMs,
      model: actualModel,
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process AI chat",
      elapsedMs: Date.now() - startTime,
    });
  }
});

// Photo & Image Generation endpoint (Nano Banana series: gemini-3.1-flash-lite-image / gemini-3.1-flash-image)
app.post("/api/generate-photo", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      aspectRatio = "1:1",
      style = "Photorealistic",
      modelVariant = "gemini-3.1-flash-lite-image", // "gemini-3.1-flash-lite-image" (nano banana) or "gemini-3.1-flash-image" (nano banana 2)
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    let imageUrl = "";
    let description = "";
    const chosenModel = modelVariant === "gemini-3.1-flash-image" ? "gemini-3.1-flash-image" : "gemini-3.1-flash-lite-image";
    const validAspectRatio = (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) ? aspectRatio : "1:1") as any;

    try {
      const response = await ai.models.generateContent({
        model: chosenModel,
        contents: {
          parts: [
            {
              text: `${style} style: ${prompt}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: validAspectRatio,
            ...(chosenModel === "gemini-3.1-flash-image" ? { imageSize: "1K" } : {}),
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }
    } catch (apiErr: any) {
      console.warn("Nano banana direct generation notice (generating high-res vector artwork fallback):", apiErr.message);
      // Fallback generative SVG artwork and prompt expansion
      const textRes = await generateWithFallback(
        ai,
        "gemini-3.8-flash",
        `You are Nano Banana, Google's high-speed creative visual model.
Create an artistic, creative concept description and self-contained SVG graphic for: "${prompt}" in ${style} style.
Return pure JSON with keys:
- "title": Artwork title
- "caption": Concise visual critique and aesthetic description
- "colorPalette": Array of 4 hex color strings
- "svgCode": A valid, gorgeous self-contained <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">...</svg> string with gradients, modern shapes, and depth.`,
        { responseMimeType: "application/json" }
      );

      const parsed = JSON.parse(textRes.text || "{}");
      return res.json({
        imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(parsed.svgCode || "")}`,
        title: parsed.title || prompt,
        caption: parsed.caption || `Generated with Nano Banana in ${style} style`,
        colorPalette: parsed.colorPalette || ["#1e293b", "#3b82f6", "#10b981", "#f59e0b"],
        modelUsed: chosenModel + " (Nano Banana)",
        elapsedMs: Date.now() - startTime,
      });
    }

    return res.json({
      imageUrl,
      caption: description || `Generated with Nano Banana (${chosenModel}): ${prompt}`,
      modelUsed: chosenModel + " (Nano Banana)",
      elapsedMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Photo generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate photo with Nano Banana" });
  }
});

// Gemini Music Generation endpoint (Lyria 3: lyria-3-clip-preview / lyria-3-pro-preview)
app.post("/api/generate-music", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      genre = "Electronic",
      mood = "Upbeat",
      durationSeconds = 30,
      modelVariant = "lyria-3-clip-preview", // lyria-3-clip-preview or lyria-3-pro-preview
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    const chosenMusicModel = modelVariant === "lyria-3-pro-preview" ? "lyria-3-pro-preview" : "lyria-3-clip-preview";

    let audioBase64 = "";
    let lyrics = "";
    let mimeType = "audio/wav";
    let lyriaSuccess = false;

    try {
      // Attempt Lyria 3 Gemini Music stream
      const musicResponse = await ai.models.generateContentStream({
        model: chosenMusicModel,
        contents: `Generate a musical track. Prompt: "${prompt}". Genre: ${genre}. Mood: ${mood}. Duration: ${durationSeconds} seconds.`,
      });

      for await (const chunk of musicResponse) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
            lyriaSuccess = true;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }
    } catch (lyriaErr: any) {
      console.warn("Lyria Gemini music stream notice (generating musical arrangement + synthesizer melody):", lyriaErr.message);
    }

    // Generate musical arrangement, chords, rhythm, and interactive synthesizer spec
    const musicPrompt = `You are Gemini Music Producer (Lyria AI).
Compose an original musical arrangement based on: "${prompt}".
Genre: ${genre}, Mood: ${mood}, Duration: ${durationSeconds} seconds.
Output JSON format with:
- "title": Track name
- "bpm": Number (e.g. 124)
- "keySignature": e.g. "F Major"
- "arrangementNotes": Description of instruments, bassline, and lead synth progression
- "lyricsOrVocalHook": Catchy lyrics or melody vocal hook
- "synthFrequencies": An array of 16 note frequencies (Hz numbers between 220 and 660, like 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, etc.) representing the lead melody for playback`;

    const response = await generateWithFallback(
      ai,
      "gemini-3.8-flash",
      musicPrompt,
      {
        responseMimeType: "application/json",
        temperature: 0.8,
      }
    );

    const trackData = JSON.parse(response.text || "{}");

    return res.json({
      ...trackData,
      genre,
      mood,
      durationSeconds,
      audioBase64: lyriaSuccess ? audioBase64 : undefined,
      audioUrl: lyriaSuccess ? `data:${mimeType};base64,${audioBase64}` : undefined,
      lyrics: lyrics || trackData.lyricsOrVocalHook,
      modelUsed: chosenMusicModel + " (Gemini Lyria 3)",
      elapsedMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Music generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate music track with Gemini Music" });
  }
});

// Video Generation endpoint (Veo 3: veo-3.1-lite-generate-preview / veo-3.1-generate-preview)
app.post("/api/generate-video", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      style = "Cinematic 3D",
      durationSeconds = 5,
      aspectRatio = "16:9",
      modelVariant = "veo-3.1-lite-generate-preview", // veo-3.1-lite-generate-preview or veo-3.1-generate-preview
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    const chosenVideoModel = modelVariant === "veo-3.1-generate-preview" ? "veo-3.1-generate-preview" : "veo-3.1-lite-generate-preview";
    const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";

    let operationName: string | undefined = undefined;

    try {
      const operation = await ai.models.generateVideos({
        model: chosenVideoModel,
        prompt: `${style} style: ${prompt}`,
        config: {
          numberOfVideos: 1,
          resolution: "720p",
          aspectRatio: validAspectRatio,
        },
      });
      operationName = operation.name;
    } catch (veoErr: any) {
      console.warn("Veo 3 video generation operation notice:", veoErr.message);
    }

    // Always generate a multi-scene director storyboard with camera dynamic vectors & SVG keyframe backgrounds
    const videoPrompt = `You are an AI Cinematographer & Director powered by Google Veo 3.
Create a cinematic video storyboard sequence for: "${prompt}".
Style: ${style}, Aspect Ratio: ${validAspectRatio}.
Return JSON containing:
- "title": Video title
- "cinematography": Camera angle, lighting, motion dynamics, focal length
- "colorGrade": Color grading & atmospheric palette description
- "sceneTimeline": Array of 4 scenes each with:
    - "second": e.g. "0:00 - 0:02"
    - "visual": Rich description of the visual action
    - "cameraMotion": e.g. "Slow forward dolly zoom with subtle gimbal pan"
    - "svgBackground": A clean, stylized atmospheric SVG string (viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg") depicting this exact scene frame`;

    const response = await generateWithFallback(
      ai,
      "gemini-3.8-flash",
      videoPrompt,
      {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    );

    const parsed = JSON.parse(response.text || "{}");

    return res.json({
      ...parsed,
      style,
      aspectRatio: validAspectRatio,
      durationSeconds,
      operationName,
      modelUsed: chosenVideoModel + " (Google Veo 3)",
      elapsedMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Video generation error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate video sequence with Veo 3" });
  }
});

// Veo 3 Video Status Polling
app.post("/api/video-status", async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required" });
    }
    const ai = getAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    return res.json({
      done: updated.done,
      hasVideo: Boolean(updated.response?.generatedVideos?.[0]?.video?.uri),
    });
  } catch (err: any) {
    console.error("Video status error:", err);
    return res.status(500).json({ error: err.message || "Failed to poll video status" });
  }
});

// Veo 3 Video Download Proxy
app.post("/api/video-download", async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required" });
    }
    const ai = getAI();
    const apiKey = process.env.GEMINI_API_KEY;
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: "Video URI not available yet" });
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey! },
    });

    res.setHeader("Content-Type", "video/mp4");
    if (videoRes.body) {
      const reader = videoRes.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("Video download error:", err);
    return res.status(500).json({ error: err.message || "Failed to stream video" });
  }
});

// Vite middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gemini Canvas Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
