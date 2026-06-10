import fs from 'fs';
import path from 'path';
// Import the classmate's updated kanji data
import { kanjiData as classmateKanji } from './src/data/kanji.js';

const rawList = `1. 一
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
43. * 日
44. 明
45. 立
46. 音
47. 暗
48. 火
49. 水
50. 土
51. * 王
52. * 玉
53. 国
54. * 人
55. 全
56. 金
57. 工
58. * 𠂉
59. 左
60. 右
61. 友
62. * 可
63. 何
64. 手
65. * 刀
66. 切
67. 分
68. 今
69. 半
70. 止
71. 正
72. 歩
73. 足
74. 走
75. 起
76. 夕
77. 外
78. 多
79. 名
80. * 𡈼
81. 夜
82. 生
83. * 儿
84. 見
85. 元
86. 先
87. 天
88. 文
89. 父
90. 母
91. * 彳
92. 行
93. * 卜
94. 毎
95. * 氵
96. 海
97. 東
98. 西
99. 南
100. 北
101. 耳
102. 門
103. 聞
104. 間
105. 牛
106. 午
107. 年
108. * 刂
109. 前
110. * 夂
111. 後
112. 高
113. * 良
114. * 金
115. 銀
116. 食
117. * 𩙿
118. 飯
119. * 欠
120. 飲
121. 白
122. 赤
123. 青
124. 言
125. * 言
126. 話
127. 語
128. * 士
129. 売
130. 読
131. 書
132. * 斤
133. 新
134. 馬
135. 駅
136. 魚
137. 米
138. 来
139. 雨
140. * 𫶧
141. 電
142. 気
143. 車
144. 空
145. 社
146. 内
147. 長
148. * 木
149. * 交
150. 校
151. 会
152. * 寸
153. 寺
154. 待
155. 時
156. * 扌
157. 持
158. * 牛
159. 特
160. * 貝
161. 買
162. 員
163. * 广
164. 質
165. 店
166. 開
167. 閉
168. 問
169. 自
170. 首
171. * 辶
172. 道
173. * 冂
174. 週
175. 重
176. 動
177. 働
178. 早
179. * 艹
180. 花
181. 草
182. 茶
183. * 車
184. 転
185. * 辶
186. 運
187. 軽
188. 朝
189. 昼
190. * 虫
191. 風
192. 押
193. * 弓
194. 引
195. * 厶
196. 強
197. * 羽
198. 弱
199. 習
200. 勉
201. 台
202. 始
203. 市
204. 姉
205. * 未
206. 妹
207. 味
208. 好
209. 心
210. * ⺖
211. 思
212. 意
213. 急
214. 悪
215. 兄
216. 弟
217. 親
218. 主
219. 注
220. 住
221. 春
222. 夏
223. * 糸
224. * 禾
225. 秋
226. 冬
227. 寒
228. 暑
229. 晴
230. 終
231. * 糸
232. * 氏
233. 紙
234. 低
235. 肉
236. 鳥
237. 犬
238. * 羊
239. 洋
240. 和
241. 服
242. 式
243. 試
244. 験
245. 近
246. * 辶
247. 遠
248. 送
249. 回
250. 用
251. 通
252. 不
253. 事
254. 仕
255. 料
256. 理
257. 有
258. 無
259. 野
260. 黒
261. 町
262. 村
263. 菜
264. 区
265. 方
266. * 方
267. 旅
268. * 矢
269. 族
270. * 豆
271. 短
272. 知
273. 死
274. 医
275. 者
276. 都
277. 京
278. 県
279. 民
280. 同
281. 合
282. * ⺮
283. 答
284. * 豕
285. 家
286. 場
287. * 戶
288. 所
289. 世
290. 代
291. 貸
292. 地
293. 池
294. 洗
295. 光
296. * 央
297. 英
298. 映
299. 歌
300. 楽
301. 薬
302. 界
303. 産
304. 業
305. 林
306. 森
307. 物
308. 品
309. 建
310. 館
311. 図
312. 使
313. 便
314. * 昔
315. 借
316. 作
317. 広
318. 私
319. 去
320. 室
321. 屋
322. 教
323. * 石
324. 研
325. 発
326. 究
327. 着
328. 乗
329. 計
330. 画
331. 説
332. 院
333. * 广
334. 病
335. 科
336. 度
337. * 頁
338. 頭
339. 顔
340. 声
341. 題
342. 色
343. 漢
344. 字
345. 写
346. 考
347. 真
348. * 隹
349. 集
350. 曜
351. 進
352. 帰
353. 別
354. 以
355. 堂
356. 税
357. 込
358. 申`;

// Map known radicals
const radicalMap = {
  "日": { reading: "にち (nichi)", meaning: "Sun radical / Day" },
  "王": { reading: "おう (ou)", meaning: "King radical" },
  "玉": { reading: "たま (tama)", meaning: "Jade radical" },
  "人": { reading: "ひと (hito)", meaning: "Person radical" },
  "𠂉": { reading: "n/a", meaning: "Component (Top of 年/先)" },
  "可": { reading: "か (ka)", meaning: "Can, passable (radical/component)" },
  "刀": { reading: "かたな (katana)", meaning: "Sword radical" },
  "土": { reading: "つち (tsuchi)", meaning: "Earth radical" },
  "儿": { reading: "にんにょう (ninnyou)", meaning: "Legs radical" },
  "彳": { reading: "ぎょうにんべん (gyouninben)", meaning: "Step radical" },
  "卜": { reading: "ぼく (boku)", meaning: "Divination radical" },
  "氵": { reading: "さんずい (sanzui)", meaning: "Water radical" },
  "刂": { reading: "りっとう (rittou)", meaning: "Knife/Sword radical" },
  "夂": { reading: "ふゆがしら (fuyugashira)", meaning: "Winter / Go radical" },
  "良": { reading: "よい (yoi)", meaning: "Good (component)" },
  "金": { reading: "かね (kane)", meaning: "Metal radical" },
  "食": { reading: "しょく (shoku)", meaning: "Food radical" },
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
  "冂": { reading: "けいがまえ (keigamae)", meaning: "Open box / border radical" },
  "艹": { reading: "くさかんむり (kusakanmuri)", meaning: "Grass radical" },
  "車": { reading: "くるま (kuruma)", meaning: "Car radical" },
  "虫": { reading: "むし (mushi)", meaning: "Insect radical" },
  "弓": { reading: "ゆみ (yumi)", meaning: "Bow radical" },
  "厶": { reading: "む (mu)", meaning: "Private radical" },
  "羽": { reading: "はね (hane)", meaning: "Feather radical" },
  "未": { reading: "いま・だ (ima-da)", meaning: "Not yet radical" },
  "⺖": { reading: "りっしんべん (risshinben)", meaning: "Heart radical" },
  "禾": { reading: "のぎへん (nogihen)", meaning: "Grain radical" },
  "糸": { reading: "いと (ito)", meaning: "Thread radical" },
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

// Create a map of classmate's updated kanji data for fast lookup
const classmateMap = new Map();
classmateKanji.forEach(item => {
  classmateMap.set(item.kanji, item);
});

function toHiragana(str) {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

const lines = rawList.trim().split('\n');
const mergedKanjiData = [];
const radicalsData = [];

let kanjiCounter = 0;
let radicalCounter = 3;

lines.forEach((line) => {
  const match = line.match(/^(\d+)\.\s*(\*?)\s*(.+)$/);
  if (!match) return;

  const isRadical = match[2] === '*';
  const char = match[3].trim();

  let reading = '';
  let meaning = '';
  let onyomi = [];
  let kunyomi = [];
  let examples = [];
  let standalone = [];

  if (isRadical) {
    radicalCounter++;
    const id = radicalCounter;
    const info = radicalMap[char];
    reading = info ? toHiragana(info.reading) : 'n/a';
    meaning = info ? `[Radical] ${info.meaning}` : '[Radical/Component]';
    
    const radicalItem = {
      id,
      kanji: char,
      reading,
      meaning,
      isRadical: true
    };
    radicalsData.push(radicalItem);
  } else {
    kanjiCounter++;
    const id = kanjiCounter;
    // If classmate updated this Kanji, use their values. Otherwise fall back to a generic default.
    const classmate = classmateMap.get(char);
    if (classmate) {
      reading = toHiragana(classmate.reading);
      meaning = classmate.meaning;
      onyomi = (classmate.onyomi || []).map(toHiragana);
      kunyomi = classmate.kunyomi || [];
      examples = classmate.examples || [];
      standalone = classmate.standalone || [];
    } else {
      // Fallback
      if (char === '質') {
        reading = toHiragana('シツ, シチ / たち');
        meaning = 'quality, substance, matter, temperament, pawn';
      } else {
        const info = radicalMap[char];
        reading = info ? toHiragana(info.reading) : 'n/a';
        meaning = info ? info.meaning : 'Kanji';
      }
    }

    mergedKanjiData.push({
      id,
      kanji: char,
      reading,
      meaning,
      isRadical: false,
      onyomi,
      kunyomi,
      examples,
      standalone
    });
  }
});

// Write full 356 items back to kanji.js
const kanjiFileContent = `export const kanjiData = ${JSON.stringify(mergedKanjiData, null, 2)};\n`;
fs.writeFileSync(path.join('src', 'data', 'kanji.js'), kanjiFileContent);

// Write radicals list to radicals.js
const radicalsFileContent = `export const radicalsData = ${JSON.stringify(radicalsData, null, 2)};\n`;
fs.writeFileSync(path.join('src', 'data', 'radicals.js'), radicalsFileContent);

console.log('Successfully restored 356 curriculum items!');
console.log(`- Total items in kanji.js: ${mergedKanjiData.length}`);
console.log(`- Total items in radicals.js: ${radicalsData.length}`);
