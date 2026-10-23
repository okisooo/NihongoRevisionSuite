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
import { Sun, BookOpen, PenLine, Search } from "lucide-react";
import { Today, Grammar, GrammarTabs, Lesson, Session, Settings } from "./study/StudyViews";
import { Library, CharacterPage } from "./study/Library";
import { KanjiHub, KanjiPlay, KanjiStage } from "./rush/KanjiViews";
import { KanaHub, KanaPlay, KanaStage } from "./rush/KanaViews";
import UpdatePrompt from "./components/UpdatePrompt";
import "./App.css";
import "./study/study.css";

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
        ["/", "today", Sun],
        ["/kanji", "kana·kanji", PenLine],
        ["/grammar", "grammar", BookOpen],
        ["/library", "library", Search],
      ].map(([path, label, Icon]) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          // Kana and kanji are two halves of one tab.
          className={({ isActive }) => (isActive || (path === "/kanji" && pathname.startsWith("/kana")) ? "active" : "")}
        >
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function App() {
  return (
    <HashRouter>
      <RouteFocus />
      <div className="suite">
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
          <Link className="settings-link" to="/settings">
            settings
          </Link>
        </header>
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/kanji" element={<KanjiHub />} />
            <Route path="/kanji/play" element={<KanjiPlay />} />
            <Route path="/kanji/stage/:n" element={<KanjiStage />} />
            <Route path="/kana" element={<KanaHub />} />
            <Route path="/kana/play" element={<KanaPlay />} />
            <Route path="/kana/stage/:id" element={<KanaStage />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/grammar/reading" element={<SentenceReading />} />
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
                  <Link to="/">return to today</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <UpdatePrompt />
      </div>
    </HashRouter>
  );
}

export default App;
