
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Play, Award, Brain, Clock, Trophy, Sparkles, Target, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GuestQuizModal from './GuestQuizModal';
import GuestAssignmentModal from './GuestAssignmentModal';

interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
}

interface GuestVideoPlayerProps {
  videoData: VideoData;
}

interface Assignment {
  quiz?: any;
  practical?: any;
  reflection?: any;
}

const GuestVideoPlayer = ({ videoData }: GuestVideoPlayerProps) => {
  const { toast } = useToast();
  const [watchProgress, setWatchProgress] = useState(0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);

  useEffect(() => {
    // Auto-detect subject and topic from video title
    const autoDetectSubjectTopic = () => {
      const title = videoData.title.toLowerCase();
      const description = videoData.description.toLowerCase();
      
      // CS/Programming detection
      if (title.includes('javascript') || title.includes('js') || description.includes('javascript')) {
        setSubject('Computer Science');
        setTopic('JavaScript Programming');
      } else if (title.includes('python') || description.includes('python')) {
        setSubject('Computer Science');
        setTopic('Python Programming');
      } else if (title.includes('react') || description.includes('react')) {
        setSubject('Computer Science');
        setTopic('React Development');
      } else if (title.includes('algorithm') || description.includes('algorithm')) {
        setSubject('Computer Science');
        setTopic('Algorithms');
      } else if (title.includes('data structure') || description.includes('data structure')) {
        setSubject('Computer Science');
        setTopic('Data Structures');
      }
      // Add more auto-detection logic as needed
    };

    autoDetectSubjectTopic();
  }, [videoData]);

  const getEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`;
  };

  const markVideoComplete = async () => {
    setIsVideoCompleted(true);
    setWatchProgress(100);
    setShowAssessmentForm(true);
    
    toast({
      title: "🎯 Video Completed!",
      description: "Ready to generate your personalized assessment",
    });
  };

  const generateAssignment = async () => {
    setLoadingAssignment(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-assignment', {
        body: {
          videoTitle: videoData.title,
          videoDescription: videoData.description,
          duration: videoData.duration,
          guestMode: true,
          subject: subject,
          topic: topic
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data && data.success && data.assignment) {
        setAssignment(data.assignment);
        setShowQuiz(true);
        setShowAssessmentForm(false);
        
        toast({
          title: "🧠 Smart Assessment Generated!",
          description: "AI has created a progressive assessment tailored to your content.",
        });
      } else {
        throw new Error('Failed to generate assignment - invalid response format');
      }
    } catch (error) {
      console.error('Error generating assignment:', error);
      toast({
        title: "Assessment Generation Failed",
        description: "Could not generate assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAssignment(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    setQuizCompleted(true);
    setQuizScore(score);
    setShowQuiz(false);
    
    if (score >= 70) {
      setShowAssignment(true);
    }
    
    toast({
      title: score >= 70 ? "🏆 Assessment Mastered!" : "📚 Keep Learning",
      description: score >= 70 
        ? `Outstanding! You scored ${score}% and earned a learning credential.`
        : `You scored ${score}%. You need 70% to earn a credential.`,
      variant: score >= 70 ? "default" : "destructive",
    });
  };

  const simulateProgress = () => {
    if (watchProgress < 100) {
      setWatchProgress(prev => Math.min(prev + 20, 100));
      toast({
        title: "📈 Progress Updated",
        description: `Video progress: ${Math.min(watchProgress + 20, 100)}%`,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Video Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                <iframe
                  src={getEmbedUrl(videoData.id)}
                  title={videoData.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {videoData.title}
                    </h1>
                    {videoData.description && (
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                        {videoData.description}
                      </p>
                    )}
                  </div>
                  {isVideoCompleted && (
                    <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-lg">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(videoData.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Learning Mode
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-700 dark:text-slate-300">Watch Progress</span>
                    <span className="text-blue-600 dark:text-blue-400">{watchProgress}%</span>
                  </div>
                  <Progress value={watchProgress} className="h-2" />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {!isVideoCompleted && (
                    <>
                      <Button 
                        onClick={simulateProgress} 
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Continue Watching (+20%)
                      </Button>
                      <Button 
                        onClick={markVideoComplete} 
                        disabled={watchProgress < 80}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Video
                      </Button>
                    </>
                  )}

                  {isVideoCompleted && assignment && !quizCompleted && (
                    <Button 
                      onClick={() => setShowQuiz(true)} 
                      disabled={loadingAssignment}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {loadingAssignment ? 'Generating...' : 'Start Smart Assessment'}
                    </Button>
                  )}

                  {quizCompleted && quizScore !== null && quizScore >= 70 && (
                    <Button 
                      onClick={() => setShowAssignment(true)} 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      View Learning Credential
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Display */}
          {quizScore !== null && (
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Assessment Results</h3>
                    <p className="text-slate-600 dark:text-slate-300">Your performance on the progressive assessment</p>
                  </div>
                  <Badge 
                    variant={quizScore >= 70 ? "default" : "destructive"}
                    className="text-lg px-4 py-2"
                  >
                    {quizScore}%
                  </Badge>
                </div>
                {quizScore >= 70 && (
                  <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Trophy className="w-5 h-5" />
                      <span className="font-medium">Congratulations! You've earned a verifiable learning credential.</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                      Sign up to earn permanent, blockchain-verified credentials.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assessment Configuration */}
          {showAssessmentForm && (
            <Card className="border-2 border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <Sparkles className="h-5 w-5" />
                  Smart Assessment Setup
                </CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-300">
                  Help us generate more relevant questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">Subject Area</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Computer Science, Mathematics, Business"
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium">Specific Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., React Hooks, Linear Algebra, Marketing Strategy"
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
                <Button 
                  onClick={generateAssignment}
                  disabled={loadingAssignment}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {loadingAssignment ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generating Assessment...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Smart Assessment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Feature Highlights */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <BookOpen className="h-5 w-5" />
                Free Experience Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Progressive Assessments</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">Questions that increase in difficulty</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Smart Content Analysis</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">AI-generated questions based on your content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Coding Challenges</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">Technical assessments for CS content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Temporary Credentials</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300">Downloadable learning certificates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Prompt */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200">Unlock Full Potential</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Sign up for permanent, verifiable credentials that you can showcase professionally.
              </p>
              <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz Modal */}
      {assignment?.quiz && (
        <GuestQuizModal
          quiz={assignment.quiz}
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
          videoTitle={videoData.title}
        />
      )}

      {/* Assignment/Token Modal */}
      {quizCompleted && quizScore !== null && (
        <GuestAssignmentModal
          isOpen={showAssignment}
          onClose={() => setShowAssignment(false)}
          videoTitle={videoData.title}
          score={quizScore}
          passed={quizScore >= 70}
        />
      )}
    </div>
  );
};

export default GuestVideoPlayer;
