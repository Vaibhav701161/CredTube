
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Share, ExternalLink, AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface GuestAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  score: number;
  passed: boolean;
}

const GuestAssignmentModal = ({ isOpen, onClose, videoTitle, score, passed }: GuestAssignmentModalProps) => {
  const { toast } = useToast();

  const tempToken = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
      'https://lfdt.org/v1/context.json'
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'LearningCredential'],
    id: `urn:uuid:temp-${Date.now()}`,
    issuer: {
      id: 'did:web:credtube.app',
      type: 'Issuer',
      name: 'CredTube Learning Platform (Free Version)',
      url: 'https://credtube.app',
      description: 'AI-powered learning platform - Temporary credential from free trial'
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:credtube:guest:${Date.now()}`,
      type: ['Learner', 'Person'],
      name: 'Guest Learner',
      hasCredential: {
        type: 'VideoLearningCredential',
        name: `Completion of ${videoTitle}`,
        description: `Successfully completed learning assessment for "${videoTitle}" with ${score}% score`,
        video: {
          title: videoTitle,
          platform: 'YouTube via CredTube'
        },
        assessment: {
          type: 'AI-Generated Quiz',
          score: score,
          passingScore: 70,
          completedAt: new Date().toISOString()
        }
      }
    },
    credentialStatus: {
      type: 'TemporaryCredential',
      note: 'This is a temporary credential. Sign up for permanent, verifiable credentials.'
    }
  };

  const downloadTempToken = () => {
    const blob = new Blob([JSON.stringify(tempToken, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temp-credential-${videoTitle.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Temporary credential downloaded",
      description: "Sign up for permanent, verifiable credentials.",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully.`,
      });
    });
  };

  const shareOnSocial = (platform: string) => {
    const text = `I just completed "${videoTitle}" and scored ${score}% on CredTube! 🎓 Check out this AI-powered learning platform that transforms YouTube content into verifiable credentials.`;
    const url = window.location.origin;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const verificationUrl = `${window.location.origin}/verify/temp-${Date.now()}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            {passed ? 'Learning Token Earned!' : 'Assessment Completed'}
          </DialogTitle>
          <DialogDescription>
            {passed 
              ? 'Congratulations on completing your learning journey!' 
              : 'Keep learning to earn your credential.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {passed ? (
            <>
              {/* Token Display */}
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-yellow-800 dark:text-yellow-200">Temporary Learning Token</span>
                    <Badge variant="outline" className="border-yellow-600 text-yellow-800">
                      {score}% Score
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300">
                    {videoTitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-yellow-800 dark:text-yellow-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Completion Date</div>
                      <div>{new Date().toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Token ID</div>
                      <div className="font-mono text-xs">{tempToken.id}</div>
                    </div>
                    <div>
                      <div className="font-medium">Type</div>
                      <div>LFDT Learning Credential</div>
                    </div>
                    <div>
                      <div className="font-medium">Status</div>
                      <div>Temporary (Free Version)</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <div className="font-medium mb-2">Verification URL:</div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
                      <span className="flex-1 truncate font-mono">{verificationUrl}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(verificationUrl, 'Verification URL')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warning Card */}
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="h-5 w-5" />
                    Temporary Token Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-orange-700 dark:text-orange-300">
                  <ul className="space-y-1 text-sm">
                    <li>• Not blockchain-verified or cryptographically secure</li>
                    <li>• Cannot be independently verified by employers/institutions</li>
                    <li>• Will be lost when you close your browser</li>
                    <li>• Not suitable for professional portfolios or resumes</li>
                    <li>• Missing digital signatures and tamper-proof features</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <p className="font-medium">Want permanent, verifiable credentials?</p>
                    <p className="text-sm mt-1">Create a free account to earn LFDT-compliant, blockchain-verified learning tokens that you can showcase professionally.</p>
                    <Link to="/auth">
                      <Button size="sm" className="mt-2">
                        Create Free Account
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadTempToken} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Token (JSON)
                </Button>
                
                <Button onClick={() => shareOnSocial('twitter')} variant="outline">
                  <Share className="w-4 h-4 mr-2" />
                  Share on Twitter
                </Button>
                
                <Button onClick={() => shareOnSocial('linkedin')} variant="outline">
                  <Share className="w-4 h-4 mr-2" />
                  Share on LinkedIn
                </Button>

                <Button 
                  onClick={() => copyToClipboard(JSON.stringify(tempToken, null, 2), 'Token JSON')} 
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Token Data
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Not Passed</CardTitle>
                <CardDescription>
                  You scored {score}%, but need 70% to earn a learning token.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Don't worry! Learning is a journey. Consider reviewing the content and trying again.
                </p>
                <div className="flex gap-2">
                  <Link to="/auth">
                    <Button>
                      <Award className="w-4 h-4 mr-2" />
                      Sign Up to Track Progress
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={onClose}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>
              {passed ? 'Continue Learning' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestAssignmentModal;
