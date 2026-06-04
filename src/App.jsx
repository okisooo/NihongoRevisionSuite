import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import DictionaryView from './components/DictionaryView';
import GrammarView from './components/GrammarView';
import QuizView from './components/QuizView';
import KanjiDetail from './components/KanjiDetail';
import { BookA, Gamepad2, GraduationCap } from 'lucide-react';
import './App.css';

function App() {
  return (
    <HashRouter>
      <div className="app-container desktop-layout">
        
        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          <div className="brand">
            <h1>日本語</h1>
            <span>Revision Suite</span>
          </div>

          <div className="nav-items">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end
            >
              <BookA size={20} />
              <span>Kanji Dictionary</span>
            </NavLink>

            <NavLink 
              to="/grammar" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <GraduationCap size={20} />
              <span>Grammar Lessons</span>
            </NavLink>
            
            <NavLink 
              to="/quiz" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Gamepad2 size={20} />
              <span>Vocabulary Quiz</span>
            </NavLink>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DictionaryView />} />
            <Route path="/kanji/:id" element={<KanjiDetail />} />
            <Route path="/grammar" element={<GrammarView />} />
            <Route path="/quiz" element={<QuizView />} />
          </Routes>
        </main>

      </div>
    </HashRouter>
  );
}

export default App;
