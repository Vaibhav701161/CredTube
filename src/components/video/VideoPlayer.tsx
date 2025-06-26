import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, Award } from 'lucide-react';
import QuizModal from './QuizModal';
import AIAssignmentGenerator from './AIAssignmentGenerator';
import VideoProgressTracker from './VideoProgressTracker';

interface VideoPlayerProps {
  video: Tables<'videos'>;
  playlist: Tables<'playlists'>;
  userProgress?: Tables<'user_progress'>;
  onProgressUpdate: () => void;
}

const VideoPlayer = ({ video, playlist, userProgress, onProgressUpdate }: VideoPlayerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<Tables<'quizzes'> | null>(null);
  const [watchStartTime, setWatchStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (video) {
      setWatchStartTime(Date.now());
      fetchQuiz();
    }
  }, [video.id]);

  const fetchQuiz = async () => {
    try {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('video_id', video.id)
        .eq('is_active', true)
        .single();
      
      setQuiz(quizData);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    }
  };

  const markVideoComplete = async () => {
    if (!user) return;

    const watchTime = Math.floor((Date.now() - watchStartTime) / 1000);

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          video_id: video.id,
          playlist_id: playlist.id,
          is_video_completed: true,
          video_watch_time: (userProgress?.video_watch_time || 0) + watchTime,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Video completed!",
        description: quiz ? "Now take the quiz to earn your credential." : "Great job!",
      });

      onProgressUpdate();

      if (quiz && !userProgress?.is_quiz_completed) {
        setShowQuiz(true);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error updating progress",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    onProgressUpdate();
  };

  const getEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {video.title}
            {userProgress?.is_video_completed && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </CardTitle>
          {video.description && (
            <CardDescription>{video.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video">
            <iframe
              src={getEmbedUrl(video.youtube_video_id)}
              title={video.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {!userProgress?.is_video_completed && (
              <Button onClick={markVideoComplete}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}

            {quiz && userProgress?.is_video_completed && (
              <Button
                onClick={() => setShowQuiz(true)}
                variant={userProgress?.is_quiz_completed ? "outline" : "default"}
              >
                <Award className="w-4 h-4 mr-2" />
                {userProgress?.is_quiz_completed ? 'Retake Quiz' : 'Take Quiz'}
              </Button>
            )}
          </div>

          {userProgress?.quiz_score !== null && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Quiz Score:</span>
                <Badge variant={userProgress.quiz_score >= 70 ? "default" : "destructive"}>
                  {userProgress.quiz_score}%
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assignment Generator */}
      <AIAssignmentGenerator 
        video={video} 
        userProgress={userProgress} 
      />

      {/* Enhanced Progress Tracker */}
      <VideoProgressTracker
        video={video}
        playlistId={playlist.id}
        userProgress={userProgress}
        onProgressUpdate={onProgressUpdate}
      />

      {quiz && (
        <QuizModal
          quiz={quiz}
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
          userProgress={userProgress}
        />
      )}
    </>
  );
};

export default VideoPlayer;
