import fs from 'fs';
import path from 'path';

// Load classmate's corrected kanji entries to preserve corrections
let classmateMap = new Map();
try {
  const fileContent = fs.readFileSync(path.join('src', 'data', 'kanji.js'), 'utf-8');
  // Simple extraction of JSON array from file contents
  const jsonStr = fileContent.substring(fileContent.indexOf('['), fileContent.lastIndexOf(']') + 1);
  const classmateKanji = JSON.parse(jsonStr);
  classmateKanji.forEach(item => {
    if (!item.isRadical) {
      classmateMap.set(item.kanji, item);
    }
  });
} catch (e) {
  console.warn('Could not read existing kanji.js for mapping:', e.message);
}

const rawKanjiList = `1. 一
2. 二
3. 三
4. 山
5. 川
6. 目
7. 口
8. 人
9. 木
10. 休
11. 本
12. 体
13. 田
14. 力
15. 男
16. 女
17. 安
18. 上
19. 下
20. 中
21. 大
22. 太
23. 小
24. 少
25. 入
26. 出
27. 子
28. 学
29. 四
30. 五
31. 六
32. 七
33. 八
34. 九
35. 十
36. 古
37. 百
38. 千
39. 万
40. 円
41. 日
42. 月
43. 明
44. 立
45. 音
46. 暗
47. 火
48. 水
49. 土
50. 国
51. 全
52. 金
53. 工
54. 左
55. 右
56. 友
57. 何
58. 手
59. 切
60. 分
61. 今
62. 半
63. 止
64. 正
65. 歩
66. 足
67. 走
68. 起
69. 夕
70. 外
71. 多
72. 名
73. 夜
74. 生
75. 見
76. 元
77. 先
78. 天
79. 文
80. 父
81. 母
82. 行
83. 毎
84. 海
85. 東
86. 西
87. 南
88. 北
89. 耳
90. 門
91. 聞
92. 間
93. 牛
94. 午
95. 年
96. 前
97. 後
98. 高
99. 銀
100. 食
101. 飯
102. 飲
103. 白
104. 赤
105. 青
106. 言
107. 話
108. 語
109. 売
110. 読
111. 書
112. 新
113. 馬
114. 駅
115. 魚
116. 米
117. 来
118. 雨
119. 電
120. 気
121. 車
122. 空
123. 社
124. 内
125. 長
126. 校
127. 会
128. 寺
129. 待
130. 時
131. 持
132. 特
133. 買
134. 員
135. 广
136. 店
137. 開
138. 閉
139. 問
140. 自
141. 首
142. 道
143. 週
144. 重
145. 動
146. 働
147. 早
148. 花
149. 草
150. 茶
151. 転
152. 運
153. 軽
154. 朝
155. 昼
156. 風
157. 押
158. 引
159. 強
160. 弱
161. 習
162. 勉
163. 台
164. 始
165. 市
166. 姉
167. 妹
168. 味
169. 好
170. 心
171. 思
172. 意
173. 用
174. 不
175. 急
176. 悪
177. 兄
178. 弟
179. 親
180. 主
181. 注
182. 住
183. 春
184. 夏
185. 秋
186. 冬
187. 寒
188. 暑
189. 晴
190. 終
191. 紙
192. 低
193. 肉
194. 鳥
195. 犬
196. 洋
197. 和
198. 服
199. 式
200. 試
201. 験
202. 近
203. 遠
204. 送
205. 回
206. 事
207. 仕
208. 料
209. 理
210. 有
211. 無
212. 野
213. 黒
214. 町
215. 村
216. 菜
217. 区
218. 方
219. 旅
220. 族
221. 短
222. 知
223. 死
224. 医
225. 者
226. 都
227. 京
228. 県
229. 民
230. 同
231. 合
232. 答
233. 家
234. 場
235. 所
236. 世
237. 代
238. 貸
239. 地
240. 池
241. 洗
242. 光
243. 英
244. 映
245. 歌
246. 楽
247. 薬
248. 界
249. 産
250. 業
251. 林
252. 森
253. 物
254. 品
255. 建
256. 館
257. 図
258. 使
259. 便
260. 借
261. 作
262. 広
263. 私
264. 去
265. 室
266. 屋
267. 教
268. 研
269. 発
270. 究
271. 着
272. 乗
273. 計
274. 画
275. 説
276. 院
277. 病
278. 科
279. 度
280. 頭
281. 顔
282. 声
283. 題
284. 色
285. 漢
286. 字
287. 写
288. 考
289. 真
290. 集
291. 曜
292. 進
293. 帰
294. 別
295. 以
296. 堂
297. 税
298. 込
299. 申
300. 通`; // Note: user's list ended at 300 with 通, wait, in MNN there are 300 kanjis here

const rawRadicalsList = `★4. 日
★5. 王
★6. 玉
★7. 人
★8. 𠂉
★9. 可
★10. 刀
★11. 𡈼
★12. 儿
★13. 彳
★14. 卜
★15. 氵
★16. 刂
★17. 夂
★18. 良
★19. 金
★20. 𩙿
★21. 欠
★22. 言
★23. 士
★24. 斤
★25. 𫶧
★26. 木
★27. 交
★28. 寸
★29. 扌
★30. 牛
★31. 貝
★32. 广
★33. 辶
★34. 周
★35. 艹
★36. 車
★37. 辶
★38. 虫
★39. 弓
★40. 厶
★41. 羽
★42. 未
★43. ⺖
★44. 糸
★45. 禾
★46. 糸
★47. 氏
★48. 羊
★49. 辶
★50. 方
★51. 矢
★52. 豆
★53. ⺮
★54. 豕
★55. 戶
★56. 央
★57. 昔
★58. 石
★59. 广
★60. 頁
★61. 隹`; // Handled ★30 to be 牛 as in MNN

const radicalMap = {
  "日": { reading: "にち (nichi)", meaning: "Sun radical / Day" },
  "王": { reading: "おう (ou)", meaning: "King radical" },
  "玉": { reading: "たま (tama)", meaning: "Jade radical" },
  "人": { reading: "ひと (hito)", meaning: "Person radical" },
  "𠂉": { reading: "n/a", meaning: "Component (Top of 年/先)" },
  "可": { reading: "か (ka)", meaning: "Can, passable (radical/component)" },
  "刀": { reading: "かたな (katana)", meaning: "Sword radical" },
  "𡈼": { reading: "てい (tei)", meaning: "Royal component / tall" },
  "儿": { reading: "にんにょう (ninnyou)", meaning: "Legs radical" },
  "彳": { reading: "ぎょうにんべん (gyouninben)", meaning: "Step radical" },
  "卜": { reading: "ぼく (boku)", meaning: "Divination radical" },
  "氵": { reading: "さんずい (sanzui)", meaning: "Water radical" },
  "刂": { reading: "りっとう (rittou)", meaning: "Knife/Sword radical" },
  "夂": { reading: "ふゆがしら (fuyugashira)", meaning: "Winter / Go radical" },
  "良": { reading: "よい (yoi)", meaning: "Good (component)" },
  "金": { reading: "かね (kane)", meaning: "Metal radical" },
  "𩙿": { reading: "しょく (shoku)", meaning: "Food radical / component" },
  "欠": { reading: "あくび (akubi)", meaning: "Lack / Yawn radical" },
  "言": { reading: "こと (koto)", meaning: "Speech radical" },
  "士": { reading: "し (shi)", meaning: "Scholar / Warrior radical" },
  "斤": { reading: "おの (ono)", meaning: "Axe / Catty radical" },
  "𫶧": { reading: "n/a", meaning: "Component (Top of 電)" },
  "木": { reading: "き (ki)", meaning: "Tree radical" },
  "交": { reading: "まじわる (majiwaru)", meaning: "Mix / Intersect component" },
  "寸": { reading: "すん (sun)", meaning: "Measurement / Inch radical" },
  "扌": { reading: "てへん (tehen)", meaning: "Hand radical" },
  "牛": { reading: "うし (ushi)", meaning: "Cow radical" },
  "貝": { reading: "かい (kai)", meaning: "Shell radical" },
  "广": { reading: "まだれ (madare)", meaning: "Slanted roof radical" },
  "辶": { reading: "しんにょう (shinnyou)", meaning: "Road / Walk radical" },
  "周": { reading: "しゅう (shuu)", meaning: "Circumference / Week component" },
  "艹": { reading: "くさかんむり (kusakanmuri)", meaning: "Grass radical" },
  "車": { reading: "くるま (kuruma)", meaning: "Car radical" },
  "虫": { reading: "むし (mushi)", meaning: "Insect radical" },
  "弓": { reading: "ゆみ (yumi)", meaning: "Bow radical" },
  "厶": { reading: "む (mu)", meaning: "Private radical" },
  "羽": { reading: "はね (hane)", meaning: "Feather radical" },
  "未": { reading: "いま・だ (ima-da)", meaning: "Not yet radical" },
  "⺖": { reading: "りっしんべん (risshinben)", meaning: "Heart radical" },
  "糸": { reading: "いと (ito)", meaning: "Thread radical" },
  "禾": { reading: "のぎへん (nogihen)", meaning: "Grain radical" },
  "氏": { reading: "うじ (uji)", meaning: "Clan radical" },
  "羊": { reading: "ひつじ (hitsuji)", meaning: "Sheep radical" },
  "方": { reading: "ほう (hou)", meaning: "Direction radical" },
  "矢": { reading: "や (ya)", meaning: "Arrow radical" },
  "豆": { reading: "まめ (mame)", meaning: "Bean radical" },
  "⺮": { reading: "たけかんむり (takekanmuri)", meaning: "Bamboo radical" },
  "豕": { reading: "いのこ (inoko)", meaning: "Pig radical" },
  "戶": { reading: "と (to)", meaning: "Door radical" },
  "央": { reading: "おう (ou)", meaning: "Center component" },
  "昔": { reading: "むかし (mukashi)", meaning: "Ancient component" },
  "石": { reading: "いし (ishi)", meaning: "Stone radical" },
  "頁": { reading: "おおがい (oogai)", meaning: "Page radical" },
  "隹": { reading: "ふるとり (furutori)", meaning: "Short-tailed bird radical" },
};

async function fetchKanjiDetails(char) {
  try {
    const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(char)}`);
    if (res.status === 200) {
      const data = await res.json();
      return {
        reading: [...data.kun_readings, ...data.on_readings].join(' / '),
        meaning: data.meanings.join(', ')
      };
    }
  } catch (e) {
    console.error(`Error fetching ${char}: ${e.message}`);
  }
  return null;
}

async function main() {
  // 1. Process Kanji List (1-300)
  const kanjiLines = rawKanjiList.trim().split('\n');
  const mergedKanjis = [];

  for (const line of kanjiLines) {
    const match = line.match(/^(\d+)\.\s*(.+)$/);
    if (!match) continue;

    const id = parseInt(match[1]);
    const char = match[2].trim();

    let reading = '';
    let meaning = '';

    // Check classmate map first
    const classmate = classmateMap.get(char);
    if (classmate) {
      reading = classmate.reading;
      meaning = classmate.meaning;
    } else {
      // Fetch details from online API
      console.log(`Fetching from API for missing Kanji ${id}: ${char}...`);
      const details = await fetchKanjiDetails(char);
      if (details) {
        reading = details.reading;
        meaning = details.meaning;
      } else {
        // Fallback
        const info = radicalMap[char];
        reading = info ? info.reading : 'n/a';
        meaning = info ? info.meaning : 'Vocabulary Kanji';
      }
      // Sleep to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    mergedKanjis.push({
      id,
      kanji: char,
      reading,
      meaning,
      isRadical: false
    });
  }

  // 2. Process Radicals List (★4-★61)
  const radicalLines = rawRadicalsList.trim().split('\n');
  const mergedRadicals = [];

  radicalLines.forEach((line) => {
    const match = line.match(/^★(\d+)\.\s*(.+)$/);
    if (!match) return;

    const id = parseInt(match[1]);
    const char = match[2].trim();

    const info = radicalMap[char];
    const reading = info ? info.reading : 'n/a';
    const meaning = info ? `[Radical] ${info.meaning}` : '[Radical Component]';

    mergedRadicals.push({
      id,
      kanji: char,
      reading,
      meaning,
      isRadical: true
    });
  });

  // Write files
  const kanjiFileContent = `export const kanjiData = ${JSON.stringify(mergedKanjis, null, 2)};\n`;
  fs.writeFileSync(path.join('src', 'data', 'kanji.js'), kanjiFileContent);

  const radicalsFileContent = `export const radicalsData = ${JSON.stringify(mergedRadicals, null, 2)};\n`;
  fs.writeFileSync(path.join('src', 'data', 'radicals.js'), radicalsFileContent);

  console.log('Database rebuild completed successfully!');
  console.log(`- Kanji items written: ${mergedKanjis.length} (IDs 1-300)`);
  console.log(`- Radical items written: ${mergedRadicals.length} (IDs 4-61)`);
}

main();
