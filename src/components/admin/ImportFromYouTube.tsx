import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Youtube, Video, List, Clock, User } from 'lucide-react';

interface ImportFromYouTubeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportFromYouTube = ({ isOpen, onClose, onSuccess }: ImportFromYouTubeProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'url' | 'preview' | 'customize'>('url');
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [customization, setCustomization] = useState({
    title: '',
    description: '',
    difficultyLevel: 1,
    estimatedDuration: 0
  });

  const handleFetchYouTubeData = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-data', {
        body: { url: youtubeUrl }
      });

      if (error) throw error;

      setFetchedData(data);
      setCustomization({
        title: data.data.title || '',
        description: data.data.description || '',
        difficultyLevel: 1,
        estimatedDuration: data.data.duration ? Math.ceil(data.data.duration / 60) : 0
      });
      setStep('preview');

    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch YouTube data. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!user || !fetchedData) return;

    setLoading(true);
    try {
      if (fetchedData.type === 'playlist') {
        // Import as playlist
        const { data: playlist, error: playlistError } = await supabase
          .from('playlists')
          .insert({
            title: customization.title,
            description: customization.description,
            youtube_playlist_id: fetchedData.extractedIds.playlistId,
            difficulty_level: customization.difficultyLevel,
            estimated_duration: customization.estimatedDuration,
            created_by: user.id,
            thumbnail_url: fetchedData.data.thumbnailUrl
          })
          .select()
          .single();

        if (playlistError) throw playlistError;

        // Import videos
        if (fetchedData.data.videos && playlist) {
          const videosToInsert = fetchedData.data.videos.map((video: any, index: number) => ({
            title: video.title,
            description: video.description || '',
            youtube_video_id: video.id,
            playlist_id: playlist.id,
            order_index: index,
            duration: video.duration,
            thumbnail_url: video.thumbnailUrl
          }));

          const { error: videosError } = await supabase
            .from('videos')
            .insert(videosToInsert);

          if (videosError) throw videosError;
        }

        toast({
          title: "Playlist Imported!",
          description: `Successfully imported "${customization.title}" with ${fetchedData.data.videos?.length || 0} videos.`,
        });

      } else {
        // Import as single video (create playlist first)
        const { data: playlist, error: playlistError } = await supabase
          .from('playlists')
          .insert({
            title: customization.title,
            description: customization.description,
            youtube_playlist_id: `single_${fetchedData.extractedIds.videoId}`,
            difficulty_level: customization.difficultyLevel,
            estimated_duration: customization.estimatedDuration,
            created_by: user.id,
            thumbnail_url: fetchedData.data.thumbnailUrl
          })
          .select()
          .single();

        if (playlistError) throw playlistError;

        // Import single video
        const { error: videoError } = await supabase
          .from('videos')
          .insert({
            title: fetchedData.data.title,
            description: fetchedData.data.description || '',
            youtube_video_id: fetchedData.extractedIds.videoId,
            playlist_id: playlist.id,
            order_index: 0,
            duration: fetchedData.data.duration,
            thumbnail_url: fetchedData.data.thumbnailUrl
          });

        if (videoError) throw videoError;

        toast({
          title: "Video Imported!",
          description: `Successfully imported "${customization.title}".`,
        });
      }

      onSuccess();
      handleClose();

    } catch (error) {
      console.error('Error importing content:', error);
      toast({
        title: "Import Failed",
        description: "Could not import the content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('url');
    setYoutubeUrl('');
    setFetchedData(null);
    setCustomization({ title: '', description: '', difficultyLevel: 1, estimatedDuration: 0 });
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            Import from YouTube
          </DialogTitle>
          <DialogDescription>
            Import videos or playlists directly from YouTube to create learning content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'url' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports both individual videos and playlists
                </p>
              </div>
              
              <Button onClick={handleFetchYouTubeData} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Data...
                  </>
                ) : (
                  <>
                    <Youtube className="mr-2 h-4 w-4" />
                    Fetch YouTube Data
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'preview' && fetchedData && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={fetchedData.data.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {fetchedData.type === 'playlist' ? (
                          <List className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        <Badge variant="secondary">
                          {fetchedData.type === 'playlist' ? 'Playlist' : 'Video'}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{fetchedData.data.title}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {fetchedData.data.channelTitle && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {fetchedData.data.channelTitle}
                          </div>
                        )}
                        
                        {fetchedData.data.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(fetchedData.data.duration)}
                          </div>
                        )}
                        
                        {fetchedData.type === 'playlist' && fetchedData.data.itemCount && (
                          <Badge variant="outline">
                            {fetchedData.data.itemCount} videos
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {fetchedData.data.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('url')}>
                  Back
                </Button>
                <Button onClick={() => setStep('customize')} className="flex-1">
                  Customize & Import
                </Button>
              </div>
            </div>
          )}

          {step === 'customize' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-title">Title</Label>
                <Input
                  id="custom-title"
                  value={customization.title}
                  onChange={(e) => setCustomization(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="custom-description">Description</Label>
                <Textarea
                  id="custom-description"
                  value={customization.description}
                  onChange={(e) => setCustomization(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={customization.difficultyLevel.toString()}
                    onValueChange={(value) => setCustomization(prev => ({ ...prev, difficultyLevel: parseInt(value) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Beginner</SelectItem>
                      <SelectItem value="2">Easy</SelectItem>
                      <SelectItem value="3">Intermediate</SelectItem>
                      <SelectItem value="4">Advanced</SelectItem>
                      <SelectItem value="5">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={customization.estimatedDuration}
                    onChange={(e) => setCustomization(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('preview')}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Content'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromYouTube;
