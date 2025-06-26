
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Brain, Code, FileText, Timer, ArrowLeft, ArrowRight } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  type?: 'coding' | 'written' | 'standard';
}

interface GuestQuizModalProps {
  quiz: {
    questions: QuizQuestion[];
    title: string;
    passingScore?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
  videoTitle: string;
}

const GuestQuizModal = ({ quiz, isOpen, onClose, onComplete, videoTitle }: GuestQuizModalProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const questions = quiz.questions || [];
  const passingScore = quiz.passingScore || 70;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
  };

  const handleComplete = () => {
    onComplete(score);
    resetQuiz();
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleClose = () => {
    resetQuiz();
    onClose();
  };

  const getDifficultyLevel = (index: number) => {
    if (index === 0) return { label: 'Basic', color: 'bg-green-500', icon: '🌱' };
    if (index === 1) return { label: 'Intermediate', color: 'bg-yellow-500', icon: '🌿' };
    if (index === 2) return { label: 'Advanced', color: 'bg-orange-500', icon: '🌳' };
    return { label: 'Expert', color: 'bg-red-500', icon: '🔥' };
  };

  const getQuestionTypeIcon = (type?: string) => {
    switch (type) {
      case 'coding': return <Code className="w-5 h-5" />;
      case 'written': return <FileText className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
                  <Brain className="h-6 w-6" />
                </div>
                Progressive Assessment
              </DialogTitle>
              <DialogDescription className="text-lg mt-2">
                {showResults 
                  ? `Assessment completed! You scored ${score}%`
                  : `${videoTitle}`
                }
              </DialogDescription>
            </div>
            {!showResults && (
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-4 py-2 text-lg">
                  <Timer className="w-4 h-4 mr-2" />
                  Question {currentQuestionIndex + 1}/{questions.length}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!showResults ? (
            <div className="space-y-8 py-6">
              {/* Progress Indicator */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={((currentQuestionIndex + 1) / questions.length) * 100} 
                  className="h-3"
                />
                
                {/* Difficulty Indicator */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const difficulty = getDifficultyLevel(currentQuestionIndex);
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${difficulty.color} rounded-full`}></div>
                        <span className="text-sm font-medium">{difficulty.icon} {difficulty.label} Level</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Question Card */}
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white shrink-0">
                        {getQuestionTypeIcon(currentQuestion?.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-white">
                          {currentQuestion?.question}
                        </h3>
                        {currentQuestion?.type === 'coding' && (
                          <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <Code className="w-3 h-3 mr-1" />
                            Coding Challenge
                          </Badge>
                        )}
                        {currentQuestion?.type === 'written' && (
                          <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                            <FileText className="w-3 h-3 mr-1" />
                            Written Assessment
                          </Badge>
                        )}
                      </div>
                    </div>

                    <RadioGroup
                      value={selectedAnswers[currentQuestionIndex]?.toString()}
                      onValueChange={(value) => 
                        handleAnswerSelect(currentQuestionIndex, parseInt(value))
                      }
                      className="space-y-4"
                    >
                      {currentQuestion?.options.map((option, index) => (
                        <div 
                          key={index} 
                          className="flex items-start space-x-4 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600"
                        >
                          <RadioGroupItem 
                            value={index.toString()} 
                            id={`option-${index}`}
                            className="mt-1 shrink-0"
                          />
                          <Label 
                            htmlFor={`option-${index}`} 
                            className="flex-1 cursor-pointer text-slate-800 dark:text-slate-200 leading-relaxed"
                          >
                            <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Results Section */
            <div className="space-y-8 py-6">
              {/* Score Display */}
              <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      {score >= passingScore ? (
                        <CheckCircle className="h-16 w-16 text-green-300" />
                      ) : (
                        <XCircle className="h-16 w-16 text-red-300" />
                      )}
                      <div>
                        <div className="text-5xl font-bold">{score}%</div>
                        <div className="text-xl opacity-90">Final Score</div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={score >= passingScore ? "default" : "destructive"}
                      className="text-lg px-6 py-2 bg-white text-slate-900"
                    >
                      {score >= passingScore ? "🎉 PASSED" : "📚 NEEDS IMPROVEMENT"}
                    </Badge>

                    <p className="text-lg opacity-90 max-w-md mx-auto">
                      {score >= passingScore 
                        ? "Outstanding performance! You've demonstrated mastery of the content and earned a verifiable learning credential."
                        : `You need ${passingScore}% to pass. Keep learning and try again!`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Answer Review */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Answer Review</h4>
                <div className="grid gap-4">
                  {questions.map((question, qIndex) => {
                    const userAnswer = selectedAnswers[qIndex];
                    const isCorrect = userAnswer === question.correct;
                    const difficulty = getDifficultyLevel(qIndex);
                    
                    return (
                      <Card key={qIndex} className={`border-l-4 ${isCorrect ? 'border-l-green-500 bg-green-50 dark:bg-green-950' : 'border-l-red-500 bg-red-50 dark:bg-red-950'}`}>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="flex items-center gap-2 shrink-0">
                                {isCorrect ? (
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                  <XCircle className="h-6 w-6 text-red-600" />
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {difficulty.icon} {difficulty.label}
                                </Badge>
                              </div>
                              <div className="flex-1 space-y-2">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {question.question}
                                </p>
                                <div className="space-y-1 text-sm">
                                  <p className={isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                    <strong>Your answer:</strong> {question.options[userAnswer]}
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-green-700 dark:text-green-300">
                                      <strong>Correct answer:</strong> {question.options[question.correct]}
                                    </p>
                                  )}
                                </div>
                                {question.explanation && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                      <strong>Explanation:</strong> {question.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-6 bg-slate-50 dark:bg-slate-800 -mx-6 px-6 -mb-6 pb-6">
          {!showResults ? (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex gap-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length !== questions.length}
                    className="px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-6"
                  >
                    Submit Assessment
                  </Button>
                )}
                
                <Button variant="outline" onClick={handleClose} className="px-6">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button 
                onClick={handleComplete}
                className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Continue to Results
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestQuizModal;
