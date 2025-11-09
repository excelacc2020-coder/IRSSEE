import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Sidebar } from './components/Sidebar';
import { LESSON_PLAN } from './constants';
import type { Lesson, ChatMessage, AppStatus, LessonProgress, MockQuestion } from './types';
import { generateScenario, evaluateAnswer, getIrsReferences, generateMockExamQuestions } from './services/geminiService';

const App: React.FC = () => {
  const [lessons, setLessons] = useState<LessonProgress[]>(() => {
    const savedProgress = localStorage.getItem('lessonProgress');
    if (savedProgress) {
      return JSON.parse(savedProgress);
    }
    return LESSON_PLAN.map(lesson => ({ ...lesson, status: 'locked', score: 0, twistsCompleted: 0 }));
  });
  
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus>('IDLE');
  const [inputDisabled, setInputDisabled] = useState(true);
  const [mockExam, setMockExam] = useState<{
    questions: MockQuestion[];
    currentQuestionIndex: number;
    answers: string[];
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scenarioRef = useRef<{ scenario: string, question: string } | null>(null);

  useEffect(() => {
    const firstLockedIndex = lessons.findIndex(l => l.status !== 'passed');
    const initialIndex = firstLockedIndex === -1 ? lessons.length -1 : firstLockedIndex;

    setCurrentLessonIndex(initialIndex);
    
    setLessons(currentLessons => {
      const newLessons = [...currentLessons];
      if (initialIndex < newLessons.length && newLessons[initialIndex].status === 'locked') {
        newLessons[initialIndex].status = 'active';
      }
      return newLessons;
    });

    setMessages([{
      id: Date.now(),
      sender: 'system',
      text: "Welcome to your personalized IRS SEE Exam Prep Workflow. Click 'Start Today\\'s Lesson' to begin."
    }]);

    setAppStatus('IDLE');
    setInputDisabled(true);

  }, []);

  useEffect(() => {
    localStorage.setItem('lessonProgress', JSON.stringify(lessons));
  }, [lessons]);

  const addMessage = useCallback((sender: 'user' | 'ai' | 'system', text: string, references?: {title: string, uri: string}[]) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, text, references }]);
  }, []);

  const startLesson = useCallback(async () => {
    setAppStatus('GENERATING');
    setInputDisabled(true);
    const lesson = lessons[currentLessonIndex];
    if (!lesson) return;

    addMessage('system', `Starting lesson: ${lesson.topic} - ${lesson.description}`);

    try {
      const [scenarioData, irsData] = await Promise.all([
        generateScenario(lesson, lessons.filter(l => l.status === 'passed')),
        getIrsReferences(lesson),
      ]);
      
      scenarioRef.current = scenarioData;

      addMessage('ai', `A new client query has arrived.\n\n**Scenario:**\n${scenarioData.scenario}\n\n**Question:**\n${scenarioData.question}`);

      const notebookPrompt = `Analyze all of the following resources for paid tax preparers and tax professionals in context to\n\n**Phase:** ${lesson.phase}\n**Topic:** ${lesson.topic}: ${lesson.description}\n\nand your Output Must Include (with clear headings):\n• Applicable Rules\n• Calculations\n• Examples\n• Alternatives\n• Compliance\n• Planning\n• Pitfalls\n• ✅ Short Checklist`;
      addMessage('system', `**Study Prompt:**\n${notebookPrompt}`);

      if (irsData && irsData.length > 0) {
        addMessage('system', `**Official IRS Guidance:**`, irsData);
      } else {
        addMessage('system', `**Official IRS Guidance:**\nNo specific guidance found via search for this topic. Please refer to standard IRS publications.`);
      }

      setAppStatus('AWAITING_ANSWER');
      setInputDisabled(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addMessage('system', `Sorry, I encountered an error generating the lesson: ${errorMessage}. Please try again.`);
      setAppStatus('IDLE');
    }
  }, [currentLessonIndex, lessons, addMessage]);

  const displayCurrentMockQuestion = useCallback((questionData: MockQuestion, index: number, total: number) => {
    let questionText = `**Question ${index + 1} of ${total}** (Topic: ${questionData.topic})\n\n`;
    questionText += `${questionData.question}\n\n`;
    questionText += `A. ${questionData.options.A}\n`;
    questionText += `B. ${questionData.options.B}\n`;
    questionText += `C. ${questionData.options.C}\n`;
    questionText += `D. ${questionData.options.D}`;
    
    addMessage('ai', questionText);
    setInputDisabled(false);
  }, [addMessage]);

  const finishMockExam = useCallback((finalExamState: { questions: MockQuestion[], answers: string[] }) => {
    if (!finalExamState) return;

    let score = 0;
    const results: string[] = [];
    
    finalExamState.questions.forEach((q, i) => {
        const userAnswer = finalExamState.answers[i];
        if (userAnswer === q.correctAnswer) {
            score++;
        } else {
            results.push(
                `**Question ${i + 1} (Topic: ${q.topic})**\n- Your Answer: ${userAnswer || 'No Answer'}\n- Correct Answer: ${q.correctAnswer}: ${q.options[q.correctAnswer]}`
            );
        }
    });

    const totalQuestions = finalExamState.questions.length;
    const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(1) : 0;

    let summaryMessage = `**Mock Exam Completed!**\n\n- **Score:** ${score} out of ${totalQuestions} (${percentage}%)\n\n`;
    
    if (results.length > 0) {
        summaryMessage += `**Review your incorrect answers:**\n\n${results.join('\n\n')}`;
    } else {
        summaryMessage += "Excellent work! You answered all questions correctly!";
    }

    addMessage('system', summaryMessage);
    setAppStatus('MOCK_EXAM_COMPLETED');
    setInputDisabled(true);
  }, [addMessage]);
  
  const handleMockAnswer = useCallback((answer: string) => {
    if (!mockExam) return;

    const upperCaseAnswer = answer.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(upperCaseAnswer)) {
        addMessage('system', "Invalid answer. Please enter A, B, C, or D.");
        return;
    }

    addMessage('user', answer);
    setInputDisabled(true);

    const updatedAnswers = [...mockExam.answers, upperCaseAnswer];
    const nextIndex = mockExam.currentQuestionIndex + 1;
    
    const newState = { ...mockExam, answers: updatedAnswers, currentQuestionIndex: nextIndex };
    setMockExam(newState);

    if (nextIndex < mockExam.questions.length) {
        displayCurrentMockQuestion(mockExam.questions[nextIndex], nextIndex, mockExam.questions.length);
    } else {
        finishMockExam(newState);
    }
  }, [mockExam, addMessage, displayCurrentMockQuestion, finishMockExam]);

  const handleSendMessage = useCallback(async (userMessage: string) => {
    if (appStatus === 'MOCK_EXAM_IN_PROGRESS') {
      handleMockAnswer(userMessage);
      return;
    }

    if (!scenarioRef.current) return;

    addMessage('user', userMessage);
    setAppStatus('EVALUATING');
    setInputDisabled(true);

    try {
      const evaluation = await evaluateAnswer(
        scenarioRef.current.scenario,
        userMessage,
        lessons.filter((l) => l.status === 'passed')
      );

      const score = evaluation.totalScore ?? 0;
      const scores = evaluation.scores ?? { rules: 0, calculations: 0, compliance: 0, alternatives: 0, planning: 0, clarity: 0 };
      const feedbackDetails = evaluation.feedback ?? { good: [], corrections: [], takeaways: [] };
      const knowledgePoints = evaluation.knowledgePoints ?? [];

      let feedback = `**Score: ${score}%**\n\n`;
      feedback += `**Rubric Breakdown:**\n- Rules & Authority: ${scores.rules ?? 0}% \n- Calculations: ${scores.calculations ?? 0}% \n- Compliance: ${scores.compliance ?? 0}% \n- Alternatives: ${scores.alternatives ?? 0}% \n- Planning: ${scores.planning ?? 0}% \n- Clarity: ${scores.clarity ?? 0}%\n\n`;
      feedback += `**What you did well:**\n${(feedbackDetails.good ?? []).map((item) => `- ${item}`).join('\n')}\n\n`;
      feedback += `**Corrections:**\n${(feedbackDetails.corrections ?? []).map((item) => `- ${item}`).join('\n')}\n\n`;
      feedback += `**Key takeaways:**\n${(feedbackDetails.takeaways ?? []).map((item) => `- ${item}`).join('\n')}`;
      addMessage('ai', feedback);

      if (score >= 90) {
        const currentTwists = lessons[currentLessonIndex].twistsCompleted;
        if (currentTwists < 2) {
          addMessage('system', `Excellent work! You've scored ${score}%. Let's cement your knowledge with a twist on the scenario.`);
          setLessons((prev) => {
            const newLessons = [...prev];
            newLessons[currentLessonIndex].twistsCompleted = currentTwists + 1;
            return newLessons;
          });
          setAppStatus('GENERATING');

          const newScenarioData = await generateScenario(
            lessons[currentLessonIndex],
            lessons.filter((l) => l.status === 'passed'),
            scenarioRef.current.scenario,
            true
          );
          scenarioRef.current = newScenarioData;
          addMessage('ai', `**Twist ${currentTwists + 1}:**\n${newScenarioData.scenario}\n\n**Question:**\n${newScenarioData.question}`);
          setAppStatus('AWAITING_ANSWER');
          setInputDisabled(false);
        } else {
          addMessage('system', `Congratulations! You've mastered this topic with a score of ${score}%.`);
          setLessons((prev) => {
            const newLessons = [...prev];
            newLessons[currentLessonIndex].status = 'passed';
            newLessons[currentLessonIndex].score = score;
            return newLessons;
          });
          setAppStatus('TOPIC_PASSED');
        }
      } else {
        addMessage('system', `Your score is ${score}%. You need 90% to pass. Review the feedback and the model answer below. Let's try this topic again.`);
        
        if (knowledgePoints && knowledgePoints.length > 0) {
            addMessage('ai', `**Key Knowledge Points to Review:**\n${knowledgePoints.map((item) => `- ${item}`).join('\n')}`);
        }

        if (evaluation.detailedExplanation) {
            addMessage('ai', `**Model Answer & Explanation:**\n${evaluation.detailedExplanation}`);
        }

        addMessage('ai', `Let's try that again. Here is the original scenario:\n\n**Scenario:**\n${scenarioRef.current.scenario}\n\n**Question:**\n${scenarioRef.current.question}`);
        setAppStatus('AWAITING_ANSWER');
        setInputDisabled(false);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      addMessage('system', `Sorry, I encountered an error evaluating your answer: ${errorMessage}. Please try again.`);
      setAppStatus('AWAITING_ANSWER');
      setInputDisabled(false);
    }
  }, [addMessage, currentLessonIndex, lessons, appStatus, handleMockAnswer]);

  const handleNextLesson = useCallback(() => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < lessons.length) {
      setCurrentLessonIndex(nextIndex);
      setLessons(prev => {
        const newLessons = [...prev];
        if (newLessons[nextIndex].status === 'locked') {
          newLessons[nextIndex].status = 'active';
        }
        return newLessons;
      });
      setMessages([]);
      scenarioRef.current = null;
      addMessage('system', "Ready for the next challenge? Click 'Start Today\\'s Lesson' when you are ready.");
      setAppStatus('IDLE');
    } else {
      addMessage('system', 'You have completed all lessons! Congratulations!');
      setAppStatus('COMPLETED');
    }
  }, [currentLessonIndex, lessons, addMessage]);
  
  const handleSelectLesson = useCallback((index: number) => {
    if (index === currentLessonIndex) return;

    setLessons(prevLessons => {
        const newLessons = [...prevLessons];
        if (newLessons[currentLessonIndex].status === 'active') {
            newLessons[currentLessonIndex].status = 'locked';
        }
        if (newLessons[index].status !== 'passed') {
            newLessons[index].status = 'active';
        }
        return newLessons;
    });

    setCurrentLessonIndex(index);
    scenarioRef.current = null;
    setMessages([{
        id: Date.now(),
        sender: 'system',
        text: "You've selected a new lesson. Click 'Start Today\\'s Lesson' when you are ready."
    }]);
    setAppStatus('IDLE');
    setInputDisabled(true);
    setIsSidebarOpen(false);

  }, [currentLessonIndex]);

  const handleStartMockExam = useCallback(async () => {
    const passedLessons = lessons.filter(l => l.status === 'passed');
    if (passedLessons.length < 5) {
        addMessage('system', 'You need to pass at least 5 topics to start a mock exam.');
        return;
    }

    setAppStatus('GENERATING_MOCK_EXAM');
    setMessages([]);
    addMessage('system', 'Generating a mock exam based on your mastered topics. This may take a moment...');
    setInputDisabled(true);
    setIsSidebarOpen(false);

    try {
        const questions = await generateMockExamQuestions(passedLessons);
        if (questions && questions.length > 0) {
            setMockExam({
                questions,
                currentQuestionIndex: 0,
                answers: [],
            });
            setAppStatus('MOCK_EXAM_IN_PROGRESS');
            displayCurrentMockQuestion(questions[0], 0, questions.length);
        } else {
            throw new Error("The generated exam had no questions.");
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        addMessage('system', `Sorry, I encountered an error generating the mock exam: ${errorMessage}. Please try again later.`);
        setAppStatus('IDLE');
    }
  }, [lessons, addMessage, displayCurrentMockQuestion]);

  const handleExitMockExam = useCallback(() => {
    setMockExam(null);
    setAppStatus('IDLE');
    setMessages([{
      id: Date.now(),
      sender: 'system',
      text: "You have returned to the main lesson plan. Click 'Start Today\\'s Lesson' to continue where you left off."
    }]);
  }, []);

  return (
    <div className="flex h-screen font-sans bg-slate-800 overflow-hidden">
       {isSidebarOpen && (
        <div
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
        />
      )}
      <Sidebar 
        lessons={lessons} 
        currentLessonIndex={currentLessonIndex}
        onSelectLesson={handleSelectLesson}
        onStartMockExam={handleStartMockExam}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col h-full">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          appStatus={appStatus}
          onStartLesson={startLesson}
          onNextLesson={handleNextLesson}
          inputDisabled={inputDisabled}
          onExitMockExam={handleExitMockExam}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          currentLessonTopic={lessons[currentLessonIndex]?.topic}
        />
      </main>
    </div>
  );
};

export default App;