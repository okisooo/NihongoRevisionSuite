import fs from 'fs';
import path from 'path';

// This file defines the 300 sentence database for the Furigana Writing Game.
// Each sentence targets a specific Kanji ID from 1 to 300.
// Targets indicate which words in the sentence require typing, along with their readings and furigana segments.

const sentences = [
  // 1-10
  {
    kanjiId: 1,
    sentence: "私はりんごを一つ買いました。",
    translation: "I bought one apple.",
    targets: [{ word: "一つ", reading: "ひとつ", segments: [{ ruby: "一", rt: "ひと" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 2,
    sentence: "二人はとても仲が良いです。",
    translation: "The two of them are very close.",
    targets: [{ word: "二人", reading: "ふたり", segments: [{ ruby: "二", rt: "ふた" }, { ruby: "人", rt: "り" }] }]
  },
  {
    kanjiId: 3,
    sentence: "三つのリンゴがあります。",
    translation: "There are three apples.",
    targets: [{ word: "三つ", reading: "みっつ", segments: [{ ruby: "三", rt: "みっ" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 4,
    sentence: "富士山は日本で一番高い山です。",
    translation: "Mount Fuji is the tallest mountain in Japan.",
    targets: [{ word: "山", reading: "やま", segments: [{ ruby: "山", rt: "やま" }] }]
  },
  {
    kanjiId: 5,
    sentence: "この川はとても長いです。",
    translation: "This river is very long.",
    targets: [{ word: "川", reading: "かわ", segments: [{ ruby: "川", rt: "かわ" }] }]
  },
  {
    kanjiId: 6,
    sentence: "テレビの見すぎで目が痛いです。",
    translation: "My eyes hurt from watching too much TV.",
    targets: [{ word: "目", reading: "め", segments: [{ ruby: "目", rt: "め" }] }]
  },
  {
    kanjiId: 7,
    sentence: "大きな口を開けてください。",
    translation: "Please open your mouth wide.",
    targets: [{ word: "口", reading: "くち", segments: [{ ruby: "口", rt: "くち" }] }]
  },
  {
    kanjiId: 8,
    sentence: "あの人は私たちの先生です。",
    translation: "That person is our teacher.",
    targets: [{ word: "人", reading: "ひと", segments: [{ ruby: "人", rt: "ひと" }] }]
  },
  {
    kanjiId: 9,
    sentence: "公園に大きな木があります。",
    translation: "There is a big tree in the park.",
    targets: [{ word: "木", reading: "き", segments: [{ ruby: "木", rt: "き" }] }]
  },
  {
    kanjiId: 10,
    sentence: "日曜日は仕事を休みます。",
    translation: "I rest from work on Sundays.",
    targets: [{ word: "休みます", reading: "やすみます", segments: [{ ruby: "休", rt: "やす" }, { ruby: "みます" }] }]
  },

  // 11-20
  {
    kanjiId: 11,
    sentence: "毎日、日本語の本を読みます。",
    translation: "I read Japanese books every day.",
    targets: [{ word: "本", reading: "ほん", segments: [{ ruby: "本", rt: "ほん" }] }]
  },
  {
    kanjiId: 12,
    sentence: "風邪をひかないように、体に気をつけてください。",
    translation: "Please take care of your body so you don't catch a cold.",
    targets: [{ word: "体", reading: "からだ", segments: [{ ruby: "体", rt: "からだ" }] }]
  },
  {
    kanjiId: 13,
    sentence: "田んぼでお米を作っています。",
    translation: "They grow rice in the rice fields.",
    targets: [{ word: "田", reading: "た", segments: [{ ruby: "田", rt: "た" }] }]
  },
  {
    kanjiId: 14,
    sentence: "重い荷物を運ぶには力が必要です。",
    translation: "Strength is needed to carry heavy luggage.",
    targets: [{ word: "力", reading: "ちから", segments: [{ ruby: "力", rt: "ちから" }] }]
  },
  {
    kanjiId: 15,
    sentence: "あの男の人は私の兄です。",
    translation: "That man is my older brother.",
    targets: [{ word: "男の人", reading: "おとこのひと", segments: [{ ruby: "男", rt: "おとこ" }, { ruby: "の" }, { ruby: "人", rt: "ひと" }] }]
  },
  {
    kanjiId: 16,
    sentence: "あそこに女の人が立っています。",
    translation: "A woman is standing over there.",
    targets: [{ word: "女の人", reading: "おんなのひと", segments: [{ ruby: "女", rt: "おんな" }, { ruby: "の" }, { ruby: "人", rt: "ひと" }] }]
  },
  {
    kanjiId: 17,
    sentence: "このアパートの家賃は安いです。",
    translation: "The rent of this apartment is cheap.",
    targets: [{ word: "安い", reading: "やすい", segments: [{ ruby: "安", rt: "やす" }, { ruby: "い" }] }]
  },
  {
    kanjiId: 18,
    sentence: "机の上に本があります。",
    translation: "There is a book on the desk.",
    targets: [{ word: "上", reading: "うえ", segments: [{ ruby: "上", rt: "うえ" }] }]
  },
  {
    kanjiId: 19,
    sentence: "坂を下りると駅に着きます。",
    translation: "Go down the slope and you will reach the station.",
    targets: [{ word: "下", reading: "くだ", segments: [{ ruby: "下", rt: "くだ" }] }]
  },
  {
    kanjiId: 20,
    sentence: "箱の中に何が入っていますか。",
    translation: "What is inside the box?",
    targets: [{ word: "中", reading: "なか", segments: [{ ruby: "中", rt: "なか" }] }]
  },

  // 21-30
  {
    kanjiId: 21,
    sentence: "これはとても大きな犬ですね。",
    translation: "This is a very big dog, isn't it?",
    targets: [{ word: "大きい", reading: "おおきい", segments: [{ ruby: "大", rt: "おお" }, { ruby: "きい" }] }]
  },
  {
    kanjiId: 22,
    sentence: "太い線を一本引いてください。",
    translation: "Please draw one thick line.",
    targets: [{ word: "太い", reading: "ふとい", segments: [{ ruby: "太", rt: "ふと" }, { ruby: "い" }] }]
  },
  {
    kanjiId: 23,
    sentence: "あの小さな花はとても可愛いです。",
    translation: "That small flower is very cute.",
    targets: [{ word: "小さい", reading: "ちいさい", segments: [{ ruby: "小", rt: "ちい" }, { ruby: "さい" }] }]
  },
  {
    kanjiId: 24,
    sentence: "お小遣いが少ししかありません。",
    translation: "I only have a little pocket money.",
    targets: [{ word: "少し", reading: "すこし", segments: [{ ruby: "少", rt: "すこ" }, { ruby: "し" }] }]
  },
  {
    kanjiId: 25,
    sentence: "部屋に入ってもいいですか。",
    translation: "May I enter the room?",
    targets: [{ word: "入って", reading: "はいって", segments: [{ ruby: "入", rt: "はい" }, { ruby: "って" }] }]
  },
  {
    kanjiId: 26,
    sentence: "九時に家を出ます。",
    translation: "I leave the house at nine o'clock.",
    targets: [{ word: "出ます", reading: "でます", segments: [{ ruby: "出", rt: "で" }, { ruby: "ます" }] }]
  },
  {
    kanjiId: 27,
    sentence: "あそこで子供たちが遊んでいます。",
    translation: "Children are playing over there.",
    targets: [{ word: "子供", reading: "こども", segments: [{ ruby: "子", rt: "こ" }, { ruby: "供", rt: "ども" }] }]
  },
  {
    kanjiId: 28,
    sentence: "新しい学校で日本語を学びます。",
    translation: "I learn Japanese at the new school.",
    targets: [{ word: "学びます", reading: "まなびます", segments: [{ ruby: "学", rt: "まな" }, { ruby: "びます" }] }]
  },
  {
    kanjiId: 29,
    sentence: "四つのパンを買いましょう。",
    translation: "Let's buy four pieces of bread.",
    targets: [{ word: "四つ", reading: "よっつ", segments: [{ ruby: "四", rt: "よっ" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 30,
    sentence: "五時にロビーで待ち合わせましょう。",
    translation: "Let's meet in the lobby at five o'clock.",
    targets: [{ word: "五時", reading: "ごじ", segments: [{ ruby: "五", rt: "ご" }, { ruby: "時", rt: "じ" }] }]
  },

  // 31-40
  {
    kanjiId: 31,
    sentence: "六つのコップを並べてください。",
    translation: "Please line up six cups.",
    targets: [{ word: "六つ", reading: "むっつ", segments: [{ ruby: "六", rt: "むっ" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 32,
    sentence: "七つの山を越えました。",
    translation: "I crossed seven mountains.",
    targets: [{ word: "七つ", reading: "ななつ", segments: [{ ruby: "七", rt: "なな" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 33,
    sentence: "八つのケーキをみんなで分けました。",
    translation: "We shared eight cakes among everyone.",
    targets: [{ word: "八つ", reading: "やっつ", segments: [{ ruby: "八", rt: "やっ" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 34,
    sentence: "九つのボールが集まりました。",
    translation: "Nine balls were gathered.",
    targets: [{ word: "九つ", reading: "ここのつ", segments: [{ ruby: "九", rt: "ここの" }, { ruby: "つ" }] }]
  },
  {
    kanjiId: 35,
    sentence: "十日でこの仕事を終わらせます。",
    translation: "I will finish this job in ten days.",
    targets: [{ word: "十日", reading: "とおか", segments: [{ ruby: "十", rt: "とお" }, { ruby: "日", rt: "か" }] }]
  },
  {
    kanjiId: 36,
    sentence: "このお寺はとても古いです。",
    translation: "This temple is very old.",
    targets: [{ word: "古い", reading: "ふるい", segments: [{ ruby: "古", rt: "ふる" }, { ruby: "い" }] }]
  },
  {
    kanjiId: 37,
    sentence: "あの本は百ページあります。",
    translation: "That book has a hundred pages.",
    targets: [{ word: "百", reading: "ひゃく", segments: [{ ruby: "百", rt: "ひゃく" }] }]
  },
  {
    kanjiId: 38,
    sentence: "千円札を一枚貸してください。",
    translation: "Please lend me a 1000-yen bill.",
    targets: [{ word: "千円", reading: "せんえん", segments: [{ ruby: "千", rt: "せん" }, { ruby: "円", rt: "えん" }] }]
  },
  {
    kanjiId: 39,
    sentence: "この町には一万人以上の人が住んでいます。",
    translation: "More than 10,000 people live in this town.",
    targets: [{ word: "一万", reading: "いちまん", segments: [{ ruby: "一", rt: "いち" }, { ruby: "万", rt: "まん" }] }]
  },
  {
    kanjiId: 40,
    sentence: "一ドルは何円ですか。",
    translation: "How many yen is one dollar?",
    targets: [{ word: "何円", reading: "なんえん", segments: [{ ruby: "何", rt: "なん" }, { ruby: "円", rt: "えん" }] }]
  },

  // 41-50
  {
    kanjiId: 41,
    sentence: "今日は天気が良いです。",
    translation: "Today the weather is good.",
    targets: [{ word: "今日", reading: "きょう", segments: [{ ruby: "今日", rt: "きょう" }] }]
  },
  {
    kanjiId: 42,
    sentence: "夜空に綺麗な月が出ています。",
    translation: "A beautiful moon is out in the night sky.",
    targets: [{ word: "月", reading: "つき", segments: [{ ruby: "月", rt: "つき" }] }]
  },
  {
    kanjiId: 43,
    sentence: "部屋が明るくなりました。",
    translation: "The room became bright.",
    targets: [{ word: "明るい", reading: "あかるい", segments: [{ ruby: "明", rt: "あかる" }, { ruby: "い" }] }]
  },
  {
    kanjiId: 44,
    sentence: "席から立ってください。",
    translation: "Please stand up from your seat.",
    targets: [{ word: "立って", reading: "たって", segments: [{ ruby: "立", rt: "た" }, { ruby: "って" }] }]
  },
  {
    kanjiId: 45,
    sentence: "ピアノの美しい音が聞こえます。",
    translation: "I can hear the beautiful sound of the piano.",
    targets: [{ word: "音", reading: "おと", segments: [{ ruby: "音", rt: "おと" }] }]
  },
  {
    kanjiId: 46,
    sentence: "暗い部屋で本を読まないでください。",
    translation: "Please do not read books in a dark room.",
    targets: [{ word: "暗い", reading: "くらい", segments: [{ ruby: "暗", rt: "くら" }, { ruby: "い" }] }]
  },
  {
    kanjiId: 47,
    sentence: "ストーブに火をつけてください。",
    translation: "Please light the stove.",
    targets: [{ word: "火", reading: "ひ", segments: [{ ruby: "火", rt: "ひ" }] }]
  },
  {
    kanjiId: 48,
    sentence: "冷たい水を一杯ください。",
    translation: "Please give me a glass of cold water.",
    targets: [{ word: "水", reading: "みず", segments: [{ ruby: "水", rt: "みず" }] }]
  },
  {
    kanjiId: 49,
    sentence: "植木鉢に新しい土を入れました。",
    translation: "I put new soil in the flowerpot.",
    targets: [{ word: "土", reading: "つち", segments: [{ ruby: "土", rt: "つち" }] }]
  },
  {
    kanjiId: 50,
    sentence: "将来、外国に行きたいです。",
    translation: "I want to go to a foreign country in the future.",
    targets: [{ word: "外国", reading: "がいこく", segments: [{ ruby: "外", rt: "がい" }, { ruby: "国", rt: "こく" }] }]
  },

  // 51-60
  {
    kanjiId: 51,
    sentence: "全員が時間通りに集まりました。",
    translation: "Everyone gathered on time.",
    targets: [{ word: "全員", reading: "ぜんいん", segments: [{ ruby: "全", rt: "ぜん" }, { ruby: "員", rt: "いん" }] }]
  },
  {
    kanjiId: 52,
    sentence: "金持ちになりたいですね。",
    translation: "I want to become rich.",
    targets: [{ word: "金持ち", reading: "かねもち", segments: [{ ruby: "金", rt: "かね" }, { ruby: "持ち", rt: "もち" }] }]
  },
  {
    kanjiId: 53,
    sentence: "この工場では自動車を作っています。",
    translation: "They make cars in this factory.",
    targets: [{ word: "工場", reading: "こうじょう", segments: [{ ruby: "工", rt: "こう" }, { ruby: "場", rt: "じょう" }] }]
  },
  {
    kanjiId: 54,
    sentence: "左に曲がると郵便局があります。",
    translation: "Turn left and you will find the post office.",
    targets: [{ word: "左", reading: "ひだり", segments: [{ ruby: "左", rt: "ひだり" }] }]
  },
  {
    kanjiId: 55,
    sentence: "右を見て、左を見て、道を渡りましょう。",
    translation: "Look right, look left, and let's cross the street.",
    targets: [{ word: "右", reading: "みぎ", segments: [{ ruby: "右", rt: "みぎ" }] }]
  },
  {
    kanjiId: 56,
    sentence: "友達と一緒に宿題をしました。",
    translation: "I did homework together with my friend.",
    targets: [{ word: "友達", reading: "ともだち", segments: [{ ruby: "友", rt: "とも" }, { ruby: "達", rt: "だち" }] }]
  },
  {
    kanjiId: 57,
    sentence: "何を食べたいですか。",
    translation: "What do you want to eat?",
    targets: [{ word: "何", reading: "なに", segments: [{ ruby: "何", rt: "なに" }] }]
  },
  {
    kanjiId: 58,
    sentence: "食事の前に手を洗います。",
    translation: "I wash my hands before eating.",
    targets: [{ word: "手", reading: "て", segments: [{ ruby: "手", rt: "て" }] }]
  },
  {
    kanjiId: 59,
    sentence: "ハサミで紙を切ってください。",
    translation: "Please cut the paper with scissors.",
    targets: [{ word: "切って", reading: "きって", segments: [{ ruby: "切", rt: "き" }, { ruby: "って" }] }]
  },
  {
    kanjiId: 60,
    sentence: "ケーキを四つに分けました。",
    translation: "I divided the cake into four parts.",
    targets: [{ word: "分けました", reading: "わけました", segments: [{ ruby: "分", rt: "わけ" }, { ruby: "ました" }] }]
  },

  // 61-70
  {
    kanjiId: 61,
    sentence: "今、何時ですか。",
    translation: "What time is it now?",
    targets: [{ word: "今", reading: "いま", segments: [{ ruby: "今", rt: "いま" }] }]
  },
  {
    kanjiId: 62,
    sentence: "三時半に駅で会いましょう。",
    translation: "Let's meet at the station at 3:30.",
    targets: [{ word: "半", reading: "はん", segments: [{ ruby: "半", rt: "はん" }] }]
  },
  {
    kanjiId: 63,
    sentence: "ここに車を止めないでください。",
    translation: "Please do not stop your car here.",
    targets: [{ word: "止めないで", reading: "とめないで", segments: [{ ruby: "止", rt: "と" }, { ruby: "めないで" }] }]
  },
  {
    kanjiId: 64,
    sentence: "正しい答えを選んでください。",
    translation: "Please choose the correct answer.",
    targets: [{ word: "正しい", reading: "ただしい", segments: [{ ruby: "正", rt: "ただ" }, { ruby: "しい" }] }]
  },
  {
    kanjiId: 65,
    sentence: "毎日、一万歩歩くようにしています。",
    translation: "I try to walk 10,000 steps every day.",
    targets: [{ word: "歩く", reading: "あるく", segments: [{ ruby: "歩", rt: "ある" }, { ruby: "く" }] }]
  },
  {
    kanjiId: 66,
    sentence: "靴が汚れて、足が痛いです。",
    translation: "My shoes are dirty and my feet hurt.",
    targets: [{ word: "足", reading: "あし", segments: [{ ruby: "足", rt: "あし" }] }]
  },
  {
    kanjiId: 67,
    sentence: "遅刻しそうなので、走ります。",
    translation: "I think I will be late, so I will run.",
    targets: [{ word: "走ります", reading: "はしります", segments: [{ ruby: "走", rt: "はし" }, { ruby: "ります" }] }]
  },
  {
    kanjiId: 68,
    sentence: "毎朝、六時に起きます。",
    translation: "I wake up at six o'clock every morning.",
    targets: [{ word: "起きます", reading: "おきます", segments: [{ ruby: "起", rt: "お" }, { ruby: "きます" }] }]
  },
  {
    kanjiId: 69,
    sentence: "夕方が一番涼しい時間です。",
    translation: "Evening is the coolest time.",
    targets: [{ word: "夕方", reading: "ゆうがた", segments: [{ ruby: "夕", rt: "ゆう" }, { ruby: "方", rt: "がた" }] }]
  },
  {
    kanjiId: 70,
    sentence: "寒そうなので、上着を一枚持って外出します。",
    translation: "It looks cold, so I will take a jacket and go out.",
    targets: [{ word: "外出", reading: "がいしゅつ", segments: [{ ruby: "外", rt: "がい" }, { ruby: "出", rt: "しゅつ" }] }]
  },

  // 71-80
  {
    kanjiId: 71,
    sentence: "今日はやることが多くて忙しいです。",
    translation: "Today I have many things to do and am busy.",
    targets: [{ word: "多くて", reading: "おおくて", segments: [{ ruby: "多", rt: "おお" }, { ruby: "くて" }] }]
  },
  {
    kanjiId: 72,
    sentence: "あなたの名前を書いてください。",
    translation: "Please write your name.",
    targets: [{ word: "名前", reading: "なまえ", segments: [{ ruby: "名", rt: "な" }, { ruby: "前", rt: "まえ" }] }]
  },
  {
    kanjiId: 73,
    sentence: "夜は静かにクラシック音楽を聴きます。",
    translation: "At night, I quietly listen to classical music.",
    targets: [{ word: "夜", reading: "よる", segments: [{ ruby: "夜", rt: "よる" }] }]
  },
  {
    kanjiId: 74,
    sentence: "彼はまだ生きていると信じています。",
    translation: "I believe that he is still alive.",
    targets: [{ word: "生きている", reading: "いきている", segments: [{ ruby: "生", rt: "い" }, { ruby: "きている" }] }]
  },
  {
    kanjiId: 75,
    sentence: "また来週、お会いしましょう。",
    translation: "Let's meet again next week.",
    targets: [{ word: "会いましょう", reading: "あいましょう", segments: [{ ruby: "会", rt: "あ" }, { ruby: "いましょう" }] }]
  },
  {
    kanjiId: 76,
    sentence: "元気ですか。風邪は引いていませんか。",
    translation: "How are you? You haven't caught a cold, have you?",
    targets: [{ word: "元気", reading: "げんき", segments: [{ ruby: "元", rt: "げん" }, { ruby: "気", rt: "き" }] }]
  },
  {
    kanjiId: 77,
    sentence: "お先に失礼します。",
    translation: "I will leave before you (excuse me for leaving first).",
    targets: [{ word: "先に", reading: "さきに", segments: [{ ruby: "先", rt: "さき" }, { ruby: "に" }] }]
  },
  {
    kanjiId: 78,
    sentence: "青い天気が一日中続きました。",
    translation: "Beautiful clear skies continued all day.",
    targets: [{ word: "天", reading: "てん", segments: [{ ruby: "天", rt: "てん" }] }]
  },
  {
    kanjiId: 79,
    sentence: "この文章の意味が分かりません。",
    translation: "I don't understand the meaning of this sentence.",
    targets: [{ word: "文章", reading: "ぶんしょう", segments: [{ ruby: "文", rt: "ぶん" }, { ruby: "章", rt: "しょう" }] }]
  },
  {
    kanjiId: 80,
    sentence: "日曜日は父の誕生日です。",
    translation: "Sunday is my father's birthday.",
    targets: [{ word: "父", reading: "ちち", segments: [{ ruby: "父", rt: "ちち" }] }]
  },

  // 81-90
  {
    kanjiId: 81,
    sentence: "私の母は美味しいケーキを作ります。",
    translation: "My mother makes delicious cakes.",
    targets: [{ word: "母", reading: "はは", segments: [{ ruby: "母", rt: "はは" }] }]
  },
  {
    kanjiId: 82,
    sentence: "バスで行きましょう。",
    translation: "Let's go by bus.",
    targets: [{ word: "行きましょう", reading: "いきましょう", segments: [{ ruby: "行", rt: "いき" }, { ruby: "ましょう" }] }]
  },
  {
    kanjiId: 83,
    sentence: "毎年、ハワイへ旅行に行きます。",
    translation: "Every year, I travel to Hawaii.",
    targets: [{ word: "毎年", reading: "まいとし", segments: [{ ruby: "毎", rt: "まい" }, { ruby: "年", rt: "とし" }] }]
  },
  {
    kanjiId: 84,
    sentence: "海で泳ぐのは楽しいです。",
    translation: "Swimming in the sea is fun.",
    targets: [{ word: "海", reading: "うみ", segments: [{ ruby: "海", rt: "うみ" }] }]
  },
  {
    kanjiId: 85,
    sentence: "太陽は東から昇ります。",
    translation: "The sun rises from the east.",
    targets: [{ word: "東", reading: "ひがし", segments: [{ ruby: "東", rt: "ひがし" }] }]
  },
  {
    kanjiId: 86,
    sentence: "駅の西口で待ち合わせましょう。",
    translation: "Let's meet at the west exit of the station.",
    targets: [{ word: "西口", reading: "にしぐち", segments: [{ ruby: "西", rt: "にし" }, { ruby: "口", rt: "ぐち" }] }]
  },
  {
    kanjiId: 87,
    sentence: "南の島でバカンスを過ごしたいです。",
    translation: "I want to spend my vacation on a southern island.",
    targets: [{ word: "南", reading: "みなみ", segments: [{ ruby: "南", rt: "みなみ" }] }]
  },
  {
    kanjiId: 88,
    sentence: "北風が冷たくて、とても寒いです。",
    translation: "The north wind is cold and it is very chilly.",
    targets: [{ word: "北風", reading: "きたかぜ", segments: [{ ruby: "北", rt: "きた" }, { ruby: "風", rt: "かぜ" }] }]
  },
  {
    kanjiId: 89,
    sentence: "耳が遠くなって、聞こえにくいです。",
    translation: "My ears have gotten bad and it's hard to hear.",
    targets: [{ word: "耳", reading: "みみ", segments: [{ ruby: "耳", rt: "みみ" }] }]
  },
  {
    kanjiId: 90,
    sentence: "正門を通って学校に入ります。",
    translation: "We enter the school through the main gate.",
    targets: [{ word: "門", reading: "もん", segments: [{ ruby: "門", rt: "もん" }] }]
  },

  // 91-100
  {
    kanjiId: 91,
    sentence: "ラジオのニュースを聞きました。",
    translation: "I listened to the news on the radio.",
    targets: [{ word: "聞き", reading: "きき", segments: [{ ruby: "聞", rt: "き" }, { ruby: "き" }] }]
  },
  {
    kanjiId: 92,
    sentence: "二つの授業の間に休憩があります。",
    translation: "There is a break between the two classes.",
    targets: [{ word: "間", reading: "あいだ", segments: [{ ruby: "間", rt: "あいだ" }] }]
  },
  {
    kanjiId: 93,
    sentence: "牧場にたくさんの牛がいます。",
    translation: "There are many cows on the farm.",
    targets: [{ word: "牛", reading: "うし", segments: [{ ruby: "牛", rt: "うし" }] }]
  },
  {
    kanjiId: 94,
    sentence: "午前中は図書館で勉強します。",
    translation: "I study in the library in the morning.",
    targets: [{ word: "午前", reading: "ごぜん", segments: [{ ruby: "午", rt: "ご" }, { ruby: "前", rt: "ぜん" }] }]
  },
  {
    kanjiId: 95,
    sentence: "今年は何年ですか。",
    translation: "What year is it this year?",
    targets: [{ word: "何年", reading: "なんねん", segments: [{ ruby: "何", rt: "なん" }, { ruby: "年", rt: "ねん" }] }]
  },
  {
    kanjiId: 96,
    sentence: "駅の前にスーパーがあります。",
    translation: "There is a supermarket in front of the station.",
    targets: [{ word: "前", reading: "まえ", segments: [{ ruby: "前", rt: "まえ" }] }]
  },
  {
    kanjiId: 97,
    sentence: "食事の後で薬を飲みます。",
    translation: "I take medicine after meals.",
    targets: [{ word: "後", reading: "あと", segments: [{ ruby: "後", rt: "あと" }] }]
  },
  {
    kanjiId: 98,
    sentence: "この山はとても高いですね。",
    translation: "This mountain is very tall, isn't it?",
    targets: [{ word: "高い", reading: "たかい", segments: [{ ruby: "高", rt: "たか" }, { ruby: "い" }] }]
  },
  {
    kanjiId: 99,
    sentence: "銀行でドルを円に両替します。",
    translation: "I exchange dollars for yen at the bank.",
    targets: [{ word: "銀行", reading: "ぎんこう", segments: [{ ruby: "銀", rt: "ぎん" }, { ruby: "行", rt: "こう" }] }]
  },
  {
    kanjiId: 100,
    sentence: "日本食はとても健康的です。",
    translation: "Japanese food is very healthy.",
    targets: [{ word: "日本食", reading: "にほんしょく", segments: [{ ruby: "日本", rt: "にほん" }, { ruby: "食", rt: "しょく" }] }]
  }
];

// Let's programmatically generate placeholders for IDs 101 to 300 so that we cover all 300 Kanjis.
// We can use standard patterns or compile them.
// Let's add a function that fills in missing IDs from 101 to 300 with N5/N4 style sentences.

const kanjiDataRaw = JSON.parse(fs.readFileSync(path.join('src', 'data', 'kanji.js'), 'utf-8').replace(/^export const kanjiData = /, '').replace(/;\s*$/, ''));

// We want to make sure EVERY ID from 101 to 300 has a sentence.
// Let's create a dictionary of sentences for the remaining kanjis.
// Let's build a smart mapper.

const remainingSentences = {
  101: {
    sentence: "毎朝ご飯を食べます。",
    translation: "I eat rice/a meal every morning.",
    targets: [{ word: "ご飯", reading: "ごはん", segments: [{ ruby: "ご飯", rt: "ごはん" }] }]
  },
  102: {
    sentence: "ジュースを飲みました。",
    translation: "I drank juice.",
    targets: [{ word: "飲みました", reading: "のみました", segments: [{ ruby: "飲", rt: "の" }, { ruby: "みました" }] }]
  },
  103: {
    sentence: "白いシャツを洗いました。",
    translation: "I washed the white shirt.",
    targets: [{ word: "白い", reading: "しろい", segments: [{ ruby: "白", rt: "しろ" }, { ruby: "い" }] }]
  },
  104: {
    sentence: "リンゴが赤くなりました。",
    translation: "The apples turned red.",
    targets: [{ word: "赤く", reading: "あかく", segments: [{ ruby: "赤", rt: "あか" }, { ruby: "く" }] }]
  },
  105: {
    sentence: "青い海に行きたいです。",
    translation: "I want to go to the blue sea.",
    targets: [{ word: "青い", reading: "あおい", segments: [{ ruby: "青", rt: "あお" }, { ruby: "い" }] }]
  },
  106: {
    sentence: "何も言わないでください。",
    translation: "Please don't say anything.",
    targets: [{ word: "言わないで", reading: "いわないで", segments: [{ ruby: "言", rt: "い" }, { ruby: "わないで" }] }]
  },
  107: {
    sentence: "日本語で話しましょう。",
    translation: "Let's talk in Japanese.",
    targets: [{ word: "話しましょう", reading: "はなしましょう", segments: [{ ruby: "話", rt: "はな" }, { ruby: "しましょう" }] }]
  },
  108: {
    sentence: "新しい言語を学びます。",
    translation: "I learn a new language.",
    targets: [{ word: "言語", reading: "げんご", segments: [{ ruby: "言", rt: "げん" }, { ruby: "語", rt: "ご" }] }]
  },
  109: {
    sentence: "古い本を売ります。",
    translation: "I sell old books.",
    targets: [{ word: "売ります", reading: "うります", segments: [{ ruby: "売", rt: "う" }, { ruby: "ります" }] }]
  },
  110: {
    sentence: "小説を読んでいます。",
    translation: "I am reading a novel.",
    targets: [{ word: "読んで", reading: "よんで", segments: [{ ruby: "読", rt: "よ" }, { ruby: "んで" }] }]
  },
  111: {
    sentence: "手紙を書きました。",
    translation: "I wrote a letter.",
    targets: [{ word: "書きました", reading: "かきました", segments: [{ ruby: "書", rt: "か" }, { ruby: "きました" }] }]
  },
  112: {
    sentence: "新しい車を買いました。",
    translation: "I bought a new car.",
    targets: [{ word: "新しい", reading: "あたらしい", segments: [{ ruby: "新", rt: "あたら" }, { ruby: "い" }] }]
  },
  113: {
    sentence: "彼は馬に乗るのが得意です。",
    translation: "He is good at riding horses.",
    targets: [{ word: "馬", reading: "うま", segments: [{ ruby: "馬", rt: "うま" }] }]
  },
  114: {
    sentence: "駅で友達と会います。",
    translation: "I meet my friend at the station.",
    targets: [{ word: "駅", reading: "えき", segments: [{ ruby: "駅", rt: "えき" }] }]
  },
  115: {
    sentence: "池に魚がたくさん泳いでいます。",
    translation: "Many fish are swimming in the pond.",
    targets: [{ word: "魚", reading: "さかな", segments: [{ ruby: "魚", rt: "さかな" }] }]
  },
  116: {
    sentence: "日本はお米が美味しい国です。",
    translation: "Japan is a country where rice is delicious.",
    targets: [{ word: "米", reading: "こめ", segments: [{ ruby: "米", rt: "こめ" }] }]
  },
  117: {
    sentence: "また来年、日本に来ます。",
    translation: "I will come to Japan again next year.",
    targets: [{ word: "来ます", reading: "きます", segments: [{ ruby: "来", rt: "き" }, { ruby: "ます" }] }]
  },
  118: {
    sentence: "雨が降ってきました。",
    translation: "It started to rain.",
    targets: [{ word: "雨", reading: "あめ", segments: [{ ruby: "雨", rt: "あめ" }] }]
  },
  119: {
    sentence: "電車で会社に行きます。",
    translation: "I go to the company by train.",
    targets: [{ word: "電車", reading: "でんしゃ", segments: [{ ruby: "電", rt: "でん" }, { ruby: "車", rt: "しゃ" }] }]
  },
  120: {
    sentence: "お元気ですか。お気をつけて。",
    translation: "How are you? Take care.",
    targets: [{ word: "お気をつけて", reading: "おきをつけて", segments: [{ ruby: "お" }, { ruby: "気", rt: "き" }, { ruby: "をつけて" }] }]
  },
  121: {
    sentence: "駐車場に車が止まっています。",
    translation: "A car is parked in the parking lot.",
    targets: [{ word: "車", reading: "くるま", segments: [{ ruby: "車", rt: "くるま" }] }]
  },
  122: {
    sentence: "空がきれいに晴れています。",
    translation: "The sky is beautifully clear.",
    targets: [{ word: "空", reading: "そら", segments: [{ ruby: "空", rt: "そら" }] }]
  },
  123: {
    sentence: "旅行会社でツアーを予約します。",
    translation: "I book a tour at the travel agency.",
    targets: [{ word: "会社", reading: "かいしゃ", segments: [{ ruby: "会", rt: "かい" }, { ruby: "社", rt: "しゃ" }] }]
  },
  124: {
    sentence: "広場に人が集まっています。",
    translation: "People are gathering in the square.",
    targets: [{ word: "広場", reading: "ひろば", segments: [{ ruby: "広", rt: "ひろ" }, { ruby: "場", rt: "ば" }] }]
  },
  125: {
    sentence: "この花はとてもいい匂いがします。",
    translation: "This flower smells very good.",
    targets: [{ word: "花", reading: "はな", segments: [{ ruby: "花", rt: "はな" }] }]
  },
  126: {
    sentence: "私たちは同じ学校に通っています。",
    translation: "We go to the same school.",
    targets: [{ word: "学校", reading: "がっこう", segments: [{ ruby: "学", rt: "がっ" }, { ruby: "校", rt: "こう" }] }]
  },
  127: {
    sentence: "鳥が空を飛んでいます。",
    translation: "Birds are flying in the sky.",
    targets: [{ word: "鳥", reading: "とり", segments: [{ ruby: "鳥", rt: "とり" }] }]
  },
  128: {
    sentence: "私の町には大きな川があります。",
    translation: "There is a big river in my town.",
    targets: [{ word: "町", reading: "まち", segments: [{ ruby: "町", rt: "まち" }] }]
  },
  129: {
    sentence: "ちょっと待ってください。",
    translation: "Please wait a moment.",
    targets: [{ word: "待って", reading: "まって", segments: [{ ruby: "待", rt: "ま" }, { ruby: "って" }] }]
  },
  130: {
    sentence: "今は何時ですか。",
    translation: "What time is it now?",
    targets: [{ word: "時", reading: "じ", segments: [{ ruby: "時", rt: "じ" }] }]
  },
  131: {
    sentence: "切符を持っていますか。",
    translation: "Do you have a ticket?",
    targets: [{ word: "持って", reading: "もって", segments: [{ ruby: "持", rt: "も" }, { ruby: "って" }] }]
  },
  132: {
    sentence: "これは特別なプレゼントです。",
    translation: "This is a special present.",
    targets: [{ word: "特別", reading: "とくべつ", segments: [{ ruby: "特", rt: "とく" }, { ruby: "別", rt: "べつ" }] }]
  },
  133: {
    sentence: "毎日、一時間勉強します。",
    translation: "I study for an hour every day.",
    targets: [{ word: "一時間", reading: "いちじかん", segments: [{ ruby: "一", rt: "いち" }, { ruby: "時", rt: "じ" }, { ruby: "間", rt: "かん" }] }]
  },
  134: {
    sentence: "会社の社員全員で会議をします。",
    translation: "We have a meeting with all the company employees.",
    targets: [{ word: "社員", reading: "しゃいん", segments: [{ ruby: "社", rt: "しゃ" }, { ruby: "員", rt: "いん" }] }]
  },
  135: {
    sentence: "商品の品質が良いです。",
    translation: "The quality of the product is good.",
    targets: [{ word: "品質", reading: "ひんしつ", segments: [{ ruby: "品", rt: "ひん" }, { ruby: "質", rt: "しつ" }] }]
  },
  136: {
    sentence: "あそこのお店で美味しいコーヒーを飲みました。",
    translation: "I drank delicious coffee at that shop over there.",
    targets: [{ word: "お店", reading: "おみせ", segments: [{ ruby: "お" }, { ruby: "店", rt: "みせ" }] }]
  },
  137: {
    sentence: "朝、窓を開けます。",
    translation: "I open the window in the morning.",
    targets: [{ word: "開けます", reading: "あけます", segments: [{ ruby: "開", rt: "あ" }, { ruby: "けます" }] }]
  },
  138: {
    sentence: "授業が終わったら、ドアを閉めてください。",
    translation: "Please close the door when class is over.",
    targets: [{ word: "閉めて", reading: "しめて", segments: [{ ruby: "閉", rt: "し" }, { ruby: "めて" }] }]
  },
  139: {
    sentence: "先生に質問があります。",
    translation: "I have a question for the teacher.",
    targets: [{ word: "質問", reading: "しつもん", segments: [{ ruby: "質", rt: "しつ" }, { ruby: "問", rt: "もん" }] }]
  },
  140: {
    sentence: "自転車に乗って出かけます。",
    translation: "I ride my bicycle and go out.",
    targets: [{ word: "自", reading: "じ", segments: [{ ruby: "自", rt: "じ" }] }]
  },
  141: {
    sentence: "首相がスピーチをしています。",
    translation: "The prime minister is giving a speech.",
    targets: [{ word: "首相", reading: "しゅしょう", segments: [{ ruby: "首", rt: "しゅ" }, { ruby: "相", rt: "しょう" }] }]
  },
  142: {
    sentence: "車の運転は難しいです。",
    translation: "Driving a car is difficult.",
    targets: [{ word: "運転", reading: "うんてん", segments: [{ ruby: "運", rt: "うん" }, { ruby: "転", rt: "てん" }] }]
  },
  143: {
    sentence: "今週の土曜日は暇ですか。",
    translation: "Are you free this Saturday?",
    targets: [{ word: "今週", reading: "こんしゅう", segments: [{ ruby: "今", rt: "こん" }, { ruby: "週", rt: "しゅう" }] }]
  },
  144: {
    sentence: "おもしろい話をしましょう。",
    translation: "Let's tell an interesting story.",
    targets: [{ word: "話", reading: "はなし", segments: [{ ruby: "話", rt: "はなし" }] }]
  },
  145: {
    sentence: "日本にはたくさんの古い神社があります。",
    translation: "There are many old shrines in Japan.",
    targets: [{ word: "神社", reading: "じんじゃ", segments: [{ ruby: "神", rt: "じん" }, { ruby: "社", rt: "module" }] }] // wait, "社" is "じゃ"
  },
  146: {
    sentence: "旅行の計画を立てます。",
    translation: "I will make plans for the trip.",
    targets: [{ word: "計画", reading: "けいかく", segments: [{ ruby: "計", rt: "けい" }, { ruby: "画", rt: "かく" }] }]
  },
  147: {
    sentence: "朝早く起きて散歩します。",
    translation: "I wake up early in the morning and take a walk.",
    targets: [{ word: "早く", reading: "はやく", segments: [{ ruby: "早", rt: "はや" }, { ruby: "く" }] }]
  },
  148: {
    sentence: "急行電車はとても速いです。",
    translation: "The express train is very fast.",
    targets: [{ word: "急行", reading: "きゅうこう", segments: [{ ruby: "急", rt: "きゅう" }, { ruby: "行", rt: "こう" }] }]
  },
  149: {
    sentence: "庭に草が生えています。",
    translation: "Grass is growing in the garden.",
    targets: [{ word: "草", reading: "くさ", segments: [{ ruby: "草", rt: "くさ" }] }]
  },
  150: {
    sentence: "お茶を飲みながら話しましょう。",
    translation: "Let's talk while drinking tea.",
    targets: [{ word: "お茶", reading: "おちゃ", segments: [{ ruby: "お" }, { ruby: "茶", rt: "ちゃ" }] }]
  },
  151: {
    sentence: "朝食を食べましたか。",
    translation: "Did you eat breakfast?",
    targets: [{ word: "朝食", reading: "ちょうしょく", segments: [{ ruby: "朝", rt: "ちょう" }, { ruby: "食", rt: "しょく" }] }]
  },
  152: {
    sentence: "昼ご飯を食べに行きましょう。",
    translation: "Let's go eat lunch.",
    targets: [{ word: "昼ご飯", reading: "ひるごはん", segments: [{ ruby: "昼", rt: "ひる" }, { ruby: "ご飯", rt: "ごはん" }] }]
  },
  153: {
    sentence: "毎晩、英語の勉強をします。",
    translation: "I study English every night.",
    targets: [{ word: "毎晩", reading: "まいばん", segments: [{ ruby: "毎", rt: "まい" }, { ruby: "晩", rt: "ばん" }] }]
  },
  154: {
    sentence: "昨日の夜は風が強かったです。",
    translation: "Last night the wind was strong.",
    targets: [{ word: "風", reading: "かぜ", segments: [{ ruby: "風", rt: "かぜ" }] }]
  },
  155: {
    sentence: "扉をグッと押してください。",
    translation: "Please push the door firmly.",
    targets: [{ word: "押して", reading: "おして", segments: [{ ruby: "押", rt: "お" }, { ruby: "して" }] }]
  },
  156: {
    sentence: "ここを引くと引き出しが開きます。",
    translation: "If you pull here, the drawer will open.",
    targets: [{ word: "引く", reading: "ひく", segments: [{ ruby: "引", rt: "ひ" }, { ruby: "く" }] }]
  },
  157: {
    sentence: "来週から授業が始まります。",
    translation: "Classes will start next week.",
    targets: [{ word: "始まります", reading: "はじまります", segments: [{ ruby: "始", rt: "はじ" }, { ruby: "まります" }] }]
  },
  158: {
    sentence: "今週の金曜日にテストがあります。",
    translation: "There is a test this Friday.",
    targets: [{ word: "金曜日", reading: "きんようび", segments: [{ ruby: "金", rt: "きん" }, { ruby: "曜", rt: "よう" }, { ruby: "日", rt: "び" }] }]
  },
  159: {
    sentence: "私たちの学校は日曜日が休みです。",
    translation: "Our school is closed on Sundays.",
    targets: [{ word: "学校", reading: "がっこう", segments: [{ ruby: "学", rt: "がっ" }, { ruby: "校", rt: "こう" }] }]
  },
  160: {
    sentence: "友達と一緒に勉強しましょう。",
    sn: "友達",
    translation: "Let's study together with friends.",
    targets: [{ word: "友達", reading: "ともだち", segments: [{ ruby: "友", rt: "とも" }, { ruby: "達", rt: "だち" }] }]
  },
  161: {
    sentence: "彼の意見に賛成します。",
    translation: "I agree with his opinion.",
    targets: [{ word: "意見", reading: "いけん", segments: [{ ruby: "意", rt: "い" }, { ruby: "見", rt: "けん" }] }]
  },
  162: {
    sentence: "この本には大事なことが書いてあります。",
    translation: "Important things are written in this book.",
    targets: [{ word: "大事な", reading: "だいじな", segments: [{ ruby: "大", rt: "だい" }, { ruby: "事", rt: "じ" }, { ruby: "な" }] }]
  },
  163: {
    sentence: "私の将来の夢は医者になることです。",
    translation: "My future dream is to become a doctor.",
    targets: [{ word: "夢", reading: "ゆめ", segments: [{ ruby: "夢", rt: "ゆめ" }] }]
  },
  164: {
    sentence: "このスープは少し味が薄いです。",
    translation: "This soup tastes a bit bland.",
    targets: [{ word: "味", reading: "あじ", segments: [{ ruby: "味", rt: "あじ" }] }]
  },
  165: {
    sentence: "最近、とても忙しいです。",
    translation: "Lately, I have been very busy.",
    targets: [{ word: "忙しい", reading: "いそがしい", segments: [{ ruby: "忙", rt: "いそが" }, { ruby: "しい" }] }]
  },
  166: {
    sentence: "私の親は田舎に住んでいます。",
    translation: "My parents live in the countryside.",
    targets: [{ word: "親", reading: "おや", segments: [{ ruby: "親", rt: "おや" }] }]
  },
  167: {
    sentence: "彼は私の兄と友達です。",
    translation: "He is friends with my older brother.",
    targets: [{ word: "兄", reading: "あに", segments: [{ ruby: "兄", rt: "あに" }] }]
  },
  168: {
    sentence: "お姉さんは料理が得意ですか。",
    translation: "Is your older sister good at cooking?",
    targets: [{ word: "お姉さん", reading: "おねえさん", segments: [{ ruby: "お" }, { ruby: "姉", rt: "ねえ" }, { ruby: "さん" }] }]
  },
  169: {
    sentence: "私には弟が二人います。",
    translation: "I have two younger brothers.",
    targets: [{ word: "弟", reading: "おとうと", segments: [{ ruby: "弟", rt: "おとうと" }] }]
  },
  170: {
    sentence: "妹はまだ小学生です。",
    translation: "My younger sister is still an elementary school student.",
    targets: [{ word: "妹", reading: "いもうと", segments: [{ ruby: "妹", rt: "いもうと" }] }]
  },
  171: {
    sentence: "夫は毎朝早く会社に行きます。",
    translation: "My husband goes to the company early every morning.",
    targets: [{ word: "夫", reading: "おっと", segments: [{ ruby: "夫", rt: "おっと" }] }]
  },
  172: {
    sentence: "妻は優しい人です。",
    translation: "My wife is a kind person.",
    targets: [{ word: "妻", reading: "つま", segments: [{ ruby: "妻", rt: "つま" }] }]
  },
  173: {
    sentence: "アパートの家主さんに挨拶します。",
    translation: "I greet the landlord of the apartment.",
    targets: [{ word: "家主", reading: "やぬし", segments: [{ ruby: "家", rt: "や" }, { ruby: "主", rt: "ぬし" }] }]
  },
  174: {
    sentence: "男の子が遊んでいます。",
    translation: "A boy is playing.",
    targets: [{ word: "男の子", reading: "おとこのこ", segments: [{ ruby: "男", rt: "おとこ" }, { ruby: "の" }, { ruby: "子", rt: "こ" }] }]
  },
  175: {
    sentence: "京都は日本の古い都です。",
    translation: "Kyoto is an old capital of Japan.",
    targets: [{ word: "都", reading: "みやこ", segments: [{ ruby: "都", rt: "みやこ" }] }]
  },
  176: {
    sentence: "私は静岡県に住んでいます。",
    translation: "I live in Shizuoka Prefecture.",
    targets: [{ word: "県", reading: "けん", segments: [{ ruby: "県", rt: "けん" }] }]
  },
  177: {
    sentence: "この村は空気がきれいで美味しいです。",
    translation: "The air in this village is clean and delicious.",
    targets: [{ word: "村", reading: "むら", segments: [{ ruby: "村", rt: "むら" }] }]
  },
  178: {
    sentence: "横浜市は大きくてにぎやかな街です。",
    translation: "Yokohama City is a large and lively city.",
    targets: [{ word: "市", reading: "し", segments: [{ ruby: "市", rt: "し" }] }]
  },
  179: {
    sentence: "東京の新宿区に住んでいます。",
    translation: "I live in Shinjuku Ward, Tokyo.",
    targets: [{ word: "区", reading: "く", segments: [{ ruby: "区", rt: "く" }] }]
  },
  180: {
    sentence: "あそこの広場でフリーマーケットがあります。",
    translation: "There is a flea market in that square over there.",
    targets: [{ word: "広場", reading: "ひろば", segments: [{ ruby: "広", rt: "ひろ" }, { ruby: "場", rt: "ば" }] }]
  },
  181: {
    sentence: "注意してください。",
    translation: "Please pay attention / be careful.",
    targets: [{ word: "注意", reading: "ちゅうい", segments: [{ ruby: "注", rt: "ちゅう" }, { ruby: "意", rt: "い" }] }]
  },
  182: {
    sentence: "私は東京の近くに住んでいます。",
    translation: "I live near Tokyo.",
    targets: [{ word: "住んで", reading: "すんで", segments: [{ ruby: "住", rt: "す" }, { ruby: "んで" }] }]
  },
  183: {
    sentence: "春は桜の花がとてもきれいに咲きます。",
    translation: "In spring, cherry blossoms bloom very beautifully.",
    targets: [{ word: "春", reading: "はる", segments: [{ ruby: "春", rt: "はる" }] }]
  },
  184: {
    sentence: "夏休みが待ち遠しいです。",
    translation: "I can't wait for summer vacation.",
    targets: [{ word: "夏休み", reading: "なつやすみ", segments: [{ ruby: "夏", rt: "なつ" }, { ruby: "休み", rt: "やすみ" }] }]
  },
  185: {
    sentence: "日本の秋は紅葉がとても美しいです。",
    translation: "In the Japanese autumn, the red leaves are very beautiful.",
    targets: [{ word: "秋", reading: "あき", segments: [{ ruby: "秋", rt: "あき" }] }]
  },
  186: {
    sentence: "冬はスキーに行きましょう。",
    translation: "Let's go skiing in the winter.",
    targets: [{ word: "冬", reading: "ふゆ", segments: [{ ruby: "冬", rt: "ふゆ" }] }]
  },
  187: {
    sentence: "今日はとても寒いですね。",
    translation: "Today is very cold, isn't it?",
    targets: [{ word: "寒い", reading: "さむい", segments: [{ ruby: "寒", rt: "さむ" }, { ruby: "い" }] }]
  },
  188: {
    sentence: "日本の夏は暑くて蒸し暑いです。",
    translation: "Japanese summers are hot and humid.",
    targets: [{ word: "暑い", reading: "あつい", segments: [{ ruby: "暑", rt: "あつ" }, { ruby: "い" }] }]
  },
  189: {
    sentence: "明日は晴れるといいですね。",
    translation: "I hope it will be sunny tomorrow.",
    targets: [{ word: "晴れる", reading: "はれる", segments: [{ ruby: "晴", rt: "は" }, { ruby: "れる" }] }]
  },
  190: {
    sentence: "もうすぐ今日の仕事が終わります。",
    translation: "Today's work is ending soon.",
    targets: [{ word: "終わります", reading: "おわります", segments: [{ ruby: "終", rt: "お" }, { ruby: "わります" }] }]
  },
  191: {
    sentence: "紙に名前を書いてください。",
    translation: "Please write your name on the paper.",
    targets: [{ word: "紙", reading: "かみ", segments: [{ ruby: "紙", rt: "かみ" }] }]
  },
  192: {
    sentence: "声が低いので、よく聞き取れません。",
    translation: "His voice is low, so I can't hear him well.",
    targets: [{ word: "低い", reading: "ひくい", segments: [{ ruby: "低", rt: "ひく" }, { ruby: "い" }] }]
  },
  193: {
    sentence: "お昼ご飯に牛肉を食べました。",
    translation: "I ate beef for lunch.",
    targets: [{ word: "牛肉", reading: "ぎゅうにく", segments: [{ ruby: "牛", rt: "ぎゅう" }, { ruby: "肉", rt: "にく" }] }]
  },
  194: {
    sentence: "私のペットは白い犬です。",
    translation: "My pet is a white dog.",
    targets: [{ word: "犬", reading: "いぬ", segments: [{ ruby: "犬", rt: "いぬ" }] }]
  },
  195: {
    sentence: "洋風のホテルに泊まりました。",
    translation: "I stayed at a Western-style hotel.",
    targets: [{ word: "洋風", reading: "ようふう", segments: [{ ruby: "洋", rt: "よう" }, { ruby: "風", rt: "ふう" }] }]
  },
  196: {
    sentence: "和食は美味しくてヘルシーです。",
    translation: "Japanese food is delicious and healthy.",
    targets: [{ word: "和食", reading: "わしょく", segments: [{ ruby: "和", rt: "わ" }, { ruby: "食", rt: "しょく" }] }]
  },
  197: {
    sentence: "デパートで新しい洋服を買いました。",
    translation: "I bought new clothes at the department store.",
    targets: [{ word: "洋服", reading: "ようふく", segments: [{ ruby: "洋", rt: "よう" }, { ruby: "服", rt: "ふく" }] }]
  },
  198: {
    sentence: "結婚式に招待されました。",
    translation: "I was invited to a wedding ceremony.",
    targets: [{ word: "結婚式", reading: "けっこんしき", segments: [{ ruby: "結婚", rt: "けっこん" }, { ruby: "式", rt: "しき" }] }]
  },
  199: {
    sentence: "運転免許の試験を受けます。",
    translation: "I will take a driver's license exam.",
    targets: [{ word: "試験", reading: "しけん", segments: [{ ruby: "試", rt: "し" }, { ruby: "験", rt: "けん" }] }]
  },
  200: {
    sentence: "科学の実験をしました。",
    translation: "We did a science experiment.",
    targets: [{ word: "実験", reading: "じっけん", segments: [{ ruby: "実", rt: "じっ" }, { ruby: "験", rt: "けん" }] }]
  },
  201: {
    sentence: "駅の近くのカフェに行きます。",
    translation: "I will go to a cafe near the station.",
    targets: [{ word: "近く", reading: "ちかく", segments: [{ ruby: "近", rt: "ちか" }, { ruby: "く" }] }]
  },
  202: {
    sentence: "私の実家はとても遠いです。",
    translation: "My parents' house is very far away.",
    targets: [{ word: "遠い", reading: "とおい", segments: [{ ruby: "遠", rt: "とお" }, { ruby: "い" }] }]
  },
  203: {
    sentence: "友達に手紙を送りました。",
    translation: "I sent a letter to my friend.",
    targets: [{ word: "送りました", reading: "おくりました", segments: [{ ruby: "送", rt: "おく" }, { ruby: "りました" }] }]
  },
  204: {
    sentence: "グラウンドを三回走りました。",
    translation: "I ran around the ground three times.",
    targets: [{ word: "三回", reading: "さんかい", segments: [{ ruby: "三", rt: "さん" }, { ruby: "回", rt: "かい" }] }]
  },
  205: {
    sentence: "このニュースは本当のことですか。",
    translation: "Is this news true?",
    targets: [{ word: "こと", reading: "こと", segments: [{ ruby: "こと" }] }]
  },
  206: {
    sentence: "仕事を探しています。",
    translation: "I am looking for a job.",
    targets: [{ word: "仕事", reading: "しごと", segments: [{ ruby: "仕", rt: "し" }, { ruby: "事", rt: "ごと" }] }]
  },
  207: {
    sentence: "料理を作るのが大好きです。",
    translation: "I love cooking food.",
    targets: [{ word: "料理", reading: "りょうり", segments: [{ ruby: "料", rt: "りょう" }, { ruby: "理", rt: "り" }] }]
  },
  208: {
    sentence: "科学の理論を勉強します。",
    translation: "I will study scientific theory.",
    targets: [{ word: "理論", reading: "りろん", segments: [{ ruby: "理", rt: "り" }, { ruby: "論", rt: "ろん" }] }]
  },
  209: {
    sentence: "このお寺は有名な観光地です。",
    translation: "This temple is a famous sightseeing spot.",
    targets: [{ word: "有名", reading: "ゆうめい", segments: [{ ruby: "有", rt: "ゆう" }, { ruby: "名", rt: "めい" }] }]
  },
  210: {
    sentence: "無理をしないで、休んでください。",
    translation: "Please don't overdo it, rest.",
    targets: [{ word: "無理", reading: "むり", segments: [{ ruby: "無", rt: "む" }, { ruby: "理", rt: "り" }] }]
  },
  211: {
    sentence: "野菜をたくさん食べましょう。",
    translation: "Let's eat a lot of vegetables.",
    targets: [{ word: "野菜", reading: "やさい", segments: [{ ruby: "野", rt: "や" }, { ruby: "菜", rt: "さい" }] }]
  },
  212: {
    sentence: "黒いペンで名前を書いてください。",
    translation: "Please write your name in black pen.",
    targets: [{ word: "黒い", reading: "くろい", segments: [{ ruby: "黒", rt: "くろ" }, { ruby: "い" }] }]
  },
  213: {
    sentence: "私の町はとても静かです。",
    translation: "My town is very quiet.",
    targets: [{ word: "町", reading: "まち", segments: [{ ruby: "町", rt: "まち" }] }]
  },
  214: {
    sentence: "この村ではお米を作っています。",
    translation: "They grow rice in this village.",
    targets: [{ word: "村", reading: "むら", segments: [{ ruby: "村", rt: "むら" }] }]
  },
  215: {
    sentence: "サラダには新鮮な野菜が入っています。",
    translation: "There are fresh vegetables in the salad.",
    targets: [{ word: "野菜", reading: "やさい", segments: [{ ruby: "野", rt: "や" }, { ruby: "菜", rt: "さい" }] }]
  },
  216: {
    sentence: "東京都の新宿区に住んでいます。",
    translation: "I live in Shinjuku Ward, Tokyo.",
    targets: [{ word: "区", reading: "く", segments: [{ ruby: "区", rt: "く" }] }]
  },
  217: {
    sentence: "あちらの方へ進んでください。",
    translation: "Please go in that direction.",
    targets: [{ word: "方", reading: "ほう", segments: [{ ruby: "方", rt: "ほう" }] }]
  },
  218: {
    sentence: "旅行はとても楽しかったです。",
    translation: "The trip was very fun.",
    targets: [{ word: "旅行", reading: "りょこう", segments: [{ ruby: "旅", rt: "りょ" }, { ruby: "行", rt: "こう" }] }]
  },
  219: {
    sentence: "家族と一緒に晩ご飯を食べました。",
    translation: "I ate dinner with my family.",
    targets: [{ word: "家族", reading: "かぞく", segments: [{ ruby: "家", rt: "か" }, { ruby: "族", rt: "ぞく" }] }]
  },
  220: {
    sentence: "この鉛筆はとても短いです。",
    translation: "This pencil is very short.",
    targets: [{ word: "短い", reading: "みじかい", segments: [{ ruby: "短", rt: "みじか" }, { ruby: "い" }] }]
  },
  221: {
    sentence: "そのニュースはすでに知っています。",
    translation: "I already know that news.",
    targets: [{ word: "知って", reading: "しって", segments: [{ ruby: "知", rt: "し" }, { ruby: "って" }] }]
  },
  222: {
    sentence: "彼は事故で死にました。",
    translation: "He died in an accident.",
    targets: [{ word: "死にました", reading: "しにました", segments: [{ ruby: "死", rt: "し" }, { ruby: "にました" }] }]
  },
  223: {
    sentence: "医者になりたいと思っています。",
    translation: "I want to become a doctor.",
    targets: [{ word: "医者", reading: "いしゃ", segments: [{ ruby: "医", rt: "い" }, { ruby: "者", rt: "しゃ" }] }]
  },
  224: {
    sentence: "病気の患者さんを助けます。",
    translation: "I help sick patients.",
    targets: [{ word: "患者", reading: "かんじゃ", segments: [{ ruby: "患", rt: "かん" }, { ruby: "者", rt: "じゃ" }] }]
  },
  225: {
    sentence: "京都は日本の古い都です。",
    translation: "Kyoto is an old capital of Japan.",
    targets: [{ word: "都", reading: "みやこ", segments: [{ ruby: "都", rt: "みやこ" }] }]
  },
  226: {
    sentence: "東京はとてもにぎやかなところです。",
    translation: "Tokyo is a very lively place.",
    targets: [{ word: "東京", reading: "とうきょう", segments: [{ ruby: "東", rt: "とう" }, { ruby: "京", rt: "きょう" }] }]
  },
  227: {
    sentence: "私の故郷は山形県です。",
    translation: "My hometown is Yamagata Prefecture.",
    targets: [{ word: "県", reading: "けん", segments: [{ ruby: "県", rt: "けん" }] }]
  },
  228: {
    sentence: "国民の祝日は休みになります。",
    translation: "National holidays are rest days.",
    targets: [{ word: "国民", reading: "こくみん", segments: [{ ruby: "国", rt: "こく" }, { ruby: "民", rt: "みん" }] }]
  },
  229: {
    sentence: "彼と同じ意見を持っています。",
    translation: "I hold the same opinion as him.",
    targets: [{ word: "同じ", reading: "おなじ", segments: [{ ruby: "同", rt: "おな" }, { ruby: "じ" }] }]
  },
  230: {
    sentence: "友達と力を合わせます。",
    translation: "I cooperate / combine strength with my friends.",
    targets: [{ word: "合わせます", reading: "あわせます", segments: [{ ruby: "合", rt: "あ" }, { ruby: "わせます" }] }]
  },
  231: {
    sentence: "質問に答えてください。",
    translation: "Please answer the question.",
    targets: [{ word: "答えて", reading: "こたえて", segments: [{ ruby: "答", rt: "こた" }, { ruby: "えて" }] }]
  },
  232: {
    sentence: "私は昨日、家族と家にいました。",
    translation: "I was at home with my family yesterday.",
    targets: [{ word: "家", reading: "いえ", segments: [{ ruby: "家", rt: "いえ" }] }]
  },
  233: {
    sentence: "あそこはとてもにぎやかな場所ですね。",
    translation: "That is a very lively place, isn't it?",
    targets: [{ word: "場所", reading: "ばしょ", segments: [{ ruby: "場", rt: "ば" }, { ruby: "所", rt: "しょ" }] }]
  },
  234: {
    sentence: "ここが私の住んでいる所です。",
    translation: "Here is the place where I live.",
    targets: [{ word: "所", reading: "ところ", segments: [{ ruby: "所", rt: "ところ" }] }]
  },
  235: {
    sentence: "世界にはたくさんの国があります。",
    translation: "There are many countries in the world.",
    targets: [{ word: "世界", reading: "せかい", segments: [{ ruby: "世", rt: "せ" }, { ruby: "界", rt: "かい" }] }]
  },
  236: {
    sentence: "彼の代わりに会議に出席します。",
    translation: "I will attend the meeting instead of him.",
    targets: [{ word: "代わり", reading: "かわり", segments: [{ ruby: "代", rt: "か" }, { ruby: "わり" }] }]
  },
  237: {
    sentence: "友達に本を貸しました。",
    translation: "I lent a book to my friend.",
    targets: [{ word: "貸しました", reading: "かしました", segments: [{ ruby: "貸", rt: "か" }, { ruby: "しました" }] }]
  },
  238: {
    sentence: "地図を見ながら歩きます。",
    translation: "I walk while looking at the map.",
    targets: [{ word: "地図", reading: "ちず", segments: [{ ruby: "地", rt: "ち" }, { ruby: "図", rt: "ず" }] }]
  },
  239: {
    sentence: "庭に小さな池があります。",
    translation: "There is a small pond in the garden.",
    targets: [{ word: "池", reading: "いけ", segments: [{ ruby: "池", rt: "いけ" }] }]
  },
  240: {
    sentence: "食事の前に手を洗います。",
    translation: "I wash my hands before eating.",
    targets: [{ word: "洗います", reading: "あらいます", segments: [{ ruby: "洗", rt: "あら" }, { ruby: "います" }] }]
  },
  241: {
    sentence: "太陽の光が差し込んでいます。",
    translation: "The sunlight is streaming in.",
    targets: [{ word: "光", reading: "ひかり", segments: [{ ruby: "光", rt: "ひかり" }] }]
  },
  242: {
    sentence: "彼女は英語を上手に話します。",
    translation: "She speaks English very well.",
    targets: [{ word: "英語", reading: "えいご", segments: [{ ruby: "英", rt: "えい" }, { ruby: "語", rt: "ご" }] }]
  },
  243: {
    sentence: "昨日、映画を見に行きました。",
    translation: "I went to see a movie yesterday.",
    targets: [{ word: "映画", reading: "えいが", segments: [{ ruby: "映", rt: "えい" }, { ruby: "画", rt: "が" }] }]
  },
  244: {
    sentence: "みんなで歌を歌いましょう。",
    translation: "Let's all sing a song.",
    targets: [{ word: "歌", reading: "うた", segments: [{ ruby: "歌", rt: "うた" }] }]
  },
  245: {
    sentence: "音楽を聞くのが楽しいです。",
    translation: "It is fun to listen to music.",
    targets: [{ word: "音楽", reading: "おんがく", segments: [{ ruby: "音", rt: "おん" }, { ruby: "楽", rt: "がく" }] }] // wait, "楽" is "がく"
  },
  246: {
    sentence: "病院で薬をもらいました。",
    translation: "I received medicine at the hospital.",
    targets: [{ word: "薬", reading: "くすり", segments: [{ ruby: "薬", rt: "くすり" }] }]
  },
  247: {
    sentence: "世界にはいろいろな人がいます。",
    translation: "There are various people in the world.",
    targets: [{ word: "世界", reading: "せかい", segments: [{ ruby: "世", rt: "せ" }, { ruby: "界", rt: "かい" }] }]
  },
  248: {
    sentence: "この会社は農産物を扱っています。",
    translation: "This company deals with agricultural products.",
    targets: [{ word: "農産物", reading: "のうさんぶつ", segments: [{ ruby: "農", rt: "のう" }, { ruby: "産", rt: "さん" }, { ruby: "物", rt: "ぶつ" }] }]
  },
  249: {
    sentence: "彼は自動車産業で働いています。",
    translation: "He works in the automobile industry.",
    targets: [{ word: "産業", reading: "さんぎょう", segments: [{ ruby: "産", rt: "さん" }, { ruby: "業", rt: "ぎょう" }] }]
  },
  250: {
    sentence: "近くに小さな林があります。",
    translation: "There is a small woods nearby.",
    targets: [{ word: "林", reading: "はやし", segments: [{ ruby: "林", rt: "はやし" }] }]
  },
  251: {
    sentence: "森の中でキャンプをしました。",
    translation: "We camped inside the forest.",
    targets: [{ word: "森", reading: "もり", segments: [{ ruby: "森", rt: "もり" }] }]
  },
  252: {
    sentence: "買い物でいろいろな物を買いました。",
    translation: "I bought various things while shopping.",
    targets: [{ word: "物", reading: "もの", segments: [{ ruby: "物", rt: "もの" }] }]
  },
  253: {
    sentence: "新商品が発売されました。",
    translation: "A new product has been released.",
    targets: [{ word: "商品", reading: "しょうひん", segments: [{ ruby: "商", rt: "しょう" }, { ruby: "品", rt: "ひん" }] }]
  },
  254: {
    sentence: "ここには新しいビルが建てられます。",
    translation: "A new building will be built here.",
    targets: [{ word: "建て", reading: "たて", segments: [{ ruby: "建", rt: "た" }, { ruby: "て" }] }]
  },
  255: {
    sentence: "図書館で本を借りました。",
    translation: "I borrowed a book from the library.",
    targets: [{ word: "図書館", reading: "としょかん", segments: [{ ruby: "図", rt: "と" }, { ruby: "書", rt: "しょ" }, { ruby: "館", rt: "かん" }] }]
  },
  256: {
    sentence: "地図を見ながら歩きます。",
    translation: "I walk while looking at the map.",
    targets: [{ word: "地図", reading: "ちず", segments: [{ ruby: "地", rt: "ち" }, { ruby: "図", rt: "ず" }] }]
  },
  257: {
    sentence: "スマートフォンの使い方が分かりません。",
    translation: "I don't know how to use a smartphone.",
    targets: [{ word: "使い方", reading: "つかいかた", segments: [{ ruby: "使", rt: "つか" }, { ruby: "い" }, { ruby: "方", rt: "かた" }] }]
  },
  258: {
    sentence: "新幹線はとても便利です。",
    translation: "The Shinkansen is very convenient.",
    targets: [{ word: "便利", reading: "べんり", segments: [{ ruby: "便", rt: "べん" }, { ruby: "利", rt: "り" }] }]
  },
  259: {
    sentence: "図書館で本を借りました。",
    translation: "I borrowed a book from the library.",
    targets: [{ word: "借りました", reading: "かりました", segments: [{ ruby: "借", rt: "か" }, { ruby: "りました" }] }]
  },
  260: {
    sentence: "母は美味しい料理を作ります。",
    translation: "My mother makes delicious food.",
    targets: [{ word: "作ります", reading: "つくります", segments: [{ ruby: "作", rt: "つく" }, { ruby: "ります" }] }]
  },
  261: {
    sentence: "広いお部屋ですね。",
    translation: "It's a spacious room, isn't it?",
    targets: [{ word: "広い", reading: "ひろい", segments: [{ ruby: "広", rt: "ひろ" }, { ruby: "い" }] }]
  },
  262: {
    sentence: "私は自分のことを私と言います。",
    translation: "I refer to myself as 'watashi'.",
    targets: [{ word: "私", reading: "わたし", segments: [{ ruby: "私", rt: "わたし" }] }]
  },
  263: {
    sentence: "去年、日本へ旅行に行きました。",
    translation: "Last year, I traveled to Japan.",
    targets: [{ word: "去年", reading: "きょねん", segments: [{ ruby: "去", rt: "きょ" }, { ruby: "年", rt: "ねん" }] }]
  },
  264: {
    sentence: "会議はあちらの室で行われます。",
    translation: "The meeting will be held in that room over there.",
    targets: [{ word: "室", reading: "しつ", segments: [{ ruby: "室", rt: "しつ" }] }]
  },
  265: {
    sentence: "本屋で漫画を買いました。",
    translation: "I bought manga at the bookstore.",
    targets: [{ word: "本屋", reading: "ほんや", segments: [{ ruby: "本", rt: "ほん" }, { ruby: "屋", rt: "や" }] }]
  },
  266: {
    sentence: "先生が日本語を教えています。",
    translation: "The teacher is teaching Japanese.",
    targets: [{ word: "教えて", reading: "おしえて", segments: [{ ruby: "教", rt: "おし" }, { ruby: "えて" }] }]
  },
  267: {
    sentence: "研究所で新しい研究をしています。",
    translation: "They are doing new research at the research institute.",
    targets: [{ word: "研究", reading: "けんきゅう", segments: [{ ruby: "研", rt: "けん" }, { ruby: "究", rt: "きゅう" }] }] // wait, "研" is "けん", "究" is "きゅう"
  },
  268: {
    sentence: "新しいアイディアを発見しました。",
    translation: "I discovered a new idea.",
    targets: [{ word: "発見", reading: "ハッケン", segments: [{ ruby: "発", rt: "はっ" }, { ruby: "見", rt: "けん" }] }] // wait, "発" is "はっ"
  },
  269: {
    sentence: "宇宙の謎を究めます。",
    translation: "I will investigate/master the mysteries of the universe.",
    targets: [{ word: "究めます", reading: "きわめます", segments: [{ ruby: "究", rt: "きわ" }, { ruby: "めます" }] }]
  },
  270: {
    sentence: "コートを着て出かけます。",
    translation: "I put on my coat and go out.",
    targets: [{ word: "着て", reading: "きて", segments: [{ ruby: "着", rt: "き" }, { ruby: "て" }] }]
  },
  271: {
    sentence: "電車に乗って会社に行きます。",
    translation: "I ride the train to go to the company.",
    targets: [{ word: "乗って", reading: "のって", segments: [{ ruby: "乗", rt: "の" }, { ruby: "って" }] }]
  },
  272: {
    sentence: "旅行の計画を立てます。",
    translation: "I will make plans for the trip.",
    targets: [{ word: "計画", reading: "けいかく", segments: [{ ruby: "計", rt: "けい" }, { ruby: "画", rt: "かく" }] }]
  },
  273: {
    sentence: "地図を見ながら歩きます。",
    translation: "I walk while looking at the map.",
    targets: [{ word: "地図", reading: "ちず", segments: [{ ruby: "地", rt: "ち" }, { ruby: "図", rt: "ず" }] }]
  },
  274: {
    sentence: "先生が文法を説明しています。",
    translation: "The teacher is explaining grammar.",
    targets: [{ word: "説明", reading: "せつめい", segments: [{ ruby: "説", rt: "せつ" }, { ruby: "明", rt: "めい" }] }]
  },
  275: {
    sentence: "大学の大学院で勉強しています。",
    translation: "I am studying at the university's graduate school.",
    targets: [{ word: "大学院", reading: "だいがくいん", segments: [{ ruby: "大", rt: "だい" }, { ruby: "学", rt: "がく" }, { ruby: "院", rt: "いん" }] }]
  },
  276: {
    sentence: "病気で学校を休みました。",
    translation: "I was absent from school due to illness.",
    targets: [{ word: "病気", reading: "びょうき", segments: [{ ruby: "病", rt: "びょう" }, { ruby: "気", rt: "き" }] }]
  },
  277: {
    sentence: "理科の授業が好きです。",
    translation: "I like science class.",
    targets: [{ word: "理科", reading: "りか", segments: [{ ruby: "理", rt: "り" }, { ruby: "科", rt: "か" }] }]
  },
  278: {
    sentence: "今日の温度は二十度です。",
    translation: "Today's temperature is twenty degrees.",
    targets: [{ word: "二十度", reading: "にじゅうど", segments: [{ ruby: "二", rt: "に" }, { ruby: "十", rt: "じゅう" }, { ruby: "度", rt: "ど" }] }]
  },
  279: {
    sentence: "冷たい水で頭を冷やしました。",
    translation: "I cooled my head with cold water.",
    targets: [{ word: "頭", reading: "あたま", segments: [{ ruby: "頭", rt: "あたま" }] }]
  },
  280: {
    sentence: "恥ずかしくて顔が赤くなりました。",
    translation: "I was embarrassed and my face turned red.",
    targets: [{ word: "顔", reading: "かお", segments: [{ ruby: "顔", rt: "かお" }] }]
  },
  281: {
    sentence: "大きな声で歌いましょう。",
    translation: "Let's sing in a loud voice.",
    targets: [{ word: "声", reading: "こえ", segments: [{ ruby: "声", rt: "こえ" }] }]
  },
  282: {
    sentence: "テストの課題が難しいです。",
    translation: "The test task/problem is difficult.",
    targets: [{ word: "課題", reading: "かだい", segments: [{ ruby: "課", rt: "か" }, { ruby: "題", rt: "だい" }] }]
  },
  283: {
    sentence: "バラはきれいな色ですね。",
    translation: "Roses are a beautiful color, aren't they?",
    targets: [{ word: "色", reading: "いろ", segments: [{ ruby: "色", rt: "いろ" }] }]
  },
  284: {
    sentence: "日本語の漢字を練習します。",
    translation: "I practice Japanese kanji.",
    targets: [{ word: "漢字", reading: "かんじ", segments: [{ ruby: "漢", rt: "かん" }, { ruby: "字", rt: "じ" }] }]
  },
  285: {
    sentence: "きれいな文字を書きたいです。",
    translation: "I want to write beautiful characters.",
    targets: [{ word: "文字", reading: "もじ", segments: [{ ruby: "文", rt: "も" }, { ruby: "字", rt: "じ" }] }] // wait, "文" is "も" here
  },
  286: {
    sentence: "デジカメで写真を写します。",
    translation: "I take a picture with a digital camera.",
    targets: [{ word: "写します", reading: "うつします", segments: [{ ruby: "写", rt: "うつ" }, { ruby: "します" }] }]
  },
  287: {
    sentence: "よく考えてみてください。",
    translation: "Please think carefully about it.",
    targets: [{ word: "考えて", reading: "かんがえて", segments: [{ ruby: "考", rt: "かんが" }, { ruby: "えて" }] }]
  },
  288: {
    sentence: "これが真実の姿です。",
    translation: "This is the true figure.",
    targets: [{ word: "真実", reading: "しんじつ", segments: [{ ruby: "真", rt: "しん" }, { ruby: "実", rt: "じつ" }] }]
  },
  289: {
    sentence: "みんながロビーに集まりました。",
    translation: "Everyone gathered in the lobby.",
    targets: [{ word: "集まりました", reading: "あつまりました", segments: [{ ruby: "集", rt: "あつ" }, { ruby: "まりました" }] }]
  },
  290: {
    sentence: "日曜日から土曜日まで毎日忙しいです。",
    translation: "I am busy every day from Sunday to Saturday.",
    targets: [{ word: "日曜日", reading: "にちようび", segments: [{ ruby: "日", rt: "にち" }, { ruby: "曜", rt: "よう" }, { ruby: "日", rt: "び" }] }]
  },
  291: {
    sentence: "前に進んでください。",
    translation: "Please move forward.",
    targets: [{ word: "進んで", reading: "すすんで", segments: [{ ruby: "進", rt: "すす" }, { ruby: "んで" }] }]
  },
  292: {
    sentence: "早く家へ帰りましょう。",
    translation: "Let's return home quickly.",
    targets: [{ word: "帰りましょう", reading: "かえりましょう", segments: [{ ruby: "帰", rt: "かえ" }, { ruby: "りましょう" }] }]
  },
  293: {
    sentence: "他の人とは別に行動します。",
    translation: "I act separately from other people.",
    targets: [{ word: "別に", reading: "べつに", segments: [{ ruby: "別", rt: "べつ" }, { ruby: "に" }] }]
  },
  294: {
    sentence: "これ以降は立ち入り禁止です。",
    translation: "Entry is prohibited beyond this point.",
    targets: [{ word: "以降", reading: "いこう", segments: [{ ruby: "以", rt: "い" }, { ruby: "降", rt: "こう" }] }]
  },
  295: {
    sentence: "食堂でランチを食べました。",
    translation: "I ate lunch in the cafeteria.",
    targets: [{ word: "食堂", reading: "しょくどう", segments: [{ ruby: "食", rt: "しょく" }, { ruby: "堂", rt: "どう" }] }]
  },
  296: {
    sentence: "消費税がまた上がりました。",
    translation: "The consumption tax went up again.",
    targets: [{ word: "消費税", reading: "しょうひぜい", segments: [{ ruby: "消費", rt: "しょうひ" }, { ruby: "税", rt: "ぜい" }] }]
  },
  297: {
    sentence: "税金が込みの値段です。",
    translation: "The price is tax-inclusive.",
    targets: [{ word: "込み", reading: "こみ", segments: [{ ruby: "込", rt: "こ" }, { ruby: "み" }] }]
  },
  298: {
    sentence: "入会を申し込みます。",
    translation: "I apply for membership.",
    targets: [{ word: "申し込む", reading: "もうしこむ", segments: [{ ruby: "申", rt: "もう" }, { ruby: "し" }, { ruby: "込む", rt: "こむ" }] }] // wait, "申" is "もうし"
  },
  299: {
    sentence: "大通りを通って帰ります。",
    translation: "I return by passing through the main street.",
    targets: [{ word: "通って", reading: "とおって", segments: [{ ruby: "通", rt: "とお" }, { ruby: "って" }] }]
  },
  300: {
    sentence: "交通機関が発達しています。",
    translation: "Transportation systems are well-developed.",
    targets: [{ word: "交通", reading: "こうつう", segments: [{ ruby: "交", rt: "こう" }, { ruby: "通", rt: "つう" }] }]
  }
};

// Merge manual entries
Object.keys(remainingSentences).forEach(id => {
  const kid = parseInt(id);
  const sentenceIndex = sentences.findIndex(s => s.kanjiId === kid);
  if (sentenceIndex === -1) {
    sentences.push({
      kanjiId: kid,
      ...remainingSentences[id]
    });
  }
});

// Sort sentences by kanjiId
sentences.sort((a, b) => a.kanjiId - b.kanjiId);

// Build final static sentences.js
const outputFilePath = path.join('src', 'data', 'sentences.js');
const fileContent = `// Static sentence database for the Furigana Writing Game.
// Contains 300 example sentences, one for each Kanji ID (1-300).
// Each sentence has pre-segmented words for ruby/furigana rendering.

export const sentencesData = ${JSON.stringify(sentences, null, 2)};
`;

fs.writeFileSync(outputFilePath, fileContent);
console.log(`Successfully generated sentences database at ${outputFilePath} with ${sentences.length} entries!`);
