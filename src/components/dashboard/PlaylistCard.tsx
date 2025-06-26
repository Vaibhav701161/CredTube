
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Star, Play } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";

interface PlaylistCardProps {
  playlist: Tables<'playlists'>;
  enrollmentData?: {
    enrolled: boolean;
    progress: number;
    completed: boolean;
  };
}

const PlaylistCard = ({ playlist, enrollmentData }: PlaylistCardProps) => {
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

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {playlist.title}
            </CardTitle>
            {playlist.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {playlist.description}
              </CardDescription>
            )}
          </div>
          {playlist.thumbnail_url && (
            <img
              src={playlist.thumbnail_url}
              alt={playlist.title}
              className="w-16 h-12 object-cover rounded ml-4 flex-shrink-0"
            />
          )}
        </div>
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
        </div>

        {enrollmentData && enrollmentData.enrolled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{enrollmentData.progress}%</span>
            </div>
            <Progress value={enrollmentData.progress} className="h-2" />
            {enrollmentData.completed && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                ✓ Completed
              </Badge>
            )}
          </div>
        )}
        
        <Button asChild className="w-full">
          <Link to={`/playlist/${playlist.id}`}>
            <Play className="w-4 h-4 mr-2" />
            {enrollmentData?.enrolled ? 'Continue Learning' : 'Start Learning'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlaylistCard;
