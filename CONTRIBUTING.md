# Contributing to Nihongo Revision Suite 🤝

First off, thank you for considering contributing to the Nihongo Revision Suite! It is community contributions like yours that make this a robust learning tool.

---

## How to Contribute

### 1. Proposing Changes
If you've spotted a bug or have an idea for a feature, please search existing Issues before submitting a new one. When proposing a change:
- Describe the bug or feature clearly.
- Provide steps to reproduce (for bugs).
- Outline your proposed solution.

### 2. Making Changes Locally
1. **Fork the repository** on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/NihongoRevisionSuite.git
   cd NihongoRevisionSuite
   ```
3. Create a **feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
4. Set up the environment and run:
   ```bash
   npm install
   npm run start
   ```
5. Commit your changes:
   ```bash
   git commit -m "feat: add user feature"
   ```
6. Push to your branch:
   ```bash
   git push origin feature/my-new-feature
   ```
7. Open a **Pull Request (PR)** on the main repository.

---

## Data Structure Guides

### Updating Kanji Data
Kanji dictionary entries are located in [`src/data/kanji.js`](src/data/kanji.js). 

Format:
```javascript
{
  id: 1,                          // 1-based index
  kanji: "一",                     // Kanji character
  reading: "いち (ichi)",          // Hiragana/Romaji readings
  meaning: "one",                 // English meanings
  isRadical: false                // Set true if it is a component/radical
}
```

### Updating Grammar Data
Grammar lessons are located in [`src/data/grammar.js`](src/data/grammar.js).

Format:
```javascript
{
  lesson: 1,                      // Lesson number
  title: "Lesson Title",          // Lesson name
  patterns: [
    {
      pattern: "Grammar Pattern",
      explanation: "Description",
      exampleJa: "Japanese text",
      exampleFurigana: "わたし[私]は...", // Kanji[Furigana] bracket notation
      exampleEn: "English translation"
    }
  ],
  quiz: [
    {
      question: "Question text",
      options: ["Opt1", "Opt2", "Opt3", "Opt4"],
      answer: "Opt1"              // Correct option string matches option exactly
    }
  ]
}
```

---

## Code Quality Standards
- **Typography:** Always use Klee One and Mincho fonts for Japanese characters to maintain handwriting style compatibility.
- **Styling:** Maintain the clean, Light Mode UI design system. Check alignment, margins, and padding.
- **Viewports:** Ensure no scrollbars trigger on the outer window level (`overflow: hidden` on viewport parent containers).
