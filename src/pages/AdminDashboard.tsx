import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, VideoIcon, BookOpen, Youtube } from 'lucide-react';
import CreatePlaylistModal from '@/components/admin/CreatePlaylistModal';
import CreateVideoModal from '@/components/admin/CreateVideoModal';
import CreateQuizModal from '@/components/admin/CreateQuizModal';
import ImportFromYouTube from '@/components/admin/ImportFromYouTube';

interface AdminStats {
  totalPlaylists: number;
  totalVideos: number;
  totalUsers: number;
  totalEnrollments: number;
}

interface PlaylistWithVideoCount extends Tables<'playlists'> {
  videoCount: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<PlaylistWithVideoCount[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalPlaylists: 0,
    totalVideos: 0,
    totalUsers: 0,
    totalEnrollments: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showImportYouTube, setShowImportYouTube] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      // Fetch playlists with video count
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      // Get video counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);

          return {
            ...playlist,
            videoCount: count || 0
          };
        })
      );

      setPlaylists(playlistsWithCounts);

      // Fetch stats
      const [
        { count: playlistCount },
        { count: videoCount },
        { count: userCount },
        { count: enrollmentCount }
      ] = await Promise.all([
        supabase.from('playlists').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('playlist_enrollments').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalPlaylists: playlistCount || 0,
        totalVideos: videoCount || 0,
        totalUsers: userCount || 0,
        totalEnrollments: enrollmentCount || 0
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error loading admin data",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist? This will also delete all videos and quizzes.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      toast({
        title: "Playlist deleted",
        description: "The playlist has been successfully deleted.",
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error deleting playlist",
        description: "Please try again.",
        variant: "destructive",
      });
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportYouTube(true)} variant="outline">
            <Youtube className="w-4 h-4 mr-2" />
            Import from YouTube
          </Button>
          <Button onClick={() => setShowCreatePlaylist(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <VideoIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Playlists Management */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Manage Playlists</h2>
        
        {playlists.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No playlists created</CardTitle>
              <CardDescription>
                Create your first playlist to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card key={playlist.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{playlist.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {playlist.description}
                      </CardDescription>
                    </div>
                    <Badge variant={playlist.is_active ? "default" : "secondary"}>
                      {playlist.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Videos: {playlist.videoCount}</span>
                    <span>Level: {playlist.difficulty_level}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPlaylist(playlist.id);
                        setShowCreateVideo(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Video
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPlaylist(playlist.id);
                        setShowCreateQuiz(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Quiz
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deletePlaylist(playlist.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onSuccess={fetchAdminData}
      />

      <CreateVideoModal
        isOpen={showCreateVideo}
        onClose={() => setShowCreateVideo(false)}
        onSuccess={fetchAdminData}
        playlistId={selectedPlaylist}
      />

      <CreateQuizModal
        isOpen={showCreateQuiz}
        onClose={() => setShowCreateQuiz(false)}
        onSuccess={fetchAdminData}
        playlistId={selectedPlaylist}
      />

      <ImportFromYouTube
        isOpen={showImportYouTube}
        onClose={() => setShowImportYouTube(false)}
        onSuccess={fetchAdminData}
      />
    </div>
  );
};

export default AdminDashboard;
