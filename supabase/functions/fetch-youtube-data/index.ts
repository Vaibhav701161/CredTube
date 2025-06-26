
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'YouTube URL is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video/playlist ID from YouTube URL
    let videoId = null;
    let playlistId = null;

    // Video URL patterns
    const videoRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const videoMatch = url.match(videoRegex);
    if (videoMatch) {
      videoId = videoMatch[1];
    }

    // Playlist URL patterns
    const playlistRegex = /[?&]list=([a-zA-Z0-9_-]+)/;
    const playlistMatch = url.match(playlistRegex);
    if (playlistMatch) {
      playlistId = playlistMatch[1];
    }

    if (!videoId && !playlistId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid YouTube URL format' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For demo purposes, we'll return mock data that matches the expected format
    const mockVideoData = {
      title: 'Sample YouTube Video Title',
      description: 'This is a sample description of the YouTube video content that demonstrates the learning platform capabilities.',
      thumbnail: `https://img.youtube.com/vi/${videoId || 'dQw4w9WgXcQ'}/maxresdefault.jpg`,
      duration: 600, // 10 minutes in seconds
    };

    const result = {
      success: true,
      video: mockVideoData,
      extractedIds: { videoId, playlistId }
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch YouTube data' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
