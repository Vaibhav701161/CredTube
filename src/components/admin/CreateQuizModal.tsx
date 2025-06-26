
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playlistId: string | null;
}

const CreateQuizModal = ({ isOpen, onClose, onSuccess, playlistId }: CreateQuizModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videos, setVideos] = useState<Tables<'videos'>[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_id: '',
    passing_score: 70,
    time_limit: 0
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correct: 0, explanation: '' }
  ]);

  useEffect(() => {
    if (isOpen && playlistId) {
      fetchVideosForPlaylist(playlistId);
    }
  }, [isOpen, playlistId]);

  const fetchVideosForPlaylist = async (selectedPlaylistId: string) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('playlist_id', selectedPlaylistId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct: 0, explanation: '' }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions];
    (updatedQuestions[index] as any)[field] = value;
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    // Validate questions
    const validQuestions = questions.filter(q => 
      q.question.trim() && 
      q.options.every(opt => opt.trim()) &&
      q.correct >= 0 && q.correct < q.options.length
    );

    if (validQuestions.length === 0) {
      toast({
        title: "Invalid questions",
        description: "Please add at least one complete question with all options filled.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          ...formData,
          questions: validQuestions as any, // Cast to any for Json type compatibility
          quiz_type: 'multiple_choice',
          is_active: true,
          time_limit: formData.time_limit || null
        });

      if (error) throw error;

      toast({
        title: "Quiz created",
        description: "The quiz has been successfully created.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        video_id: '',
        passing_score: 70,
        time_limit: 0
      });
      setQuestions([{ question: '', options: ['', '', '', ''], correct: 0, explanation: '' }]);

      onSuccess();
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Error creating quiz",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
          <DialogDescription>
            Add a quiz for a video to test learner knowledge
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_id">Video *</Label>
              <Select
                value={formData.video_id}
                onValueChange={(value) => setFormData({ ...formData, video_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a video" />
                </SelectTrigger>
                <SelectContent>
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter quiz title"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter quiz description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passing_score">Passing Score (%)</Label>
              <Input
                id="passing_score"
                type="number"
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 70 })}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_limit">Time Limit (seconds, 0 = no limit)</Label>
              <Input
                id="time_limit"
                type="number"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Questions</h3>
              <Button type="button" onClick={addQuestion} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, questionIndex) => (
              <Card key={questionIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                      placeholder="Enter the question"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Answer Options *</Label>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${questionIndex}`}
                          checked={question.correct === optionIndex}
                          onChange={() => updateQuestion(questionIndex, 'correct', optionIndex)}
                        />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {question.correct === optionIndex ? '(Correct)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                      placeholder="Explain why this is the correct answer"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.video_id}>
              {isSubmitting ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizModal;
