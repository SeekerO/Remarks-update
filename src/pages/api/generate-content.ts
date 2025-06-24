// pages/api/generate-content.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY as string);

interface GenerateContentRequestBody {
  prompt: string;
  history?: { role: string; parts: { text: string }[] }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { prompt, history } = req.body as GenerateContentRequestBody;

  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ message: "Prompt is required and must be a string." });
  }

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GENAI_API_KEY is not set.");
    return res
      .status(500)
      .json({ message: "API key not configured on the server." });
  }

  try {
    // ✅ Clean and validate history
    const safeHistory = (history || []).filter(
      (item) =>
        typeof item.role === "string" &&
        Array.isArray(item.parts) &&
        item.parts.length > 0 &&
        item.parts.every(
          (p) => typeof p.text === "string" && p.text.trim() !== ""
        )
    );

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const chat = model.startChat({
      history: safeHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.9,
        topP: 0.95,
        topK: 60,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ generatedContent: text });
  } catch (error: any) {
    console.error("Server Error:", error);
    return res.status(500).json({
      message: "Server error while generating content.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
