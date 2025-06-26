
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, Lock, Award } from 'lucide-react';

interface VideoListProps {
  videos: Tables<'videos'>[];
  currentVideo: Tables<'videos'> | null;
  userProgress: Tables<'user_progress'>[];
  isEnrolled: boolean;
  onVideoSelect: (video: Tables<'videos'>) => void;
}

const VideoList = ({ videos, currentVideo, userProgress, isEnrolled, onVideoSelect }: VideoListProps) => {
  const getVideoProgress = (videoId: string) => {
    return userProgress.find(p => p.video_id === videoId);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Course Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {videos.map((video, index) => {
          const progress = getVideoProgress(video.id);
          const isCurrentVideo = currentVideo?.id === video.id;
          const isCompleted = progress?.is_video_completed;
          const hasQuizCompleted = progress?.is_quiz_completed;

          return (
            <div
              key={video.id}
              className={`p-3 rounded-lg border transition-colors ${
                isCurrentVideo
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {!isEnrolled ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Play className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    {hasQuizCompleted && (
                      <Award className="h-3 w-3 text-yellow-600" />
                    )}
                  </div>

                  <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                    {video.title}
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(video.duration)}
                    </span>

                    {progress?.quiz_score !== null && (
                      <Badge
                        variant={progress.quiz_score >= 70 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {progress.quiz_score}%
                      </Badge>
                    )}
                  </div>

                  {isEnrolled && !isCurrentVideo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVideoSelect(video)}
                      className="mt-2 h-6 px-2 text-xs w-full"
                    >
                      Watch
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default VideoList;
