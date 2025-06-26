
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, CheckCircle, Brain, FileText, MessageSquare } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface AIAssignmentGeneratorProps {
  video: Tables<'videos'>;
  userProgress?: Tables<'user_progress'>;
}

interface GeneratedAssignment {
  title: string;
  description: string;
  questions: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>;
  practicalTasks: Array<{
    task: string;
    instructions: string;
    expectedOutcome: string;
  }>;
  reflectionQuestions: string[];
}

const AIAssignmentGenerator = ({ video, userProgress }: AIAssignmentGeneratorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<GeneratedAssignment | null>(null);
  const [activeTab, setActiveTab] = useState('questions');

  const generateAssignment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-assignment', {
        body: {
          videoTitle: video.title,
          videoDescription: video.description,
          difficulty: 'intermediate'
        }
      });

      if (error) throw error;

      setAssignment(data.assignment);
      toast({
        title: "Assignment Generated!",
        description: "AI has created a comprehensive assignment based on the video content.",
      });

    } catch (error) {
      console.error('Error generating assignment:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userProgress?.is_video_completed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Assignment Generator
          </CardTitle>
          <CardDescription>
            Complete the video first to unlock AI-generated assignments
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Assignment Generator
        </CardTitle>
        <CardDescription>
          Get personalized assignments automatically generated based on the video content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!assignment ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Generate Assignment</h3>
            <p className="text-muted-foreground mb-4">
              Our AI will analyze "{video.title}" and create comprehensive assignments including:
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <Badge variant="secondary">
                <CheckCircle className="w-3 h-3 mr-1" />
                Multiple Choice Questions
              </Badge>
              <Badge variant="secondary">
                <FileText className="w-3 h-3 mr-1" />
                Practical Tasks
              </Badge>
              <Badge variant="secondary">
                <MessageSquare className="w-3 h-3 mr-1" />
                Reflection Questions
              </Badge>
            </div>
            <Button onClick={generateAssignment} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Assignment...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Assignment
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b">
              <h3 className="text-xl font-bold text-purple-600">{assignment.title}</h3>
              <p className="text-muted-foreground mt-1">{assignment.description}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="questions">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Quiz ({assignment.questions.length})
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <FileText className="w-4 h-4 mr-2" />
                  Tasks ({assignment.practicalTasks.length})
                </TabsTrigger>
                <TabsTrigger value="reflection">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Reflection ({assignment.reflectionQuestions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="space-y-4">
                {assignment.questions.map((question, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Question {index + 1}: {question.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded-lg border ${
                              optionIndex === question.correct
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {optionIndex === question.correct && (
                                <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                {assignment.practicalTasks.map((task, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">Task {index + 1}: {task.task}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Instructions:</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                          {task.instructions}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Expected Outcome:</h4>
                        <p className="text-sm text-green-800 dark:text-green-200 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          {task.expectedOutcome}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="reflection" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Reflection Questions</CardTitle>
                    <CardDescription>
                      Take time to think deeply about these questions and write thoughtful responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assignment.reflectionQuestions.map((question, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">
                            {index + 1}. {question}
                          </h4>
                          <div className="h-20 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">
                              Space for your reflection...
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setAssignment(null)} className="flex-1">
                Generate New Assignment
              </Button>
              <Button className="flex-1">
                Save Assignment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssignmentGenerator;
