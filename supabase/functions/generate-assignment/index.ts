
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { 
      videoTitle, 
      videoDescription, 
      difficulty = 'intermediate', 
      guestMode = false,
      subject = '',
      topic = ''
    } = await req.json();

    if (!videoTitle) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Video title is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if this is CS-related content
    const csKeywords = ['programming', 'coding', 'software', 'javascript', 'python', 'react', 'algorithm', 'data structure', 'computer science', 'development', 'code', 'function', 'variable', 'loop', 'array', 'object'];
    const isCSRelated = csKeywords.some(keyword => 
      videoTitle.toLowerCase().includes(keyword) || 
      videoDescription.toLowerCase().includes(keyword) ||
      subject.toLowerCase().includes(keyword) ||
      topic.toLowerCase().includes(keyword)
    );

    // Generate progressive questions based on content
    const questions = generateProgressiveQuestions(videoTitle, videoDescription, subject, topic, isCSRelated);

    const generatedAssignment = {
      success: true,
      assignment: {
        quiz: {
          title: `Progressive Assessment: ${videoTitle}`,
          questions: questions,
          passingScore: 70
        },
        practical: {
          tasks: generatePracticalTasks(videoTitle, subject, topic, isCSRelated)
        },
        reflection: {
          questions: generateReflectionQuestions(videoTitle, subject, topic)
        }
      }
    };

    return new Response(
      JSON.stringify(generatedAssignment),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating assignment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to generate assignment' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateProgressiveQuestions(videoTitle: string, videoDescription: string, subject: string, topic: string, isCSRelated: boolean) {
  const contentContext = `${videoTitle} ${videoDescription} ${subject} ${topic}`.toLowerCase();
  
  // Basic level question
  const basicQuestion = {
    question: `What is the main concept covered in "${videoTitle}"${subject ? ` related to ${subject}` : ''}?`,
    options: [
      `The core ${topic || 'concept'} explained in the video`,
      "General background information only",
      "Introductory examples without depth",
      "Unrelated supplementary material"
    ],
    correct: 0,
    explanation: `This question tests basic comprehension of the main ${topic || 'concept'} presented in the video content.`
  };

  // Intermediate level question
  const intermediateQuestion = {
    question: `How would you apply the ${topic || 'concepts'} from "${videoTitle}" in a practical scenario?`,
    options: [
      `Implement the ${topic || 'concepts'} in real-world applications with proper methodology`,
      "Memorize the theoretical aspects without practical application",
      "Use only the basic examples shown in the video",
      "Apply concepts without understanding the underlying principles"
    ],
    correct: 0,
    explanation: `This question evaluates your ability to apply ${topic || 'the concepts'} practically, moving beyond basic understanding.`
  };

  // Advanced conceptual question
  const advancedQuestion = {
    question: `What are the key challenges and considerations when implementing ${topic || 'these concepts'} in complex scenarios?`,
    options: [
      `Understanding edge cases, scalability, and integration challenges`,
      "Only following the exact steps shown in the video",
      "Ignoring potential complications and edge cases",
      "Applying concepts without considering context or constraints"
    ],
    correct: 0,
    explanation: `This question tests advanced understanding and critical thinking about real-world implementation challenges.`
  };

  // Final question - coding or written assessment
  let finalQuestion;
  if (isCSRelated) {
    finalQuestion = {
      question: `[CODING CHALLENGE] Based on the concepts in "${videoTitle}", write a solution that demonstrates your understanding:`,
      options: [
        "Implement a well-structured solution with proper logic and best practices",
        "Copy code examples directly without understanding",
        "Write pseudo-code without actual implementation",
        "Provide only theoretical explanation without code"
      ],
      correct: 0,
      explanation: "This coding challenge tests your ability to implement the concepts practically and demonstrates mastery of the technical content.",
      type: "coding"
    };
  } else {
    finalQuestion = {
      question: `[WRITTEN ASSESSMENT] Provide a comprehensive analysis of how the concepts from "${videoTitle}" can be applied in your field or area of interest:`,
      options: [
        "Detailed analysis with specific examples, benefits, and implementation strategies",
        "Basic summary of video content without analysis",
        "General statements without specific application",
        "Theoretical discussion without practical relevance"
      ],
      correct: 0,
      explanation: "This written assessment evaluates your ability to synthesize and apply the concepts in meaningful ways.",
      type: "written"
    };
  }

  return [basicQuestion, intermediateQuestion, advancedQuestion, finalQuestion];
}

function generatePracticalTasks(videoTitle: string, subject: string, topic: string, isCSRelated: boolean) {
  const tasks = [];
  
  if (isCSRelated) {
    tasks.push({
      task: "Code Implementation Challenge",
      instructions: `Create a working implementation that demonstrates the ${topic || 'programming concepts'} from "${videoTitle}". Include proper error handling, comments, and follow best practices.`,
      expectedOutcome: "A complete, functional code solution with clear documentation and proper implementation of the concepts"
    });
  } else {
    tasks.push({
      task: "Practical Application Project",
      instructions: `Design a project or scenario where you would apply the ${topic || 'concepts'} from "${videoTitle}" in your professional or academic context.`,
      expectedOutcome: "A detailed project plan with specific steps, expected outcomes, and success metrics"
    });
  }

  tasks.push({
    task: "Critical Analysis Report",
    instructions: `Write a 300-500 word analysis discussing the strengths, limitations, and potential improvements of the approach presented in "${videoTitle}".`,
    expectedOutcome: "A well-structured analytical report demonstrating critical thinking and deep understanding"
  });

  return tasks;
}

function generateReflectionQuestions(videoTitle: string, subject: string, topic: string) {
  return [
    `What specific insights about ${topic || 'the subject matter'} did you gain from "${videoTitle}" that you didn't know before?`,
    `How do the concepts from this video connect to or challenge your existing knowledge in ${subject || 'this field'}?`,
    `What questions or areas for further exploration emerged while watching this content?`,
    `How will you integrate these new concepts into your current projects, studies, or professional work?`,
    `What would you teach someone else as the most important takeaway from this learning experience?`
  ];
}
