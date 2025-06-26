
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Clock, TrendingUp } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface VideoProgressTrackerProps {
  video: Tables<'videos'>;
  playlistId: string;
  userProgress?: Tables<'user_progress'>;
  onProgressUpdate: () => void;
}

const VideoProgressTracker = ({ video, playlistId, userProgress, onProgressUpdate }: VideoProgressTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(userProgress?.video_watch_time || 0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef(0);

  useEffect(() => {
    if (video.duration) {
      setDuration(video.duration);
    }
  }, [video.duration]);

  useEffect(() => {
    if (duration > 0) {
      const percentage = Math.min((currentTime / duration) * 100, 100);
      setProgressPercentage(percentage);
    }
  }, [currentTime, duration]);

  // Simulate video playback (in a real app, this would integrate with the YouTube player)
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });

        setWatchTime(prev => prev + 1);

        // Save progress every 10 seconds
        if (Date.now() - lastSaveRef.current > 10000) {
          saveProgress();
          lastSaveRef.current = Date.now();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  const saveProgress = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          video_id: video.id,
          playlist_id: playlistId,
          is_video_completed: progressPercentage >= 90,
          video_watch_time: watchTime,
          is_quiz_completed: userProgress?.is_quiz_completed || false,
          quiz_score: userProgress?.quiz_score || null,
          quiz_attempts: userProgress?.quiz_attempts || 0,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      onProgressUpdate();

    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWatchTimePercentage = () => {
    if (!duration) return 0;
    return Math.min((watchTime / duration) * 100, 100);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Video Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Video Progress</span>
              <span className="text-sm text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Watch Time Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Total Watch Time
              </span>
              <span className="text-sm text-muted-foreground">
                {formatTime(watchTime)}
              </span>
            </div>
            <Progress value={getWatchTimePercentage()} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {Math.round(getWatchTimePercentage())}%
              </div>
              <div className="text-xs text-muted-foreground">Watched</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {userProgress?.quiz_score || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Quiz Score</div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            {progressPercentage >= 90 && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <TrendingUp className="w-3 h-3 mr-1" />
                Video Completed
              </Badge>
            )}
            
            {userProgress?.is_quiz_completed && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Quiz Passed
              </Badge>
            )}
            
            {userProgress?.token_issued && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Token Earned
              </Badge>
            )}
          </div>

          {/* Playback Controls (Demo) */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={togglePlayPause}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              {isPlaying ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={restart}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm hover:bg-muted/80"
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            * This is a demo progress tracker. In production, it would integrate with the actual YouTube player.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoProgressTracker;
