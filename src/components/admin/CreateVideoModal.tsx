
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playlistId: string | null;
}

const CreateVideoModal = ({ isOpen, onClose, onSuccess, playlistId }: CreateVideoModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playlists, setPlaylists] = useState<Tables<'playlists'>[]>([]);
  const [videos, setVideos] = useState<Tables<'videos'>[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_video_id: '',
    playlist_id: playlistId || '',
    order_index: 1,
    duration: 0,
    thumbnail_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
      if (playlistId) {
        setFormData(prev => ({ ...prev, playlist_id: playlistId }));
        fetchVideosForPlaylist(playlistId);
      }
    }
  }, [isOpen, playlistId]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchVideosForPlaylist = async (selectedPlaylistId: string) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('playlist_id', selectedPlaylistId)
        .order('order_index');

      if (error) throw error;
      setVideos(data || []);
      
      // Set next order index
      const maxOrder = data?.reduce((max, video) => Math.max(max, video.order_index), 0) || 0;
      setFormData(prev => ({ ...prev, order_index: maxOrder + 1 }));
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('videos')
        .insert({
          ...formData,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Video created",
        description: "The video has been successfully added to the playlist.",
      });

      setFormData({
        title: '',
        description: '',
        youtube_video_id: '',
        playlist_id: playlistId || '',
        order_index: 1,
        duration: 0,
        thumbnail_url: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Error creating video",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Video</DialogTitle>
          <DialogDescription>
            Add a new video to a playlist
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist_id">Playlist *</Label>
            <Select
              value={formData.playlist_id}
              onValueChange={(value) => {
                setFormData({ ...formData, playlist_id: value });
                fetchVideosForPlaylist(value);
              }}
              disabled={!!playlistId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter video title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter video description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube_video_id">YouTube Video ID *</Label>
            <Input
              id="youtube_video_id"
              value={formData.youtube_video_id}
              onChange={(e) => setFormData({ ...formData, youtube_video_id: e.target.value })}
              placeholder="Enter YouTube video ID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_index">Order Index</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="Enter thumbnail URL"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.playlist_id}>
              {isSubmitting ? "Adding..." : "Add Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVideoModal;
