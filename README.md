<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1aXhstVvsqY9pO_tWMKuqsmQxoZChT_X9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 总体流程
这个应用是一个纯前端应用，意味着所有的计算和逻辑处理都在用户的浏览器中完成，不依赖后端服务器来处理数据。
**用户上传文件**: 用户首先通过一个界面上传一个或多个包含《申报》文章目录的 CSV 文件。

**前端解析**: 浏览器接收到文件后，使用 JavaScript 读取并解析 CSV 文件的内容，将其转换为一个包含所有文章（标题、作者、日期）的列表。

**分批处理**: 由于文章总数可能非常多（几万甚至几十万篇），一次性将所有标题都发送给 Gemini API 可能会超出请求大小限制或导致超时。因此，程序会将整个文章列表分割成多个较小的批次（例如，每批200篇文章）。

**调用 Gemini API**: 程序会遍历每一个批次，将该批次内的文章标题发送给 Gemini API 进行分析。
   - 在发送请求时，它会附带一个非常详细的**系统指令 (System Instruction)**。这个指令扮演了关键角色：它告诉 Gemini 模型要扮演一个“清末《申报》历史研究专家”的角色，任务是专门识别出“志怪”或“异事”类别的文章标题，并且提供了清晰的正面（是这类）和负面（不是这类）的例子来“教”会模型如何判断。
   - 同时，请求还指定了希望模型返回一个JSON 格式的数组，数组里只包含它认为是“志怪异事”的标题字符串。这使得程序处理返回结果变得非常简单和可靠。

**结果汇总**: 程序会收集并存储从每一个批次返回的符合条件的标题。

**最终筛选与展示**: 当所有批次都分析完毕后，程序会用所有收集到的“志怪异事”标题，去匹配原始的、完整的文章列表，从而筛选出完整的文章信息（标题、作者、日期）。

**结果呈现**: 最后，应用将这些筛选出的文章在一个清晰的表格中展示给用户。

**提供下载**: 用户可以一键将筛选出的结果下载为一个新的 CSV 文件，方便后续研究和使用。
### 关键设计点
- 用户体验:
   - 界面清晰地引导用户上传文件。
   - 在分析过程中，会显示一个加载动画和进度提示（例如，“正在分析... (2 / 100批次)”），让用户了解当前进展，而不是感觉程序卡住了。
   - 如果出现任何错误（如文件格式不对、API调用失败），会显示明确的错误提示。
- 性能与稳定性:
   - 分批处理是核心，它保证了即使处理非常大的数据集，应用也能稳定运行。
   - 用户可以自定义API调用间隔，这是一个非常贴心的设计。它可以有效避免因为请求过于频繁而触发 Gemini API 的速率限制（Rate Limit），从而提高了分析成功率。
- AI 的精准性:
   - 成功的关键在于geminiService.ts文件中那个精心设计的系统指令。它通过“角色扮演”+“清晰定义任务”+“提供正反案例 (Few-shot Prompting)”的方式，极大地提高了 Gemini 模型分类的准确性。
总而言之，这个应用巧妙地结合了前端技术和强大的大语言模型能力，创建了一个自动化、高效且精准的历史文献筛选工具。它将原本需要人工花费大量时间阅读和判断的工作，在几分钟内就完成了。

## 系统指令
这个分类能力完全依赖于 Gemini 模型，而“系统指令”就是我们用来指挥它的“说明书”。
应用中并没有一个“训练”步骤，您之前上传的已分类篇目并不是用来“训练”模型的。实际情况是这样的：
- 强大的通用模型：我们使用的是一个非常强大的、通用的 Gemini 模型（gemini-2.5-flash）。这个模型本身已经通过海量数据预训练，具备了强大的语言理解、逻辑推理和遵循指令的能力。它就像一个学识渊博但需要具体任务指导的专家。
- **“系统指令”是关键的实时指导 (In-context Learning)**：在每次向 Gemini API 发送请求时，我们都会附带那段详细的systemInstruction。这并不是在训练模型，而是在 **“即时指导”** 它。这个指令做了几件非常重要的事情：
   - **赋予角色**: You are an expert historical researcher... 这让模型进入一个特定的“角色扮演”模式，调动与该领域相关的知识。
   - **明确任务**: Your task is to identify article titles that belong to the '志怪' or '异事' genres. 这清晰地告诉了它要做什么。
   - **提供具体范例 (Few-Shot Prompting)**: 这是最关键的一步！ 指令中包含了Here are some examples of titles that FIT these categories... 和 Here are some examples of titles that DO NOT FIT these categories...。通过提供这些正反两方面的具体例子，我们等于是在对话的当下，实时地“教会”了模型判断的标准。模型会分析这些范例，迅速理解“志怪异事”的风格、关键词和内涵，然后用这个刚刚学到的标准去判断您提交的新标题列表。
您上传的数据是“分析对象”，而非“训练材料”：所以，您上传的CSV文件，无论是已分类还是未分类的，对于程序来说都只是本次需要被分析的数据。程序会把这些数据分批次地提交给被“系统指令”临时“教”会了的Gemini模型，让它进行判断。

### systemInstruction
- “说明书”是固定的：在 services/geminiService.ts 文件中，有一个名为 systemInstruction 的常量字符串。这个长长的字符串就是我们之前讨论的“系统指令”或“说明书”。它里面包含了对模型角色的定义、任务的描述，以及**硬编码（Hard-coded）** 进去的正反两方面范例。这个“说明书”是程序代码的一部分，是固定不变的，但是用户使用的时候可以调整这个示例，精心挑选一个**更大、更具多样性的范例集合**，覆盖更广泛的主题（如报应、鬼魂、精怪、异象、仙丹、转世等）。
- 页面上传的数据是“待办事项”：在 App.tsx 文件中，当您通过 handleFileChange 函数上传CSV文件时，程序会将文件内容解析成一个 allArticles 列表。这个列表就是本次需要被分析的全部数据，是模型的“待办事项列表”。
- 每次分析都是一次全新的开始：当您点击“开始分析”时 (handleAnalyze 函数)，程序会：
   - 将 allArticles 列表切分成小批次 (batch)。
   - 对于每一个批次，它都会调用 filterSupernaturalArticles 函数。
   - 这个函数会把固定的 systemInstruction 和当前这一批次的标题一起打包，发送给 Gemini API。
所以，整个流程可以看作是：用一把固定的“尺子”（systemInstruction），去衡量您每次新提供的“布料”（上传的CSV数据）。
####  systemInstruction说明书举例（可自行调整）
以下是我的 systemInstruction分类示例：
```
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
```

**总结来说**：
- 这个应用的“智能”并非来自于对您上传数据的学习或记忆。它的魔力在于 **“Prompt Engineering”（提示工程）** 的巧妙运用。我们通过一个精心设计的、包含角色、任务和范例的“系统指令”，对一个强大的通用AI模型进行了高效的即时引导，让它能够精准地完成这个非常专业和细分的分类任务。
- 这正是现代大语言模型应用的强大之处——我们不需要为每个任务都去训练一个新模型，而是可以通过高质量的“提示”（Prompt）来解锁和引导其已有的强大能力。
