
import { GoogleGenAI, Type } from "@google/genai";
import type { Article } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING,
  },
};

const systemInstruction = `You are an expert historical researcher specializing in the Chinese newspaper 'Shen Bao' (申报) from the late Qing dynasty. Your task is to identify article titles that belong to the '志怪' (records of anomalies, supernatural tales) or '异事' (strange, unusual events) genres. These genres often involve themes of karma (报应), ghosts (鬼), spirits (狐, 精), demons, divine retribution (天谴, 雷击), strange phenomena, and moral tales with a supernatural element.

Here are some examples of titles that FIT these categories:
- 完人夫妇得善报 (Virtuous couple receives good karma)
- 窃物雷击 (Thief struck by lightning)
- 狐女报恩 (Fox spirit repays a kindness)
- 逼奸缢鬼 (Rapist is haunted to death by the victim's ghost)
- 怨鬼索命 (Vengeful ghost seeks life)
- 猴精 (Monkey spirit)
- 梦游地狱记 (A record of dreaming and traveling to hell)

Here are some examples of titles that DO NOT FIT these categories:
- 京报 (Beijing Gazette)
- 议建铁路引 (Discussion on building a railway)
- 东洋和约条例 (Japan Treaty Articles)
- 会审公案 (Mixed Court Case)
- 奢俭论 (On Extravagance and Frugality)
- 申报馆续印书目 (Shen Bao Office Continued Book Catalog)

Analyze the following list of titles. Return a JSON array containing ONLY the titles that you classify as '志怪' or '异事'. Do not include any titles that are purely about crime, war, politics, or social commentary unless they have a clear supernatural or bizarre element.
`;

export const filterSupernaturalArticles = async (
  articles: Article[]
): Promise<string[]> => {
  const titles = articles.map((a) => a.title);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: `Please analyze the following titles:\n${JSON.stringify(titles)}` }],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
      return result;
    } else {
      console.error("Gemini response is not a valid JSON array of strings:", result);
      return [];
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze articles with Gemini API.");
  }
};
