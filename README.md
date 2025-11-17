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
用户上传文件: 用户首先通过一个界面上传一个或多个包含《申报》文章目录的 CSV 文件。
前端解析: 浏览器接收到文件后，使用 JavaScript 读取并解析 CSV 文件的内容，将其转换为一个包含所有文章（标题、作者、日期）的列表。
分批处理: 由于文章总数可能非常多（几万甚至几十万篇），一次性将所有标题都发送给 Gemini API 可能会超出请求大小限制或导致超时。因此，程序会将整个文章列表分割成多个较小的批次（例如，每批200篇文章）。
调用 Gemini API: 程序会遍历每一个批次，将该批次内的文章标题发送给 Gemini API 进行分析。
在发送请求时，它会附带一个非常详细的系统指令 (System Instruction)。这个指令扮演了关键角色：它告诉 Gemini 模型要扮演一个“清末《申报》历史研究专家”的角色，任务是专门识别出“志怪”或“异事”类别的文章标题，并且提供了清晰的正面（是这类）和负面（不是这类）的例子来“教”会模型如何判断。
同时，请求还指定了希望模型返回一个JSON 格式的数组，数组里只包含它认为是“志怪异事”的标题字符串。这使得程序处理返回结果变得非常简单和可靠。
结果汇总: 程序会收集并存储从每一个批次返回的符合条件的标题。
最终筛选与展示: 当所有批次都分析完毕后，程序会用所有收集到的“志怪异事”标题，去匹配原始的、完整的文章列表，从而筛选出完整的文章信息（标题、作者、日期）。
结果呈现: 最后，应用将这些筛选出的文章在一个清晰的表格中展示给用户。
提供下载: 用户可以一键将筛选出的结果下载为一个新的 CSV 文件，方便后续研究和使用。
关键设计点
#### 用户体验:
界面清晰地引导用户上传文件。
在分析过程中，会显示一个加载动画和进度提示（例如，“正在分析... (2 / 100批次)”），让用户了解当前进展，而不是感觉程序卡住了。
如果出现任何错误（如文件格式不对、API调用失败），会显示明确的错误提示。
#### 性能与稳定性:
分批处理是核心，它保证了即使处理非常大的数据集，应用也能稳定运行。
用户可以自定义API调用间隔，这是一个非常贴心的设计。它可以有效避免因为请求过于频繁而触发 Gemini API 的速率限制（Rate Limit），从而提高了分析成功率。
#### AI 的精准性:
成功的关键在于geminiService.ts文件中那个精心设计的系统指令。它通过“角色扮演”+“清晰定义任务”+“提供正反案例 (Few-shot Prompting)”的方式，极大地提高了 Gemini 模型分类的准确性。
总而言之，这个应用巧妙地结合了前端技术和强大的大语言模型能力，创建了一个自动化、高效且精准的历史文献筛选工具。它将原本需要人工花费大量时间阅读和判断的工作，在几分钟内就完成了。
