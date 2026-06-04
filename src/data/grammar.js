export const grammarData = [
  {
    lesson: 1,
    title: "Lesson 1: Introduction & Identity",
    patterns: [
      {
        pattern: "N1 は N2 です",
        explanation: "N1 is N2. 'は' (pronounced 'wa') marks the topic; 'です' makes it polite.",
        exampleJa: "私はミラーです。",
        exampleFurigana: "わたし[私]はミラーです。",
        exampleEn: "I am Miller."
      },
      {
        pattern: "N1 は N2 じゃありません",
        explanation: "N1 is not N2. Casual-polite negative form of 'です'.",
        exampleJa: "サントスさんは学生じゃありません。",
        exampleFurigana: "サントスさんはがくせい[学生]じゃありません。",
        exampleEn: "Mr. Santos is not a student."
      }
    ],
    quiz: [
      {
        question: "Complete the sentence: わたし ___ マイクです。",
        options: ["は", "が", "を", "の"],
        answer: "は"
      },
      {
        question: "What is the polite negative of です?",
        options: ["じゃありません", "でした", "ます", "ません"],
        answer: "じゃありません"
      }
    ]
  },
  {
    lesson: 2,
    title: "Lesson 2: Demonstratives & Belongings",
    patterns: [
      {
        pattern: "これ / それ / あれ は N です",
        explanation: "This / That / That over there is N. Evaluated from the speaker's perspective.",
        exampleJa: "これは本です。",
        exampleFurigana: "これはほん[本]です。",
        exampleEn: "This is a book."
      },
      {
        pattern: "この / その / あの N",
        explanation: "Modifies a noun directly: 'This book', 'That book'. Must be followed by a noun.",
        exampleJa: "このカメラは私のです。",
        exampleFurigana: "このカメラはわたし[私]のです。",
        exampleEn: "This camera is mine."
      }
    ],
    quiz: [
      {
        question: "___ ほんは わたしのです。",
        options: ["これ", "この", "あれ", "それ"],
        answer: "この"
      },
      {
        question: "Translate: 'That (near listener) is a key.'",
        options: ["それはかぎです。", "これはかぎです。", "あれはかぎです。", "このかぎです。"],
        answer: "それはかぎです。"
      }
    ]
  },
  {
    lesson: 3,
    title: "Lesson 3: Locations & Directions",
    patterns: [
      {
        pattern: "ここ / そこ / あそこ は N (place) です",
        explanation: "This place / That place / That place over there is N.",
        exampleJa: "ここは食堂です。",
        exampleFurigana: "ここはしょくどう[食堂]です。",
        exampleEn: "This is the dining hall."
      },
      {
        pattern: "N は どこですか",
        explanation: "Where is N? Used to ask for the location of people or places.",
        exampleJa: "お手洗いはどこですか。",
        exampleFurigana: "おてあらい[お手洗い]はどこですか。",
        exampleEn: "Where is the restroom?"
      }
    ],
    quiz: [
      {
        question: "おてあらいは ___ ですか。",
        options: ["どこ", "これ", "なに", "だれ"],
        answer: "どこ"
      },
      {
        question: "Polite version of あそこ is:",
        options: ["あちら", "そちら", "こちら", "どちら"],
        answer: "あちら"
      }
    ]
  },
  {
    lesson: 4,
    title: "Lesson 4: Time, Dates & Basic Verbs",
    patterns: [
      {
        pattern: "今 〜時 〜分 です",
        explanation: "It is currently [hour] o'clock, [minute] minutes.",
        exampleJa: "今四時半です。",
        exampleFurigana: "いま[今]よじ[四時]はん[半]です。",
        exampleEn: "It is 4:30 right now."
      },
      {
        pattern: "V-ます / V-ました / V-ません",
        explanation: "Polite verbs: ます (present), ました (past), ません (negative present).",
        exampleJa: "毎朝六時に起きます。",
        exampleFurigana: "まいあさ[毎朝]ろくじ[六時]にお[起]きます。",
        exampleEn: "I get up at 6 o'clock every morning."
      }
    ],
    quiz: [
      {
        question: "昨日、わたしは ___。",
        options: ["働きます", "働きません", "働きました", "働きましょう"],
        answer: "働きました"
      },
      {
        question: "Time marker particle is:",
        options: ["に", "を", "は", "で"],
        answer: "に"
      }
    ]
  },
  {
    lesson: 5,
    title: "Lesson 5: Movement & Destination",
    patterns: [
      {
        pattern: "N (place) へ 行きます/来ます/帰ります",
        explanation: "Go / Come / Return to N (place). 'へ' (pronounced 'e') is the direction particle.",
        exampleJa: "東京へ行きます。",
        exampleFurigana: "とうきょう[東京]へい[行]きます。",
        exampleEn: "I will go to Tokyo."
      },
      {
        pattern: "N (vehicle) で 行きます",
        explanation: "Go by means of N (vehicle). 'で' indicates means of transport.",
        exampleJa: "電車で行きます。",
        exampleFurigana: "でんしゃ[電車]でい[行]きます。",
        exampleEn: "I will go by train."
      }
    ],
    quiz: [
      {
        question: "タクシー ___ うちへ帰ります。",
        options: ["へ", "で", "を", "に"],
        answer: "で"
      },
      {
        question: "Translate: 'Where are you going?'",
        options: ["どこへ行きますか。", "だれと行きますか。", "いつ行きますか。", "何で行きますか。"],
        answer: "どこへ行きますか。"
      }
    ]
  },
  {
    lesson: 6,
    title: "Lesson 6: Actions & Suggestions",
    patterns: [
      {
        pattern: "N を V (transitive)",
        explanation: "'を' (pronounced 'o') marks the direct object of a transitive verb.",
        exampleJa: "ジュースを飲みます。",
        exampleFurigana: "ジュースをの[飲]みます。",
        exampleEn: "I drink juice."
      },
      {
        pattern: "〜ませんか / 〜ましょう",
        explanation: "ませんか (Won't you do...? - invitation); ましょう (Let's do... - suggestion).",
        exampleJa: "いっしょに神戸へ行きませんか。",
        exampleFurigana: "いっしょにこうべ[神戸]へい[行]きませんか。",
        exampleEn: "Won't you go to Kobe with me?"
      }
    ],
    quiz: [
      {
        question: "お酒 ___ 飲みますか。",
        options: ["を", "は", "が", "に"],
        answer: "を"
      },
      {
        question: "Join someone in an action: いっしょに映画を ___。",
        options: ["見ます", "見ましょう", "見ますか", "見ました"],
        answer: "見ましょう"
      }
    ]
  },
  {
    lesson: 7,
    title: "Lesson 7: Giving, Receiving & Tools",
    patterns: [
      {
        pattern: "N (tool) で V",
        explanation: "Perform an action using a tool or language. 'で' marks the instrument.",
        exampleJa: "日本語でレポートを書きます。",
        exampleFurigana: "にほんご[日本語]でレポートをか[書]きます。",
        exampleEn: "I write a report in Japanese."
      },
      {
        pattern: "N (person) に あげます / もらいます",
        explanation: "Give to N / Receive from N. 'に' marks the target/recipient.",
        exampleJa: "私は木村さんに花をあげました。",
        exampleFurigana: "わたし[私]はきむら[木村]さんにはな[花]をあげました。",
        exampleEn: "I gave flowers to Ms. Kimura."
      }
    ],
    quiz: [
      {
        question: "ハサミ ___ 紙を切ります。",
        options: ["を", "に", "で", "が"],
        answer: "で"
      },
      {
        question: "山田さんにプレゼントを ___。",
        options: ["もらいました", "あげました", "くれました", "あります"],
        answer: "あげました"
      }
    ]
  },
  {
    lesson: 8,
    title: "Lesson 8: Adjectives & Descriptions",
    patterns: [
      {
        pattern: "い-Adjective / な-Adjective です",
        explanation: "Describing nouns. な-adjectives drop the 'な' before 'です'; い-adjectives keep 'い'.",
        exampleJa: "この花はきれいです。富士山は高いです。",
        exampleFurigana: "このはな[花]はきれいです。ふじさん[富士山]はたか[高]いです。",
        exampleEn: "This flower is pretty. Mt. Fuji is high."
      },
      {
        pattern: "な-Adj な N / い-Adj N",
        explanation: "Modifying nouns: keep 'な' for な-adj, keep 'い' for い-adj.",
        exampleJa: "にぎやかな町。冷たいビール。",
        exampleFurigana: "にぎやかなまち[町]。つめ[冷]たいビール。",
        exampleEn: "A lively town. Cold beer."
      }
    ],
    quiz: [
      {
        question: "富士山は ___ 山です。",
        options: ["高いの", "高いな", "高い", "高く"],
        answer: "高い"
      },
      {
        question: "Negative of きれいです:",
        options: ["きれいじゃないです", "きれいじゃありません", "きれいくないです", "きれいでした"],
        answer: "きれいじゃありません"
      }
    ]
  },
  {
    lesson: 9,
    title: "Lesson 9: Preferences, Abilities & Reasons",
    patterns: [
      {
        pattern: "N が あります / 好きです / 上手です",
        explanation: "State of ownership, preference, or ability. Object takes 'が' instead of 'を'.",
        exampleJa: "私はイタリア料理が好きです。",
        exampleFurigana: "わたし[私]はイタリアりょうり[料理]がす[好]きです。",
        exampleEn: "I like Italian food."
      },
      {
        pattern: "S1 から、S2",
        explanation: "Because S1, S2. Explaining reasons.",
        exampleJa: "時間がないから、テレビを見ません。",
        exampleFurigana: "じかん[時間]がないから、テレビをみ[見]ません。",
        exampleEn: "Because I have no time, I do not watch TV."
      }
    ],
    quiz: [
      {
        question: "日本語 ___ わかりますか。",
        options: ["を", "が", "で", "に"],
        answer: "が"
      },
      {
        question: "Translate: 'Because it's hot, I will drink water.'",
        options: [
          "暑いですから、水を飲みます。",
          "暑いです、水が欲しいです。",
          "暑いし、水があります。",
          "暑いですから、水があります。"
        ],
        answer: "暑いですから、水を飲みます。"
      }
    ]
  },
  {
    lesson: 10,
    title: "Lesson 10: Existence of Items and People",
    patterns: [
      {
        pattern: "Place に N が あります / います",
        explanation: "There is N in [place]. 'あります' for inanimate objects; 'います' for living beings.",
        exampleJa: "つくえの上に乗る本があります。あそこに男の人がいます。",
        exampleFurigana: "つくえのうえ[上]にの[乗]るほん[本]があります。あそこにおとこのひと[男の人]がいます。",
        exampleEn: "There is a book on the desk. There is a man over there."
      },
      {
        pattern: "N は Place に あります / います",
        explanation: "N is located in [place]. Form used when N is the topic.",
        exampleJa: "ミラーさんは事務所にいます。",
        exampleFurigana: "ミラーさんはじむしょ[事務所]にいます。",
        exampleEn: "Mr. Miller is in the office."
      }
    ],
    quiz: [
      {
        question: "庭に犬 ___ います。",
        options: ["が", "を", "は", "に"],
        answer: "が"
      },
      {
        question: "Which verb to use for a car (車)?",
        options: ["あります", "います", "じゃありません", "いません"],
        answer: "あります"
      }
    ]
  },
  {
    lesson: 11,
    title: "Lesson 11: Counting & Durations",
    patterns: [
      {
        pattern: "Quantifier + V",
        explanation: "Numbers, counter words (つ, 人, 台, etc.) usually follow the object particle and precede the verb.",
        exampleJa: "りんごを四つ買いました。",
        exampleFurigana: "りんごをよっ[四]つか[買]いました。",
        exampleEn: "I bought four apples."
      },
      {
        pattern: "Period に 〜回 V",
        explanation: "Indicates frequency: [Number of times] in a [Period].",
        exampleJa: "一ヶ月に二回映画を見ます。",
        exampleFurigana: "いっかげつ[一ヶ月]ににかい[二回]えいが[映画]をみ[見]ます。",
        exampleEn: "I watch movies twice a month."
      }
    ],
    quiz: [
      {
        question: "学生が五人 ___。",
        options: ["あります", "います", "ですか", "でした"],
        answer: "います"
      },
      {
        question: "一週間 ___ 二回テニスをします。",
        options: ["に", "で", "を", "は"],
        answer: "に"
      }
    ]
  },
  {
    lesson: 12,
    title: "Lesson 12: Past State & Comparisons",
    patterns: [
      {
        pattern: "N1 は N2 より Adj です",
        explanation: "N1 is more Adj than N2. Comparison sentence.",
        exampleJa: "この車はあの車より安いです。",
        exampleFurigana: "このくるま[車]はあのくるま[車]よりやす[安]いです。",
        exampleEn: "This car is cheaper than that one."
      },
      {
        pattern: "N1 と N2 と どちらが Adj ですか",
        explanation: "Which is more Adj, N1 or N2?",
        exampleJa: "コーヒーと紅茶とどちらが好きですか。",
        exampleFurigana: "コーヒーとこうちゃ[紅茶]とどちらがす[好]きですか。",
        exampleEn: "Which do you prefer, coffee or tea?"
      }
    ],
    quiz: [
      {
        question: "昨日天気は ___ ですか。",
        options: ["よかった", "よかったです", "いいでした", "よくなかった"],
        answer: "よかったです"
      },
      {
        question: "北海道は本州 ___ 寒いです。",
        options: ["より", "ほう", "どちら", "から"],
        answer: "より"
      }
    ]
  },
  {
    lesson: 13,
    title: "Lesson 13: Desires & Purpose of Movement",
    patterns: [
      {
        pattern: "N が 欲しいです / V-たいです",
        explanation: "I want N (noun) / I want to do V (verb). Negative is 欲しくない / たくない.",
        exampleJa: "新しい車が欲しいです。日本へ行きたいです。",
        exampleFurigana: "あたら[新]しいくるま[車]がほ[欲]しいです。にほん[日本]へい[行]きたいです。",
        exampleEn: "I want a new car. I want to go to Japan."
      },
      {
        pattern: "Place へ V-に 行きます/来ます",
        explanation: "Go to [place] in order to do V (verb stem). Marks purpose of movement.",
        exampleJa: "デパートへ買い物に行きます。",
        exampleFurigana: "デパートへか[買]いもの[物]にい[行]きます。",
        exampleEn: "I am going to the department store to shop."
      }
    ],
    quiz: [
      {
        question: "のどが渇きました。水 ___ 飲みたいです。",
        options: ["が", "を", "に", "へ"],
        answer: "が"
      },
      {
        question: "図書館へ本を ___ に行きます。",
        options: ["借りる", "借り", "借りて", "借りた"],
        answer: "借り"
      }
    ]
  },
  {
    lesson: 14,
    title: "Lesson 14: Te-Form Conjugation & Requests",
    patterns: [
      {
        pattern: "V-て ください",
        explanation: "Please do V. Uses the verb Te-form.",
        exampleJa: "ここに住所を書いてください。",
        exampleFurigana: "ここにじゅうしょ[住所]をか[書]いてください。",
        exampleEn: "Please write your address here."
      },
      {
        pattern: "V-て います",
        explanation: "Currently doing V. Represents present continuous action.",
        exampleJa: "今雨が降っています。",
        exampleFurigana: "いま[今]あめ[雨]がふ[降]っています。",
        exampleEn: "It is raining right now."
      }
    ],
    quiz: [
      {
        question: "急いで ___ ください。",
        options: ["行き", "行って", "行きます", "行かない"],
        answer: "行って"
      },
      {
        question: "マイクさんは今電話を ___ います。",
        options: ["かけ", "かけて", "かける", "かけた"],
        answer: "かけて"
      }
    ]
  },
  {
    lesson: 15,
    title: "Lesson 15: Permission, Prohibition & Status",
    patterns: [
      {
        pattern: "V-て も いいです / V-て は いけません",
        explanation: "You may do V (permission) / You must not do V (prohibition).",
        exampleJa: "写真を撮ってもいいですか。入ってはいけません。",
        exampleFurigana: "しゃしん[写真]をと[撮]ってもいいですか。はい[入]ってはいけません。",
        exampleEn: "May I take a photo? You must not enter."
      },
      {
        pattern: "V-て います (state)",
        explanation: "Describes persistent states (e.g. marriage, occupation, residency, knowing info).",
        exampleJa: "私は大阪に住んでいます。ミラーさんを知っています。",
        exampleFurigana: "わたし[私]はおおさか[大阪]にす[住]んでいます。ミラーさんをし[知]っています。",
        exampleEn: "I live in Osaka. I know Mr. Miller."
      }
    ],
    quiz: [
      {
        question: "ここでタバコを吸っては ___。",
        options: ["いいです", "いけません", "あります", "います"],
        answer: "いけません"
      },
      {
        question: "私は結婚して ___。",
        options: ["います", "あります", "いいです", "みます"],
        answer: "います"
      }
    ]
  },
  {
    lesson: 16,
    title: "Lesson 16: Connecting Sentences",
    patterns: [
      {
        pattern: "V1-て、V2-て、V3",
        explanation: "Connecting actions in chronological order.",
        exampleJa: "朝起きて、シャワーを浴びて、学校へ行きます。",
        exampleFurigana: "あさ[朝]お[起]きて、シャワーをあ[浴]びて、がっこう[学校]へい[行]きます。",
        exampleEn: "I wake up in the morning, take a shower, and go to school."
      },
      {
        pattern: "V-て から、〜",
        explanation: "After doing V, [main action].",
        exampleJa: "仕事が終わってから、ビールを飲みます。",
        exampleFurigana: "しごと[仕事]がお[終]わってから、ビールをの[飲]みます。",
        exampleEn: "After finishing work, I will drink beer."
      }
    ],
    quiz: [
      {
        question: "お金を ___ から、買い物に行きます。",
        options: ["下ろし", "下ろして", "下ろす", "下ろした"],
        answer: "下ろして"
      },
      {
        question: "山田さんは若くて、 ___ 人です。 (な-adj)",
        options: ["親切", "親切な", "親切に", "親切で"],
        answer: "親切な"
      }
    ]
  },
  {
    lesson: 17,
    title: "Lesson 17: Nai-Form Conjugation & Obligations",
    patterns: [
      {
        pattern: "V-ないで ください",
        explanation: "Please do not do V. Uses Nai-form.",
        exampleJa: "写真を撮らないでください。",
        exampleFurigana: "しゃしん[写真]をと[撮]らないでください。",
        exampleEn: "Please do not take photos."
      },
      {
        pattern: "V-なければ なりません / V-なくても いいです",
        explanation: "Must do V (obligation) / Don't have to do V (lack of obligation).",
        exampleJa: "薬を飲まなければなりません。明日来なくてもいいです。",
        exampleFurigana: "くすり[薬]をの[飲]まなければなりません。あした[明日]こ[来]なくてもいいです。",
        exampleEn: "I must take medicine. You do not have to come tomorrow."
      }
    ],
    quiz: [
      {
        question: "時間を守ら ___ なりません。",
        options: ["なくては", "なければ", "ないで", "なくても"],
        answer: "なければ"
      },
      {
        question: "心配 ___ ください。",
        options: ["しないで", "しなくて", "しな", "しない"],
        answer: "しないで"
      }
    ]
  },
  {
    lesson: 18,
    title: "Lesson 18: Dictionary Form, Abilities & Habits",
    patterns: [
      {
        pattern: "N / V-る こと が できます",
        explanation: "Can do V / N is possible. Uses Verb Dictionary Form.",
        exampleJa: "日本語を話すことができます。",
        exampleFurigana: "にほんご[日本語]をはな[話]すことができます。",
        exampleEn: "I can speak Japanese."
      },
      {
        pattern: "V-る まえに、〜",
        explanation: "Before doing V, [main action]. Modifies verbs with Dictionary Form.",
        exampleJa: "寝る前に、本を読みます。",
        exampleFurigana: "ね[寝]るまえ[前]に、ほん[本]をよ[読]みます。",
        exampleEn: "Before sleeping, I read a book."
      }
    ],
    quiz: [
      {
        question: "漢字を ___ ことができますか。",
        options: ["書く", "書いて", "書き", "書いた"],
        answer: "書く"
      },
      {
        question: "食事の ___ に、手を洗います。",
        options: ["まえ", "まえに", "あとで", "ときに"],
        answer: "まえに"
      }
    ]
  },
  {
    lesson: 19,
    title: "Lesson 19: Ta-Form, Experiences & States",
    patterns: [
      {
        pattern: "V-た ことが あります",
        explanation: "Have the experience of doing V. Uses Verb Ta-form (past plain).",
        exampleJa: "私は歌舞伎を見たことがあります。",
        exampleFurigana: "わたし[私]はかぶき[歌舞伎]をみ[見]たことがあります。",
        exampleEn: "I have seen Kabuki before."
      },
      {
        pattern: "V-たり、V-tari します",
        explanation: "Doing things like V1, V2 (non-exhaustive list of actions).",
        exampleJa: "日曜日は買い物をしたり、掃除をしたりします。",
        exampleFurigana: "にちようび[日曜日]はか[買]いもの[物]をしたり、そうじ[掃除]をしたりします。",
        exampleEn: "On Sundays, I do things like shopping and cleaning."
      }
    ],
    quiz: [
      {
        question: "日本へ ___ ことがありますか。",
        options: ["行く", "行って", "行きた", "行った"],
        answer: "行った"
      },
      {
        question: "風邪をひいて、寒く ___ なりました。",
        options: ["く", "に", "で", "して"],
        answer: "く"
      }
    ]
  },
  {
    lesson: 20,
    title: "Lesson 20: Plain Style (Casual Japanese)",
    patterns: [
      {
        pattern: "Plain Form Sentences",
        explanation: "Casual conversation between close friends and family. Verbs end in plain form; drop です.",
        exampleJa: "明日、学校行く？ うん、行くよ。",
        exampleFurigana: "あした[明日]、がっこう[学校]い[行]く？ うん、い[行]くよ。",
        exampleEn: "Are you going to school tomorrow? Yeah, I am."
      }
    ],
    quiz: [
      {
        question: "What is the plain form of '食べます'?",
        options: ["食べる", "食べて", "食べた", "食べない"],
        answer: "食べる"
      },
      {
        question: "What is the casual equivalent of 'いいえ、ちがいます'?",
        options: ["ううん、ちがう。", "うん、ちがう。", "いいえ、ちがう。", "ちがいません。"],
        answer: "ううん、ちがう。"
      }
    ]
  },
  {
    lesson: 21,
    title: "Lesson 21: Opinions, Quotations & Guesses",
    patterns: [
      {
        pattern: "Plain-form と 思います",
        explanation: "I think that [Plain-form clause]. Expressing opinions.",
        exampleJa: "明日は雨が降ると思います。",
        exampleFurigana: "あした[明日]はあめ[雨]がふ[降]るとおも[思]います。",
        exampleEn: "I think it will rain tomorrow."
      },
      {
        pattern: "Plain-form と 言いました",
        explanation: "[Someone] said that [Plain-form clause]. Indirect/direct quotation.",
        exampleJa: "木村さんは来週大阪へ行くと言いました。",
        exampleFurigana: "きむら[木村]さんはらいしゅう[来週]おおさか[大阪]へい[行]くとい[言]いました。",
        exampleEn: "Ms. Kimura said she will go to Osaka next week."
      }
    ],
    quiz: [
      {
        question: "首相は日本は安全だ ___ 言いました。",
        options: ["と", "を", "が", "に"],
        answer: "と"
      },
      {
        question: "明日の試合は山田さんが勝つ ___ 思います。",
        options: ["と", "を", "が", "の"],
        answer: "と"
      }
    ]
  },
  {
    lesson: 22,
    title: "Lesson 22: Noun Modifying Clauses",
    patterns: [
      {
        pattern: "[Plain form clause] + Noun",
        explanation: "Japanese relative clauses. The entire action clause modifies a noun directly.",
        exampleJa: "これは私が撮った写真です。彼が住んでいる家は大きいです。",
        exampleFurigana: "これはわたし[私]がと[撮]ったしゃしん[写真]です。かれ[彼]がす[住]んでいるいえ[家]はおお[大]きいです。",
        exampleEn: "This is the photo I took. The house where he lives is big."
      }
    ],
    quiz: [
      {
        question: "あそこで本を ___ 人は山田さんです。",
        options: ["読みます", "読んでいる", "読みたい", "読むの"],
        answer: "読んでいる"
      },
      {
        question: "Translate: 'The cake that my mother made.'",
        options: [
          "母が作ったケーキ。",
          "母の作ったケーキですね。",
          "母で作ったケーキ。",
          "母を作ったケーキ。"
        ],
        answer: "母が作ったケーキ。"
      }
    ]
  },
  {
    lesson: 23,
    title: "Lesson 23: When & Natural Consequence",
    patterns: [
      {
        pattern: "V-る / Adj-い / N-の とき、〜",
        explanation: "When doing V / When it is N / When Adj.",
        exampleJa: "図書館で本を借りるとき、カードが必要です。",
        exampleFurigana: "としょかん[図書館]でほん[本]をか[借]りるとき、カードがひつよう[必要]です。",
        exampleEn: "When you borrow books at the library, a card is required."
      },
      {
        pattern: "V-る と、〜",
        explanation: "If/when V happens, [consequence] naturally/inevitably follows.",
        exampleJa: "このボタンを押すと、お釣りが出ます。",
        exampleFurigana: "このボタンをお[押]すと、おつ[釣]りが出ます。",
        exampleEn: "If you press this button, change will come out."
      }
    ],
    quiz: [
      {
        question: "寂しい ___、家族に電話をかけます。",
        options: ["とき", "ときに", "と", "たら"],
        answer: "とき"
      },
      {
        question: "これを右へ曲がる ___、駅があります。",
        options: ["と", "とき", "たら", "れば"],
        answer: "と"
      }
    ]
  },
  {
    lesson: 24,
    title: "Lesson 24: Giving and Receiving Favors",
    patterns: [
      {
        pattern: "V-て くれます / もらいます / あげます",
        explanation: "Perform an action as a favor: くれます (someone does for me); もらいます (I receive favor from); あげます (I do for someone).",
        exampleJa: "山田さんは私に自転車を修理してくれました。",
        exampleFurigana: "やまだ[山田]さんはわたし[私]にじてんしゃ[自転車]をしゅうり[修理]してくれました。",
        exampleEn: "Mr. Yamada repaired the bicycle for me."
      }
    ],
    quiz: [
      {
        question: "私は山田さんに英語を教えて ___ました。 (Yamada did it for me)",
        options: ["あげ", "くれ", "もらい", "やり"],
        answer: "もらい"
      },
      {
        question: "佐藤さんは私にお茶をいれて ___ました。",
        options: ["くれ", "もらい", "あげ", "やり"],
        answer: "くれ"
      }
    ]
  },
  {
    lesson: 25,
    title: "Lesson 25: Conditionals & Concessives",
    patterns: [
      {
        pattern: "V-たら、〜 / V-ても、〜",
        explanation: "V-たら: if/when V happens (conditional). V-ても: even if V happens (concessive).",
        exampleJa: "雨が降ったら、行きません。安くても、買いません。",
        exampleFurigana: "あめ[雨]がふ[降]ったら、い[行]きません。やす[安]くても、か[買]いません。",
        exampleEn: "If it rains, I won't go. Even if it is cheap, I won't buy it."
      }
    ],
    quiz: [
      {
        question: "お金が ___、旅行に行きます。",
        options: ["あったら", "あっても", "あれば", "あると"],
        answer: "あったら"
      },
      {
        question: "高く ___、買いたいです。",
        options: ["ても", "くて", "くても", "なら"],
        answer: "くても"
      }
    ]
  },
  {
    lesson: 26,
    title: "Lesson 26: Explanatory Tone & Polite Favors",
    patterns: [
      {
        pattern: "Plain-form + んです",
        explanation: "Used to explain causes, seek reasons, or emphasize a point in conversation.",
        exampleJa: "どうして遅れたんですか。バスが遅れたんです。",
        exampleFurigana: "どうしておく[遅]れたんですか。バスがおく[遅]れたんです。",
        exampleEn: "Why are you late? It is because the bus was late."
      },
      {
        pattern: "V-て いただけませんか",
        explanation: "Polite request: 'Could you please do V for me?'",
        exampleJa: "生け花を教えていただけませんか。",
        exampleFurigana: "い[生]けはな[花]をおし[教]えていただけませんか。",
        exampleEn: "Could you please teach me flower arranging?"
      }
    ],
    quiz: [
      {
        question: "頭が痛い ___、早く帰ります。",
        options: ["んです", "んですから", "ので", "から"],
        answer: "んです"
      },
      {
        question: "すみませんが、地図を ___ いただけませんか。",
        options: ["書いて", "書く", "書き", "書いた"],
        answer: "書いて"
      }
    ]
  },
  {
    lesson: 27,
    title: "Lesson 27: Potential Verbs (Abilities)",
    patterns: [
      {
        pattern: "Potential Verb (Group 1: -u -> -eru, Group 2: -ru -> -られる, Group 3: できる / こられる)",
        explanation: "Ability to do actions. Direct objects generally take 'が' instead of 'を' with potential verbs.",
        exampleJa: "私は日本語が少し話せます。漢字が書けます。",
        exampleFurigana: "わたし[私]はにほんご[日本語]がすこ[少し]はな[話]せます。かんじ[漢字]がか[書]けます。",
        exampleEn: "I can speak a little Japanese. I can write Kanji."
      },
      {
        pattern: "N しか 〜 ません",
        explanation: "Nothing but / Only N (always followed by a negative verb). Contrast with 'だけ'.",
        exampleJa: "ローマ字しか書けません。",
        exampleFurigana: "ローマじ[字]しかか[書]けません。",
        exampleEn: "I can only write in romaji."
      }
    ],
    quiz: [
      {
        question: "ひらがな ___ 読めません。(I can only read hiragana)",
        options: ["しか", "だけ", "を", "が"],
        answer: "しか"
      },
      {
        question: "What is the potential form of 飲みます?",
        options: ["飲めます", "飲まれます", "飲みられます", "飲めますか"],
        answer: "飲めます"
      }
    ]
  },
  {
    lesson: 28,
    title: "Lesson 28: Simultaneous Actions & Habits",
    patterns: [
      {
        pattern: "V1-ながら V2",
        explanation: "Doing V1 while doing V2. V2 is the primary action. V1 uses verb stem.",
        exampleJa: "音楽を聞きながら勉強します。",
        exampleFurigana: "おんがく[音楽]をき[聞]きながらべんきょう[勉強]します。",
        exampleEn: "I study while listening to music."
      },
      {
        pattern: "V-て います (habitual)",
        explanation: "Repetitive or habitual actions over a long period of time.",
        exampleJa: "休日はいつもテニスをしています。",
        exampleFurigana: "きゅうじつ[休日]はいつもテニスをしています。",
        exampleEn: "I always play tennis on holidays."
      }
    ],
    quiz: [
      {
        question: "テレビを ___ながら食事をします。",
        options: ["見", "見て", "見る", "見ながら"],
        answer: "見"
      },
      {
        question: "Mr. Miller teaches English at a university (occupation/habit):",
        options: [
          "ミラーさんは大学で英語を教えています。",
          "ミラーさんは大学で英語を教えます。",
          "ミラーさんは大学で英語を教えてあります。",
          "ミラーさんは大学で英語を教えておきます。"
        ],
        answer: "ミラーさんは大学で英語を教えています。"
      }
    ]
  },
  {
    lesson: 29,
    title: "Lesson 29: States & Completion",
    patterns: [
      {
        pattern: "Intransitive V-て います",
        explanation: "Describes a state resulting from an action. Used with intransitive verbs (e.g. broken, open).",
        exampleJa: "窓が閉まっています。電気がついています。",
        exampleFurigana: "まど[窓]がし[閉]まっています。でんき[電気]がついています。",
        exampleEn: "The window is closed. The light is on."
      },
      {
        pattern: "V-て しまいました",
        explanation: "Expresses complete completion of an action, or regret/sadness about an action that happened.",
        exampleJa: "宿題を全部やってしまいました。財布を忘れてしまいました。",
        exampleFurigana: "しゅくだい[宿題]をぜんぶ[全部]やってしまいました。さいふ[財布]をわす[忘]れてしまいました。",
        exampleEn: "I have finished all my homework. Unfortunately, I forgot my wallet."
      }
    ],
    quiz: [
      {
        question: "エアコンが ___ います。 (The AC is on)",
        options: ["つけて", "ついて", "つきます", "つけ"],
        answer: "ついて"
      },
      {
        question: "パスポートを ___ しまいました！ (I lost it)",
        options: ["なくして", "なくす", "なくした", "なくします"],
        answer: "なくして"
      }
    ]
  },
  {
    lesson: 30,
    title: "Lesson 30: Preparations & Resultant States",
    patterns: [
      {
        pattern: "Transitive V-て あります",
        explanation: "A state resulting from a purposeful action. Contrast with Lesson 29's intransitive V-て います.",
        exampleJa: "壁にカレンダーがかけてあります。",
        exampleFurigana: "かべ[壁]にカレンダーがかけてあります。",
        exampleEn: "A calendar is hung on the wall."
      },
      {
        pattern: "V-て おきます",
        explanation: "Doing an action in advance/preparation for future use, or leaving something as is.",
        exampleJa: "旅行の前に切符を買っておきます。",
        exampleFurigana: "りょこう[旅行]のまえ[前]にきっぷ[切符]をか[買]っておきます。",
        exampleEn: "I will buy tickets in advance before the trip."
      }
    ],
    quiz: [
      {
        question: "交番に地図がはって ___。",
        options: ["います", "あります", "おきます", "しまいます"],
        answer: "あります"
      },
      {
        question: "授業の前に予習をして ___ ください。",
        options: ["いて", "おいて", "しまって", "あって"],
        answer: "おいて"
      }
    ]
  }
];
