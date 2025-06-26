
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import PlaylistCard from "./PlaylistCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, PlayCircle, CheckCircle, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlaylistWithEnrollment extends Tables<'playlists'> {
  enrollmentData?: {
    enrolled: boolean;
    progress: number;
    completed: boolean;
  };
}

interface DashboardStats {
  totalVideosWatched: number;
  totalQuizzesCompleted: number;
  totalTokensEarned: number;
  activeEnrollments: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistWithEnrollment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVideosWatched: 0,
    totalQuizzesCompleted: 0,
    totalTokensEarned: 0,
    activeEnrollments: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      // Fetch user enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('playlist_enrollments')
        .select('*')
        .eq('user_id', user!.id);

      if (enrollmentsError) throw enrollmentsError;

      // Fetch user stats
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('is_video_completed, is_quiz_completed, token_issued')
        .eq('user_id', user!.id);

      if (progressError) throw progressError;

      const { data: tokensData, error: tokensError } = await supabase
        .from('learning_tokens')
        .select('id')
        .eq('user_id', user!.id);

      if (tokensError) throw tokensError;

      // Calculate stats
      const videosWatched = progressData?.filter(p => p.is_video_completed).length || 0;
      const quizzesCompleted = progressData?.filter(p => p.is_quiz_completed).length || 0;
      const tokensEarned = tokensData?.length || 0;
      const activeEnrollments = enrollments?.length || 0;

      setStats({
        totalVideosWatched: videosWatched,
        totalQuizzesCompleted: quizzesCompleted,
        totalTokensEarned: tokensEarned,
        activeEnrollments
      });

      // Combine playlists with enrollment data
      const playlistsWithEnrollment: PlaylistWithEnrollment[] = playlistsData?.map(playlist => {
        const enrollment = enrollments?.find(e => e.playlist_id === playlist.id);
        return {
          ...playlist,
          enrollmentData: enrollment ? {
            enrolled: true,
            progress: enrollment.progress_percentage || 0,
            completed: !!enrollment.completed_at
          } : {
            enrolled: false,
            progress: 0,
            completed: false
          }
        };
      }) || [];

      setPlaylists(playlistsWithEnrollment);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.user_metadata?.name || 'Learner'}!
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey and earn more credentials
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Watched</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideosWatched}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzesCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokensEarned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Playlists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Available Courses</h2>
        </div>
        
        {playlists.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No courses available</CardTitle>
              <CardDescription>
                There are no courses available at the moment. Check back later!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                enrollmentData={playlist.enrollmentData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
