
import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/video/VideoPlayer';
import VideoList from '@/components/video/VideoList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Star, Clock, Trophy, Play } from 'lucide-react';

interface PlaylistWithVideos extends Tables<'playlists'> {
  videos: Tables<'videos'>[];
}

interface UserProgress extends Tables<'user_progress'> {
  video: Tables<'videos'>;
}

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Tables<'videos'> | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);

  useEffect(() => {
    if (id && user) {
      fetchPlaylistData();
    }
  }, [id, user]);

  const fetchPlaylistData = async () => {
    if (!id || !user) return;

    try {
      // Fetch playlist with videos
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select(`
          *,
          videos (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (playlistError) throw playlistError;

      if (playlistData) {
        const sortedVideos = playlistData.videos.sort((a, b) => a.order_index - b.order_index);
        setPlaylist({ ...playlistData, videos: sortedVideos });
        setCurrentVideo(sortedVideos[0] || null);
      }

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('playlist_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('playlist_id', id)
        .single();

      setIsEnrolled(!!enrollment);
      setEnrollmentProgress(enrollment?.progress_percentage || 0);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          *,
          video:videos (*)
        `)
        .eq('user_id', user.id)
        .eq('playlist_id', id);

      setUserProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching playlist data:', error);
      toast({
        title: "Error loading playlist",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user || !playlist) return;

    try {
      const { error } = await supabase
        .from('playlist_enrollments')
        .insert({
          user_id: user.id,
          playlist_id: playlist.id
        });

      if (error) throw error;

      setIsEnrolled(true);
      toast({
        title: "Enrolled successfully!",
        description: "You can now start learning.",
      });
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: "Enrollment failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 2: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 3: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 4: return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case 5: return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!playlist) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {isEnrolled && currentVideo ? (
            <VideoPlayer
              video={currentVideo}
              playlist={playlist}
              userProgress={userProgress.find(p => p.video_id === currentVideo.id)}
              onProgressUpdate={fetchPlaylistData}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{playlist.title}</CardTitle>
                <CardDescription>{playlist.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getDifficultyColor(playlist.difficulty_level || 1)}>
                    <Star className="w-3 h-3 mr-1" />
                    {getDifficultyLabel(playlist.difficulty_level || 1)}
                  </Badge>
                  
                  {playlist.estimated_duration && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(playlist.estimated_duration / 60)}h {playlist.estimated_duration % 60}m
                    </Badge>
                  )}

                  <Badge variant="outline">
                    <Play className="w-3 h-3 mr-1" />
                    {playlist.videos.length} Videos
                  </Badge>
                </div>

                {!isEnrolled && (
                  <Button onClick={handleEnroll} className="w-full">
                    <Trophy className="w-4 h-4 mr-2" />
                    Enroll in Course
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {isEnrolled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Course Progress</span>
                    <span>{enrollmentProgress}%</span>
                  </div>
                  <Progress value={enrollmentProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <VideoList
            videos={playlist.videos}
            currentVideo={currentVideo}
            userProgress={userProgress}
            isEnrolled={isEnrolled}
            onVideoSelect={setCurrentVideo}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
