
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

To guide your classification, use the following principles and examples.

**Examples of titles that FIT the categories:**

*   **Divine Retribution & Karma:** 窃物雷击 (Thief struck by lightning), 杀生孽报二事 (Two incidents of karmic retribution for killing), 溺女恶报 (Evil retribution for drowning a daughter), 负债变牛 (Turns into an ox for a debt)
*   **Ghosts & Spirits:** 逼奸缢鬼 (Rapist is haunted to death by the victim's ghost), 怨鬼索命 (Vengeful ghost seeks life), 狐女报恩 (Fox spirit repays a kindness), 厕中遇鬼 (Encountering a ghost in the toilet), 记卫某惑骷髅精事 (Record of Mr. Wei being bewitched by a skeleton spirit)
*   **Supernatural Phenomena & Strange Events:** 魂游地府 (Soul travels to the underworld), 天雨粟 (Sky rains millet), 墙上冒血 (Blood seeps from the wall), 兔变猫 (Rabbit transforms into a cat), 幼妇化为男 (Young wife transforms into a man), 僵尸 (Hopping vampire/zombie)
*   **Immortals & Magic:** 记遇仙赠丹事 (Record of encountering an immortal who gifted a pill), 乩仙轶事 (Anecdotes of a planchette spirit), 山神娶妇 (Mountain god marries a woman)

**Examples of titles that DO NOT FIT the categories:**

*   京报 (Beijing Gazette)
*   议建铁路引 (Discussion on building a railway)
*   东洋和约条例 (Japan Treaty Articles)
*   会审公案 (Mixed Court Case)
*   奢俭论 (On Extravagance and Frugality)
*   申报馆续印书目 (Shen Bao Office Continued Book Catalog)
*   记苏城求雨情形 (Record of praying for rain in Suzhou) - *This is only a fit if it describes a miraculous or bizarre outcome.*

Analyze the following list of titles. Return a JSON array containing ONLY the titles that you classify as '志怪' or '异事'. Be inclusive of strange and unusual events, but do not include titles that are purely about common crime, war, politics, social customs, or social commentary unless they have a clear supernatural or bizarre element as illustrated by the examples.
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
