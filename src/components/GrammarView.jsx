import { useState } from 'react';
import { grammarData } from '../data/grammar';
import { Book, CheckCircle, ChevronDown, ChevronUp, Play } from 'lucide-react';

export default function GrammarView() {
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [activeTabs, setActiveTabs] = useState({}); // { lessonId: 'study' | 'quiz' }
  const [quizAnswers, setQuizAnswers] = useState({}); // { 'lessonId-questionIdx': selectedOption }
  const [quizSubmitted, setQuizSubmitted] = useState({}); // { 'lessonId-questionIdx': true }

  const toggleLesson = (id) => {
    setExpandedLesson(expandedLesson === id ? null : id);
  };

  const getActiveTab = (id) => {
    return activeTabs[id] || 'study';
  };

  const setActiveTab = (id, tab) => {
    setActiveTabs(prev => ({ ...prev, [id]: tab }));
  };

  // Helper to convert KANJI[FURIGANA] notation to standard HTML5 ruby tags
  const renderRuby = (text) => {
    if (!text) return '';
    // Matches text like わたし[私] or 漢字[かんじ]
    const html = text.replace(/([^\s\[]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const handleSelectOption = (lessonId, questionIdx, option) => {
    if (quizSubmitted[`${lessonId}-${questionIdx}`]) return;
    setQuizAnswers(prev => ({ ...prev, [`${lessonId}-${questionIdx}`]: option }));
  };

  const handleSubmitQuestion = (lessonId, questionIdx) => {
    setQuizSubmitted(prev => ({ ...prev, [`${lessonId}-${questionIdx}`]: true }));
  };

  const handleResetQuiz = (lessonId, quizLength) => {
    const updatedAnswers = { ...quizAnswers };
    const updatedSubmitted = { ...quizSubmitted };
    
    for (let i = 0; i < quizLength; i++) {
      delete updatedAnswers[`${lessonId}-${i}`];
      delete updatedSubmitted[`${lessonId}-${i}`];
    }

    setQuizAnswers(updatedAnswers);
    setQuizSubmitted(updatedSubmitted);
  };

  return (
    <div className="grammar-container">
      <div className="glass-panel">
        <div className="dictionary-header">
          <Book className="icon" size={28} />
          <h2>Grammar Lessons</h2>
          <span className="kanji-count">MNN 1 - 30</span>
        </div>

        <div className="lessons-list">
          {grammarData.map((lesson) => {
            const isExpanded = expandedLesson === lesson.lesson;
            const currentTab = getActiveTab(lesson.lesson);

            return (
              <div 
                key={lesson.lesson} 
                className={`lesson-card ${isExpanded ? 'expanded' : ''}`}
              >
                <div 
                  className="lesson-card-header" 
                  onClick={() => toggleLesson(lesson.lesson)}
                >
                  <div className="lesson-number">Lesson {lesson.lesson}</div>
                  <div className="lesson-title">{lesson.title}</div>
                  <div className="expand-icon">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="lesson-card-body">
                    {/* Tabs */}
                    <div className="lesson-tabs">
                      <button 
                        className={`lesson-tab-button ${currentTab === 'study' ? 'active' : ''}`}
                        onClick={() => setActiveTab(lesson.lesson, 'study')}
                      >
                        Study
                      </button>
                      <button 
                        className={`lesson-tab-button ${currentTab === 'quiz' ? 'active' : ''}`}
                        onClick={() => setActiveTab(lesson.lesson, 'quiz')}
                      >
                        Practice Quiz
                      </button>
                    </div>

                    {/* Study Content */}
                    {currentTab === 'study' && (
                      <div className="study-tab-content">
                        {lesson.patterns.map((item, idx) => (
                          <div key={idx} className="grammar-point">
                            <h4 className="pattern-header">{item.pattern}</h4>
                            <p className="pattern-explanation">{item.explanation}</p>
                            <div className="example-box">
                              <div className="example-ja">
                                <Play size={12} className="bullet" />
                                {renderRuby(item.exampleFurigana)}
                              </div>
                              <div className="example-en">{item.exampleEn}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quiz Content */}
                    {currentTab === 'quiz' && (
                      <div className="quiz-tab-content">
                        {lesson.quiz.map((q, questionIdx) => {
                          const key = `${lesson.lesson}-${questionIdx}`;
                          const selected = quizAnswers[key];
                          const submitted = quizSubmitted[key];
                          const isCorrect = selected === q.answer;

                          return (
                            <div key={questionIdx} className="grammar-quiz-item">
                              <div className="quiz-question">{questionIdx + 1}. {q.question}</div>
                              <div className="quiz-options">
                                {q.options.map((opt, optIdx) => {
                                  let optionClass = "quiz-option-button";
                                  if (selected === opt) optionClass += " selected";
                                  if (submitted) {
                                    if (opt === q.answer) optionClass += " correct";
                                    else if (selected === opt) optionClass += " incorrect";
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      className={optionClass}
                                      onClick={() => handleSelectOption(lesson.lesson, questionIdx, opt)}
                                      disabled={submitted}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {!submitted && selected && (
                                <button 
                                  className="submit-answer-button"
                                  onClick={() => handleSubmitQuestion(lesson.lesson, questionIdx)}
                                >
                                  Check Answer
                                </button>
                              )}
                              {submitted && (
                                <div className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle size={16} /> Correct!
                                    </>
                                  ) : (
                                    `Incorrect. Correct answer is: ${q.answer}`
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button 
                          className="action-button reset-quiz-button"
                          onClick={() => handleResetQuiz(lesson.lesson, lesson.quiz.length)}
                        >
                          Reset Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
