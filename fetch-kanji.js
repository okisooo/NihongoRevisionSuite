import fs from 'fs';
import path from 'path';

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
80. * 土
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
117. * 食
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
164. 店
165. 開
166. 閉
167. 問
168. 自
169. 首
170. * 辶
171. 道
172. * 周
173. 週
174. 重
175. 動
176. 働
177. 早
178. * 艹
179. 花
180. 草
181. 茶
182. * 車
183. 転
184. * 辶
185. 運
186. 軽
187. 朝
188. 昼
189. * 虫
190. 風
191. 押
192. * 弓
193. 引
194. * 厶
195. 強
196. * 羽
197. 弱
198. 習
199. 勉
200. 台
201. 始
202. 市
203. 姉
204. * 未
205. 妹
206. 味
207. 好
208. 心
209. * ⺖
210. 思
211. 意
212. 急
213. 悪
214. 兄
215. 弟
216. 親
217. 主
218. 注
219. 住
220. 春
221. 夏
222. * 禾
223. 秋
224. 冬
225. 寒
226. 暑
227. 晴
228. * 糸
229. 終
230. * 氏
231. 紙
232. 低
233. 肉
234. 鳥
235. 犬
236. * 羊
237. 洋
238. 和
239. 服
240. 式
241. 試
242. 験
243. 近
244. * 辶
245. 遠
246. 送
247. 回
248. 用
249. 通
250. 不
251. 事
252. 仕
253. 料
254. 理
255. 有
256. 無
257. 野
258. 黒
259. 町
260. 村
261. 菜
262. 区
263. 方
264. * 方
265. 旅
266. * 矢
267. 族
268. * 豆
269. 短
270. 知
271. 死
272. 医
273. 者
274. 都
275. 京
276. 県
277. 民
278. 同
279. 合
280. * ⺮
281. 答
282. * 豕
283. 家
284. 場
285. * 戶
286. 所
287. 世
288. 代
289. 貸
290. 地
291. 池
292. 洗
293. 光
294. * 央
295. 英
296. 映
297. 歌
298. 楽
299. 薬
300. 界
301. 産
302. 業
303. 林
304. 森
305. 物
306. 品
307. 建
308. 館
309. 図
310. 使
311. 便
312. * 昔
313. 借
314. 作
315. 広
316. 私
317. 去
318. 室
319. 屋
320. 教
321. * 石
322. 研
323. 発
324. 究
325. 着
326. 乗
327. 計
328. 画
329. 説
330. 院
331. * 广
332. 病
333. 科
334. 度
335. * 頁
336. 頭
  337. 顔
  338. 声
  339. 題
  340. 色
  341. 漢
  342. 字
  343. 写
  344. 考
  345. 真
  346. * 隹
  347. 一
  348. 曜
  349. 進
  350. 帰
  351. 別
  352. 以
  353. 堂
  354. 税
  355. 込
  356. 申`;

// Map known radicals to avoid empty lookups or missing items
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
  "周": { reading: "しゅう (shuu)", meaning: "Circumference / Week component" },
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
  const lines = rawList.trim().split('\n');
  const result = [];

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*(\*?)\s*(.+)$/);
    if (!match) continue;

    const id = parseInt(match[1]);
    const isRadical = match[2] === '*';
    const char = match[3].trim();

    console.log(`Processing ${id}: ${char} (Radical: ${isRadical})`);

    let reading = '';
    let meaning = '';

    if (isRadical) {
      const info = radicalMap[char];
      reading = info ? info.reading : 'n/a';
      meaning = info ? `[Radical] ${info.meaning}` : '[Radical/Component]';
    } else {
      const details = await fetchKanjiDetails(char);
      if (details) {
        reading = details.reading;
        meaning = details.meaning;
      } else {
        // Fallback to radical map or default values
        const info = radicalMap[char];
        reading = info ? info.reading : 'n/a';
        meaning = info ? info.meaning : 'Unknown Kanji';
      }
    }

    result.push({
      id,
      kanji: char,
      reading,
      meaning,
      isRadical
    });

    // Simple sleep to avoid spamming the API
    await new Promise(r => setTimeout(r, 100));
  }

  const fileContent = `export const kanjiData = ${JSON.stringify(result, null, 2)};\n`;
  fs.writeFileSync(path.join('src', 'data', 'kanji.js'), fileContent);
  console.log('Successfully wrote to src/data/kanji.js!');
}

main();
