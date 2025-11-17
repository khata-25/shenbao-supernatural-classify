
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

You will be provided with a list of titles to analyze. Base your judgment on the following extensive list of verified examples that FIT the '志怪' or '异事' categories:

- 窃物雷击 (Thief struck by lightning)
- 雷击不孝 (Unfilial person struck by lightning)
- 杀生孽报二事 (Two incidents of karmic retribution for killing)
- 逼奸缢鬼 (Rapist is haunted to death by the victim's ghost)
- 狐女报恩 (Fox spirit repays a kindness)
- 猪仔鬼迷 (Piglet possessed by a ghost)
- 负债变牛 (Turns into an ox for a debt)
- 魂游地府 (Soul travels to the underworld)
- 怨鬼索命 (Vengeful ghost seeks life)
- 猴精 (Monkey spirit)
- 梦游地狱记 (A record of dreaming and traveling to hell)
- 天雨粟 (Sky rains millet)
- 墙上冒血 (Blood seeps from the wall)
- 谈狐 (Talking about foxes/fox spirits)
- 厕中遇鬼 (Encountering a ghost in the toilet)
- 山神娶妇 (Mountain god marries a woman)
- 记遇仙赠丹事 (Record of encountering an immortal who gifted a pill)
- 乩仙轶事 (Anecdotes of a planchette spirit)
- 兔变猫 (Rabbit transforms into a cat)
- 幼妇化为男 (Young wife transforms into a man)
- 水鬼奇谈 (Strange tales of water ghosts)
- 溺女恶报 (Evil retribution for drowning a daughter)
- 木中字画 (Characters and paintings inside wood)
- 僵尸 (Hopping vampire/zombie)
- 还阳训子 (Returning from the dead to teach a son a lesson)
- 记朱烈妇显灵事 (Record of the ghost of the chaste woman Zhu appearing)
- 鬼讨房饭钱 (Ghost demands money for room and board)
- 记卫某惑骷髅精事 (Record of Mr. Wei being bewitched by a skeleton spirit)
- 罗刹国奇闻 (Strange tales from the Rakshasa country)
- 捉鼠孽报 (Karmic retribution for catching mice)
- 牛报仇 (Ox takes revenge)
- 雷击负施忘恩显报 (Lightning strikes an ungrateful person as clear retribution)
- 媚神获祸 (Disaster from charming a deity)
- 逆子被谴 (Unfilial son is condemned)
- 梦稽功过 (Dreaming of one's merits and demerits being audited)
- 川沙异事 (Strange event in Chuansha)
- 屍身风挟舟 (Corpse carried by wind alongside a boat)
- 蛇祟 (Snake demon/curse)
- 牧奴遇怪 (Shepherd boy encounters a monster)
- 科声孽报 (Karmic retribution related to imperial examinations)
- 货郎遇魅 (Peddler encounters a demon)
- 舟中异梦记 (Record of a strange dream on a boat)
- 鬼神戒讼 (Ghosts and gods warn against lawsuits)
- 水鬼奇谈 (Strange tales of water ghosts)
- 元宵为扶鸾戏 (Playing with a planchette on the Lantern Festival)
- 归元寺僧圆寂志异 (Strange record of a monk's passing at Guiyuan Temple)
- 溺死奇闻 (Strange news of drowning)
- 痨虫异事 (Strange affair of the consumption bug)
- 醉中获鬼 (Catching a ghost while drunk)
- 放生解罪 (Releasing captive animals to absolve sins)
- 乩仙题画 (Planchette spirit composes a painting inscription)
- 赤柱怪兽 (The monster of Stanley)
- 阴官坐堂 (Underworld official holds court)

Analyze the following list of titles. Return a JSON array containing ONLY the titles that you classify as '志怪' or '异事', following the patterns and themes in the examples above. Do not include any titles that are purely about crime, war, politics, social customs, or social commentary unless they have a clear supernatural or bizarre element.
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
