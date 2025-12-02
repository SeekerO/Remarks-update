"use client"

import { useState, useEffect } from 'react';
import { Clock, Settings, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import examData from "@/csc.questions.json"

// Question Navigator Component with Pagination
function QuestionNavigator({
    questions,
    currentQuestion,
    userAnswers,
    onQuestionSelect
}: {
    questions: Array<[string, any]>;
    currentQuestion: number;
    userAnswers: Record<string, string>;
    onQuestionSelect: (idx: number) => void;
}) {
    const questionsPerPage = 20;
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    const currentPage = Math.floor(currentQuestion / questionsPerPage);
    const [page, setPage] = useState(currentPage);

    // Update page when current question changes
    useEffect(() => {
        setPage(Math.floor(currentQuestion / questionsPerPage));
    }, [currentQuestion, questionsPerPage]);

    const startIdx = page * questionsPerPage;
    const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
    const visibleQuestions = questions.slice(startIdx, endIdx);

    const handlePrevPage = () => {
        if (page > 0) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(page + 1);
    };

    return (
        <div className="mt-6 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Question Navigator</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page + 1} of {totalPages}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {visibleQuestions.map(([id], relativeIdx) => {
                    const idx = startIdx + relativeIdx;
                    const answered = !!userAnswers[id];
                    return (
                        <button
                            key={id}
                            onClick={() => onQuestionSelect(idx)}
                            className={`w-fit px-2 py-1 rounded-lg font-semibold transition-all ${currentQuestion === idx
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                                : answered
                                    ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handlePrevPage}
                        disabled={page === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={`w-10 h-10 rounded-lg font-semibold transition-all ${page === i
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleNextPage}
                        disabled={page === totalPages - 1}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-300">Current</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-800 border-2 border-green-300 dark:border-green-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-300">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-300">Not Answered</span>
                </div>
            </div>
        </div>
    );
}

export default function CSCExamMockTest() {
    const [showSettings, setShowSettings] = useState(true);
    const [examStarted, setExamStarted] = useState(false);
    const [examFinished, setExamFinished] = useState(false);

    // Settings
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState(30);
    const [showAnswerMode, setShowAnswerMode] = useState('after-exam'); // 'immediate' or 'after-exam'

    // Exam state
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState(0);

    const questions = Object.entries(examData);
    const totalQuestions = questions.length;

    useEffect(() => {
        if (examStarted && !examFinished && timerEnabled && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleFinishExam();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [examStarted, examFinished, timerEnabled, timeRemaining]);

    const handleStartExam = () => {
        setShowSettings(false);
        setExamStarted(true);
        if (timerEnabled) {
            setTimeRemaining(timerMinutes * 60);
        }
    };

    const handleAnswerSelect = (questionId: string, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleFinishExam = () => {
        setExamFinished(true);
    };

    const handleRestartExam = () => {
        setExamStarted(false);
        setExamFinished(false);
        setShowSettings(true);
        setUserAnswers({});
        setCurrentQuestion(0);
        setTimeRemaining(0);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach(([id, q]) => {
            if (userAnswers[id] === q.answer) correct++;
        });
        return { correct, total: totalQuestions, percentage: ((correct / totalQuestions) * 100).toFixed(1) };
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isCorrectAnswer = (questionId: string, option: string) => {
        return examData[questionId as keyof typeof examData].answer === option;
    };

    const getUserAnswer = (questionId: string) => {
        return userAnswers[questionId];
    };

    if (showSettings) {
        return (
            // Added dark:bg-gray-900 for gradient background
            <div className="min-h-screen w-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
                <div className="max-w-2xl mx-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-8 h-8 text-indigo-600" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Exam Settings</h1>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                            <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium">Total Questions: {totalQuestions}</p>
                        </div>

                        <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={timerEnabled}
                                    onChange={(e) => setTimerEnabled(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-lg font-medium text-gray-700 dark:text-gray-100">Enable Timer</span>
                            </label>

                            {timerEnabled && (
                                <div className="mt-4 ml-8">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Time Limit (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="180"
                                        value={timerMinutes}
                                        onChange={(e) => setTimerMinutes(Number(e.target.value))}
                                        className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
                            <label className="block text-lg font-medium dark:text-gray-100 text-gray-700 mb-3">
                                Show Correct Answers
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="answerMode"
                                        value="immediate"
                                        checked={showAnswerMode === 'immediate'}
                                        onChange={(e) => setShowAnswerMode(e.target.value)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-100">Immediately after each answer</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="answerMode"
                                        value="after-exam"
                                        checked={showAnswerMode === 'after-exam'}
                                        onChange={(e) => setShowAnswerMode(e.target.value)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-100">Only after finishing the exam</span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleStartExam}
                            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg"
                        >
                            Start Exam
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (examFinished) {
        const score = calculateScore();
        return (
            // Added dark mode background classes
            <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Exam Results</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg text-center">
                                <p className="text-sm text-green-600 dark:text-green-300 font-medium mb-2">Correct</p>
                                <p className="text-4xl font-bold text-green-700 dark:text-green-400">{score.correct}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg text-center">
                                <p className="text-sm text-red-600 dark:text-red-300 font-medium mb-2">Incorrect</p>
                                <p className="text-4xl font-bold text-red-700 dark:text-red-400">{score.total - score.correct}</p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900 p-6 rounded-lg text-center">
                                <p className="text-sm text-indigo-600 dark:text-indigo-300 font-medium mb-2">Score</p>
                                <p className="text-4xl font-bold text-indigo-700 dark:text-indigo-400">{score.percentage}%</p>
                            </div>
                        </div>

                        <button
                            onClick={handleRestartExam}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Restart Exam
                        </button>
                    </div>

                    <div className="space-y-4">
                        {questions.map(([id, q], idx) => {
                            const userAnswer = getUserAnswer(id);
                            const correctAnswer = q.answer;
                            const isCorrect = userAnswer === correctAnswer;

                            return (
                                <div key={id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        {isCorrect ? (
                                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Question {idx + 1}</p>
                                            <p className="text-gray-700 dark:text-gray-300">{q.question}</p>
                                        </div>
                                    </div>

                                    <div className="ml-9 space-y-2">
                                        {Object.entries(q.options).map(([key, value]) => {
                                            const isUserAnswer = userAnswer === key;
                                            const isCorrectOption = correctAnswer === key;

                                            let optionClass = "p-3 rounded-lg border-2 ";
                                            if (isCorrectOption) {
                                                optionClass += "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-700";
                                            } else if (isUserAnswer && !isCorrect) {
                                                optionClass += "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-700";
                                            } else {
                                                optionClass += "border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600";
                                            }

                                            return (
                                                <div key={key} className={optionClass}>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">{key.toUpperCase()}.</span> <span className="text-gray-700 dark:text-gray-200">{value}</span>
                                                    {isCorrectOption && (
                                                        <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">(Correct)</span>
                                                    )}
                                                    {isUserAnswer && !isCorrect && (
                                                        <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">(Your answer)</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const [currentId, currentQuestionData] = questions[currentQuestion];
    const hasAnswered = !!userAnswers[currentId];
    const showFeedback = showAnswerMode === 'immediate' && hasAnswered;

    return (
        // Added dark mode background classes
        <div className="overflow-y-auto min-h-screen w-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">CSC Mock Exam</h2>
                            <p className="text-gray-600 dark:text-gray-300">Question {currentQuestion + 1} of {totalQuestions}</p>
                        </div>

                        {timerEnabled && (
                            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900 px-4 py-2 rounded-lg">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                <span className={`font-mono text-xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question */}
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
                    <p className="text-xl text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">{currentQuestionData.question}</p>

                    <div className="space-y-3">
                        {Object.entries(currentQuestionData.options).map(([key, value]) => {
                            const isSelected = userAnswers[currentId] === key;
                            const isCorrect = currentQuestionData.answer === key;

                            let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";

                            if (showFeedback) {
                                if (isCorrect) {
                                    buttonClass += "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-700";
                                } else if (isSelected) {
                                    buttonClass += "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-700";
                                } else {
                                    buttonClass += "border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600";
                                }
                            } else {
                                buttonClass += isSelected
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900 dark:border-indigo-500"
                                    : "border-gray-300 dark:border-gray-600 text-gray-800 hover:border-indigo-400 dark:text-gray-100 hover:text-indigo-600 hover:dark:text-indigo-400";
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={() => !showFeedback && handleAnswerSelect(currentId, key)}
                                    disabled={showFeedback}
                                    className={buttonClass}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${showFeedback && isCorrect
                                            ? "bg-green-600 text-white"
                                            : showFeedback && isSelected
                                                ? "bg-red-600 text-white"
                                                : isSelected
                                                    ? "bg-indigo-600 text-white"
                                                    : "border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                                            }`}>
                                            {key.toUpperCase()}
                                        </div>
                                        <span className="flex-1 text-gray-800 dark:text-gray-100">{value}</span>
                                        {showFeedback && isCorrect && (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        )}
                                        {showFeedback && isSelected && !isCorrect && (
                                            <XCircle className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {showFeedback && (
                        <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${userAnswers[currentId] === currentQuestionData.answer
                            ? "bg-green-50 dark:bg-green-900 border-2 border-green-200 dark:border-green-700"
                            : "bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-700"
                            }`}>
                            <AlertCircle className={`w-6 h-6 flex-shrink-0 ${userAnswers[currentId] === currentQuestionData.answer ? "text-green-600" : "text-red-600"
                                }`} />
                            <div>
                                <p className={`font-semibold ${userAnswers[currentId] === currentQuestionData.answer ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
                                    }`}>
                                    {userAnswers[currentId] === currentQuestionData.answer ? "Correct!" : "Incorrect"}
                                </p>
                                {userAnswers[currentId] !== currentQuestionData.answer && (
                                    <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                                        The correct answer is: {currentQuestionData.answer.toUpperCase()}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-4">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-800 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                    >
                        Previous
                    </button>

                    {currentQuestion === totalQuestions - 1 ? (
                        <button
                            onClick={handleFinishExam}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                        >
                            Finish Exam
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Next
                        </button>
                    )}
                </div>

                {/* Question Navigator - Paginated */}
                <QuestionNavigator
                    questions={questions}
                    currentQuestion={currentQuestion}
                    userAnswers={userAnswers}
                    onQuestionSelect={setCurrentQuestion}
                />
            </div>
        </div>
    );
}