
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Award, Shield, Users, Play, CheckCircle, Youtube, Brain, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <GraduationCap className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-6xl font-bold text-primary">CredTube</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform any YouTube video into a verified learning credential. Watch, learn, get AI-generated assessments, and earn blockchain-verified tokens that prove your knowledge to the world.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/try-free">
              <Button size="lg" className="px-8 py-3">
                <Play className="w-5 h-5 mr-2" />
                Try for Free
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign Up & Save Progress
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No signup required to try • Progress saved only with account
          </p>
        </div>

        {/* What is CredTube Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What is CredTube?</h2>
          <div className="max-w-4xl mx-auto text-lg text-center text-gray-600 dark:text-gray-300 space-y-4">
            <p>
              CredTube revolutionizes online learning by turning YouTube videos into verifiable credentials. 
              Simply paste any educational YouTube video URL, watch the content, complete AI-generated assessments, 
              and earn blockchain-verified learning tokens.
            </p>
            <p>
              These tokens aren't just certificates - they're cryptographically secure proofs of your knowledge 
              that you can showcase on LinkedIn, Twitter, your resume, or anywhere else to demonstrate your skills.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Youtube className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle>Import Any YouTube Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Paste any YouTube video or playlist URL and instantly convert it into a structured learning experience with progress tracking
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>AI-Generated Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our AI analyzes video content and creates personalized quizzes, coding challenges, and practical assignments to test your understanding
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Verifiable Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Earn blockchain-verified learning tokens that can be independently verified and shared across social media, resumes, and portfolios
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold mb-2">Import YouTube Content</h3>
              <p className="text-sm text-muted-foreground">Paste any YouTube video or playlist URL to get started</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold mb-2">Watch & Learn</h3>
              <p className="text-sm text-muted-foreground">Watch the video while we track your progress automatically</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold mb-2">Take AI Assessment</h3>
              <p className="text-sm text-muted-foreground">Complete AI-generated quizzes and practical challenges</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold mb-2">Earn Verifiable Token</h3>
              <p className="text-sm text-muted-foreground">Receive blockchain-verified credentials you can share anywhere</p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students & Learners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Turn your self-learning into verified credentials that enhance your academic profile and job applications
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Professionals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Showcase continuous learning and skill development with verifiable credentials for career advancement
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Educators & Trainers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create structured learning paths from existing YouTube content and issue verified certificates
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-muted-foreground mb-6">
            Start earning verifiable credentials from any YouTube video in minutes
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/try-free">
              <Button size="lg">
                <Play className="w-4 h-4 mr-2" />
                Try for Free Now
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
