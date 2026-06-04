# Nihongo Revision Suite 🇯🇵

A desktop revision suite for Japanese language studies based on the **Minna no Nihongo (MNN)** curriculum. It includes a comprehensive Kanji dictionary (with touch/mouse writing practices), detailed grammar lessons (covering chapters 1 to 30), and vocabulary/grammar quizzes.

Built as a lightweight, standalone desktop app using **React (Vite)** packaged inside **Electron**.

---

## Key Features

1. **Minna no Nihongo Kanji (1 - 356):**
   - Clean, searchable dictionary interface.
   - Dynamic stroke animation order powered by `hanzi-writer`.
   - **Handwriting Practice Pad:** An HTML5 drawing canvas overlay. You can write freely without auto-deletion. Toggle guides like alignment grids (田 shape) or the background ghost template outline.
   - Falls back to static text view for components/radicals.
2. **Grammar Curriculum (Lessons 1 - 30):**
   - Curated grammar pattern breakdowns and explanations.
   - Real MNN example sentences using native HTML5 `<ruby>` tags for Furigana pronunciation lookups.
   - Mini-quizzes built directly into each lesson page to test comprehension.
3. **Widescreen Desktop-First UI:**
   - 16:9 aspect ratio (`1200 x 720` desktop frame).
   - Sidebar navigation.
   - Locked viewports to ensure no outer double scrollbars.
4. **Authentic Typography:**
   - Uses the **Klee One** handwriting/regular-script font for all Kanji displays, matching school textbooks rather than blocky digital Gothic fonts.

---

## Getting Started (Local Development)

To run the application locally on your machine, ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the repository
```bash
git clone https://github.com/okisooo/NihongoRevisionSuite.git
cd NihongoRevisionSuite
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run in Dev Mode
To run the app in your browser with Hot Module Replacement (HMR):
```bash
npm run dev
```

To run the app in the desktop Electron wrapper:
```bash
npm run start
```

### 4. Build & Package Standalone Executable (.exe)
To compile the React files and bundle them into a single, portable Windows `.exe` file:
```bash
npm run dist
```
The compiled output will be generated inside the `dist_electron/` directory as `Japanese Revision 1.0.0.exe`.

---

## Release Pipeline
This repository includes a GitHub Action configured to build and package the `.exe` automatically when a version tag is pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```
This triggers the runner, compiles the Electron client, and attaches the compiled `.exe` to the repository's **Releases** tab.
