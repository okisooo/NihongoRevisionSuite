import { useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import FuriganaGameView from "./components/FuriganaGameView";
import { BookOpen, PenLine, Search, Settings as SettingsIcon } from "lucide-react";
import { Grammar, GrammarTabs, GrammarRevision, Lesson, Session, Settings } from "./study/StudyViews";
import { StudyHome, StudyRound } from "./study/StudyRound.jsx";
import { TextbookSet } from "./study/TextbookSet.jsx";
import { QuickReferenceProvider } from "./study/QuickReference.jsx";
import { PlayRoom, FlowPlay } from "./play/PlayRoom";
import { Library, CharacterPage } from "./study/Library";
import { KanjiHub, KanjiPlay, KanjiStage } from "./rush/KanjiViews";
import { KanaHub, KanaPlay, KanaStage } from "./rush/KanaViews";
import UpdatePrompt from "./components/UpdatePrompt";
import "./App.css";
import "./study/study.css";
import "./play/play.css";
import "./study/white-blue.css";

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

/** Links from older versions: /learn/12, /kanji/k12, /rush/stage/3 ... */
function Moved({ to }) {
  const params = useParams();
  const { search } = useLocation();
  const id = String(params.id || "").replace(/^[kr]/, "");
  return <Navigate replace to={to.replace(":id", id) + search} />;
}

function SentenceReading() {
  return (
    <>
      <div className="page page-tight">
        <h1 className="sr-only">sentence reading</h1>
        <GrammarTabs current="reading" />
      </div>
      <div className="legacy">
        <FuriganaGameView />
      </div>
    </>
  );
}

function MainNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main navigation">
      {[
        ["/", "study", BookOpen],
        ["/kanji", "kanji", PenLine],
        ["/grammar", "grammar", BookOpen],
        ["/library", "library", Search],
      ].map(([path, label, Icon]) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          // Kana and kanji are two halves of one tab.
          className={({ isActive }) => (isActive || (path === "/kanji" && pathname.startsWith("/kana")) || (path === "/" && pathname.startsWith("/study"))) ? "active" : ""}
        >
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Workspace() {
  const { pathname } = useLocation();
  return (
    <>
      <RouteFocus />
      <div className={`suite ${pathname === "/play-room" ? "is-room" : pathname === "/play" ? "is-playing" : ""} ${pathname.startsWith("/study/") ? "is-study-round" : ""}`}>
        <a
          className="skip-link"
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.focus();
          }}
        >
          skip to content
        </a>
        <header className="suite-header">
          <Link className="suite-brand" to="/">
            <BookOpen size={22} strokeWidth={1.8} />
            <span>
              revision<span className="brand-dot">.</span>
            </span>
          </Link>
          <MainNav />
          <Link className="settings-link" to="/settings" aria-label="settings">
            <SettingsIcon size={17} />
          </Link>
        </header>
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<StudyHome />} />
            <Route path="/study" element={<Navigate replace to="/" />} />
            <Route path="/study/round" element={<StudyRound />} />
            <Route path="/study/:setId" element={<TextbookSet />} />
            <Route path="/play-room" element={<PlayRoom />} />
            <Route path="/play" element={<FlowPlay />} />
            <Route path="/kanji" element={<KanjiHub />} />
            <Route path="/kanji/play" element={<KanjiPlay />} />
            <Route path="/kanji/stage/:n" element={<KanjiStage />} />
            <Route path="/kana" element={<KanaHub />} />
            <Route path="/kana/play" element={<KanaPlay />} />
            <Route path="/kana/stage/:id" element={<KanaStage />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/grammar/reading" element={<SentenceReading />} />
            <Route path="/grammar/:id/revise" element={<GrammarRevision />} />
            <Route path="/grammar/:id" element={<Lesson />} />
            <Route path="/session" element={<Session />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/characters/:id" element={<CharacterPage />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="/kanji/:id" element={<Moved to="/library/characters/:id" />} />
            <Route path="/learn" element={<Navigate replace to="/kanji" />} />
            <Route path="/learn/grammar" element={<Navigate replace to="/grammar" />} />
            <Route path="/learn/:id" element={<Moved to="/grammar/:id" />} />
            <Route path="/practice" element={<Navigate replace to="/kanji" />} />
            <Route path="/quiz" element={<Navigate replace to="/kanji" />} />
            <Route path="/review" element={<Navigate replace to="/" />} />
            <Route path="/rush" element={<Navigate replace to="/kanji" />} />
            <Route path="/rush/play" element={<Moved to="/kanji/play" />} />
            <Route path="/rush/stage/:id" element={<Moved to="/kanji/stage/:id" />} />
            <Route path="/dictionary" element={<Navigate replace to="/library" />} />
            <Route path="/grammar-reference" element={<Navigate replace to="/grammar" />} />
            <Route path="/furigana-game" element={<Navigate replace to="/grammar/reading" />} />
            <Route
              path="*"
              element={
                <div className="page">
                  <h1>this page has moved.</h1>
                  <Link to="/">back to study</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <UpdatePrompt />
      </div>
    </>
  );
}

function App() {
  return <HashRouter><QuickReferenceProvider><Workspace /></QuickReferenceProvider></HashRouter>;
}

export default App;
