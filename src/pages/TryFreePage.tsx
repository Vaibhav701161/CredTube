
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Youtube, ArrowRight, Info, Award, Sparkles, Brain, Target, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GuestVideoPlayer from '@/components/guest/GuestVideoPlayer';

interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
}

const TryFreePage = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const { toast } = useToast();

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleImportVideo = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube video URL",
        variant: "destructive",
      });
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube video URL",
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

      if (data.success && data.video) {
        setVideoData({
          id: videoId,
          title: data.video.title,
          description: data.video.description,
          thumbnail: data.video.thumbnail,
          duration: data.video.duration
        });
        
        toast({
          title: "🎉 Video Imported Successfully",
          description: "Ready to start your learning journey!",
        });
      } else {
        throw new Error('Failed to fetch video data');
      }
    } catch (error) {
      console.error('Error importing video:', error);
      toast({
        title: "Import Failed",
        description: "Could not fetch video data. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetVideo = () => {
    setVideoData(null);
    setYoutubeUrl('');
  };

  if (videoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Free Learning Experience
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Experience the power of AI-generated assessments and verifiable credentials
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetVideo} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                Try Another Video
              </Button>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  <Award className="w-4 h-4 mr-2" />
                  Sign Up to Save Progress
                </Button>
              </Link>
            </div>
          </div>
          
          <GuestVideoPlayer videoData={videoData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-2xl">
                <Youtube className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Try CredTube for Free
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Import any YouTube video and experience our cutting-edge AI-powered learning system with progressive assessments and verifiable credentials
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Main Import Card */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <CardTitle className="text-2xl font-bold mb-2">Import YouTube Video</CardTitle>
                  <CardDescription className="text-blue-100">
                    Paste any educational YouTube video URL to get started with AI-powered learning
                  </CardDescription>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="youtube-url" className="text-lg font-medium">YouTube Video URL</Label>
                    <Input
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="h-12 text-lg border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleImportVideo} 
                    disabled={loading}
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                        Importing Video...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Start Learning Journey
                      </>
                    )}
                  </Button>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                      Works with any educational YouTube content • No account required to try
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Sidebar */}
            <div className="space-y-6">
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Brain className="h-5 w-5" />
                    Smart Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Progressive Assessments</p>
                      <p className="text-sm text-green-600 dark:text-green-300">Questions increase in difficulty</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">AI Content Analysis</p>
                      <p className="text-sm text-green-600 dark:text-green-300">Questions tailored to your content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Coding Challenges</p>
                      <p className="text-sm text-green-600 dark:text-green-300">For CS and programming content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Info className="h-5 w-5" />
                    Free Version
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-amber-700 dark:text-amber-300">
                  <ul className="space-y-2 text-sm">
                    <li>• Watch videos and take smart assessments</li>
                    <li>• Download temporary learning certificates</li>
                    <li>• Progressive difficulty questions</li>
                    <li>• Content-aware AI evaluation</li>
                    <li>• Limited to one video at a time</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upgrade CTA */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 text-center">
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto space-y-4">
                <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  Want Permanent, Verifiable Credentials?
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  Sign up for a free account to save your progress, earn blockchain-verified LFDT-compliant learning tokens, and showcase your achievements professionally on LinkedIn, Twitter, and your resume.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                    <Award className="w-5 h-5 mr-2" />
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TryFreePage;
