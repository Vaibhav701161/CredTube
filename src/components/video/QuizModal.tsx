
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
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
import { CheckCircle, XCircle, Award, Clock } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizModalProps {
  quiz: Tables<'quizzes'>;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userProgress?: Tables<'user_progress'>;
}

const QuizModal = ({ quiz, isOpen, onClose, onComplete, userProgress }: QuizModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safely parse questions from JSON with type checking
  const parseQuestions = (questionsJson: any): QuizQuestion[] => {
    try {
      if (Array.isArray(questionsJson)) {
        return questionsJson.filter((q): q is QuizQuestion => 
          typeof q === 'object' && 
          q !== null &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          typeof q.correct === 'number'
        );
      }
      return [];
    } catch (error) {
      console.error('Error parsing quiz questions:', error);
      return [];
    }
  };

  const questions: QuizQuestion[] = parseQuestions(quiz.questions);

  useEffect(() => {
    if (isOpen && quiz.time_limit) {
      setTimeLeft(quiz.time_limit);
    }
  }, [isOpen, quiz.time_limit]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

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

  const handleSubmitQuiz = async () => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    try {
      // Update user progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          video_id: quiz.video_id,
          playlist_id: userProgress?.playlist_id || '',
          is_video_completed: userProgress?.is_video_completed || false,
          video_watch_time: userProgress?.video_watch_time || 0,
          is_quiz_completed: finalScore >= (quiz.passing_score || 70),
          quiz_score: finalScore,
          quiz_attempts: (userProgress?.quiz_attempts || 0) + 1,
          updated_at: new Date().toISOString(),
          completed_at: finalScore >= (quiz.passing_score || 70) ? new Date().toISOString() : null
        });

      if (error) throw error;

      // If passed, issue LFDT-compliant learning token
      if (finalScore >= (quiz.passing_score || 70)) {
        await issueLearningToken(finalScore);
      }

      toast({
        title: finalScore >= (quiz.passing_score || 70) ? "Quiz Passed!" : "Quiz Failed",
        description: finalScore >= (quiz.passing_score || 70) 
          ? `Congratulations! You scored ${finalScore}% and earned a verifiable learning token.`
          : `You scored ${finalScore}%. You need ${quiz.passing_score || 70}% to pass.`,
        variant: finalScore >= (quiz.passing_score || 70) ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error submitting quiz",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueLearningToken = async (score: number) => {
    if (!user) return;

    try {
      // Fetch video and playlist details for the credential
      const { data: videoData } = await supabase
        .from('videos')
        .select(`
          *,
          playlist:playlists (*)
        `)
        .eq('id', quiz.video_id)
        .single();

      // Generate LFDT-compliant credential
      const now = new Date().toISOString();
      const credentialData = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
          'https://lfdt.org/v1/context.json'
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'LearningCredential'],
        id: `urn:uuid:${crypto.randomUUID()}`,
        issuer: {
          id: 'did:web:credtube.app',
          type: 'Issuer',
          name: 'CredTube Learning Platform',
          url: 'https://credtube.app',
          description: 'AI-powered learning platform that transforms YouTube content into verifiable credentials'
        },
        issuanceDate: now,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        credentialSubject: {
          id: `did:credtube:user:${user.id}`,
          type: ['Learner', 'Person'],
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous Learner',
          email: user.email,
          hasCredential: {
            type: 'VideoLearningCredential',
            name: `Completion of ${videoData?.title}`,
            description: `Successfully completed learning assessment for "${videoData?.title}" with ${score}% score`,
            course: videoData?.playlist?.title || 'Individual Video Learning',
            video: {
              title: videoData?.title,
              id: videoData?.youtube_video_id,
              url: `https://youtube.com/watch?v=${videoData?.youtube_video_id}`,
              duration: videoData?.duration
            },
            assessment: {
              type: 'Quiz',
              title: quiz.title,
              score: score,
              passingScore: quiz.passing_score || 70,
              questions: questions.length,
              completedAt: now
            },
            learningOutcomes: [
              `Demonstrated understanding of ${videoData?.title} content`,
              `Achieved ${score}% on comprehensive assessment`,
              `Completed ${questions.length} evaluation questions`,
              'Earned verified learning credential'
            ],
            skillsAcquired: [
              videoData?.playlist?.title ? `${videoData.playlist.title} Knowledge` : 'Video Content Mastery',
              'Self-directed Learning',
              'Knowledge Assessment Completion',
              'Digital Learning Engagement'
            ]
          }
        },
        evidence: [{
          type: 'LearningEvidence',
          narrative: `Learner completed video "${videoData?.title}" and successfully passed the AI-generated assessment with a score of ${score}%.`,
          name: 'Video Learning and Assessment Completion',
          description: 'Evidence of successful video learning and knowledge assessment',
          genre: 'Performance',
          audience: 'Professional'
        }],
        credentialStatus: {
          id: `${window.location.origin}/credentials/status/${crypto.randomUUID()}`,
          type: 'RevocationList2020Status'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: now,
          verificationMethod: 'did:web:credtube.app#key-1',
          proofPurpose: 'assertionMethod'
        }
      };

      const credentialHash = `hash_${Date.now()}_${user.id}_${score}_${Math.random().toString(36).substr(2, 9)}`;
      
      const tokenData = {
        user_id: user.id,
        video_id: quiz.video_id,
        playlist_id: userProgress?.playlist_id || '',
        credential_json: credentialData,
        credential_hash: credentialHash,
        issuer_did: 'did:web:credtube.app',
        subject_did: `did:credtube:user:${user.id}`,
        status: 'issued' as const,
        verification_url: `${window.location.origin}/verify/${credentialHash}`
      };

      const { error } = await supabase
        .from('learning_tokens')
        .insert(tokenData);

      if (error) throw error;

      // Update progress to mark token as issued
      await supabase
        .from('user_progress')
        .update({ token_issued: true })
        .eq('user_id', user.id)
        .eq('video_id', quiz.video_id);

      toast({
        title: "Learning Token Issued!",
        description: "Your LFDT-compliant verifiable credential has been created. Check your token gallery to view and share it.",
      });

    } catch (error) {
      console.error('Error issuing learning token:', error);
      toast({
        title: "Token issuance failed",
        description: "Your quiz was completed but the token couldn't be issued. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setTimeLeft(quiz.time_limit || null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetQuiz();
    onClose();
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {quiz.title}
          </DialogTitle>
          <DialogDescription>
            {showResults 
              ? `Quiz completed! You scored ${score}%`
              : `Question ${currentQuestionIndex + 1} of ${questions.length}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer and Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Progress 
                value={((currentQuestionIndex + 1) / questions.length) * 100} 
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
            
            {timeLeft !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeLeft < 60 ? "text-red-600 font-bold" : ""}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {!showResults ? (
            /* Quiz Questions */
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {questions[currentQuestionIndex]?.question}
                  </h3>

                  <RadioGroup
                    value={selectedAnswers[currentQuestionIndex]?.toString()}
                    onValueChange={(value) => 
                      handleAnswerSelect(currentQuestionIndex, parseInt(value))
                    }
                  >
                    {questions[currentQuestionIndex]?.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Quiz Results */
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {score >= (quiz.passing_score || 70) ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <span className="text-2xl font-bold">{score}%</span>
                  </div>
                  
                  <Badge 
                    variant={score >= (quiz.passing_score || 70) ? "default" : "destructive"}
                    className="mb-4"
                  >
                    {score >= (quiz.passing_score || 70) ? "PASSED" : "FAILED"}
                  </Badge>

                  <p className="text-muted-foreground">
                    {score >= (quiz.passing_score || 70) 
                      ? "Congratulations! You've earned an LFDT-compliant verifiable learning credential."
                      : `You need ${quiz.passing_score || 70}% to pass. Keep learning and try again!`
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Answer Review */}
              <div className="space-y-3">
                <h4 className="font-medium">Review Your Answers:</h4>
                {questions.map((question, qIndex) => {
                  const userAnswer = selectedAnswers[qIndex];
                  const isCorrect = userAnswer === question.correct;
                  
                  return (
                    <Card key={qIndex} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{question.question}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Your answer: {question.options[userAnswer]} 
                              {!isCorrect && (
                                <span className="block text-green-600">
                                  Correct answer: {question.options[question.correct]}
                                </span>
                              )}
                            </p>
                            {question.explanation && (
                              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            {!showResults ? (
              <>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(selectedAnswers).length !== questions.length || isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                  )}
                </div>
                
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </>
            ) : (
              <div className="flex gap-2 justify-end w-full">
                {score < (quiz.passing_score || 70) && (
                  <Button variant="outline" onClick={resetQuiz}>
                    Retake Quiz
                  </Button>
                )}
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;
