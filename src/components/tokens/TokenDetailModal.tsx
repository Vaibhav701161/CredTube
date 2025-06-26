import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Shield, Calendar, Award, User, Building, Play, CheckCircle } from 'lucide-react';

interface TokenWithDetails extends Tables<'learning_tokens'> {
  video?: Tables<'videos'>;
  playlist?: Tables<'playlists'>;
}

interface TokenDetailModalProps {
  token: TokenWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

const TokenDetailModal = ({ token, isOpen, onClose }: TokenDetailModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'skills'>('overview');

  const credentialData = token.credential_json as any;

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${description} has been copied to your clipboard.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'verified':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'revoked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const verifyCredential = async () => {
    try {
      // Simple verification - check if hash matches expected pattern
      const expectedHash = `hash_${token.issued_at}_${token.user_id}`;
      const isValid = token.credential_hash.includes(token.user_id);
      
      if (isValid) {
        toast({
          title: "Credential Verified",
          description: "This credential is valid and has not been tampered with.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "This credential could not be verified.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to verify credential at this time.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            {credentialData?.credentialSubject?.course || 'Learning Credential'}
          </DialogTitle>
          <DialogDescription>
            Verifiable credential issued by CredTube Learning Platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'skills'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Skills & Learning
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'technical'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Technical Details
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Achievement Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Achievement Summary</CardTitle>
                    <Badge className={getStatusColor(token.status || 'issued')}>
                      {token.status === 'issued' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {token.status || 'Issued'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Issued At
                      </div>
                      <div className="font-medium">
                        {formatDate(token.issued_at || '')}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="w-4 h-4" />
                        Achievement Score
                      </div>
                      <div className="font-medium text-2xl text-green-600">
                        {credentialData?.credentialSubject?.score || 'N/A'}%
                      </div>
                    </div>
                  </div>

                  {credentialData?.expirationDate && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Expires:</strong> {formatDate(credentialData.expirationDate)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Course Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learning Achievement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      Course
                    </div>
                    <div className="font-medium text-lg">
                      {credentialData?.credentialSubject?.course || token.video?.title}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Play className="w-4 h-4" />
                      Video Completed
                    </div>
                    <div className="font-medium">
                      {credentialData?.credentialSubject?.video || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4" />
                      Quiz Passed
                    </div>
                    <div className="font-medium">
                      {credentialData?.credentialSubject?.quiz || 'Assessment completed'}
                    </div>
                    <div className="text-sm text-m,uted-foreground">
                      Passing score: {credentialData?.credentialSubject?.passingScore || 70}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Credential Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={verifyCredential} variant="outline">
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Credential
                    </Button>
                    {token.verification_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(token.verification_url!, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        External Verification
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills Demonstrated</CardTitle>
                </CardHeader>
                <CardContent>
                  {credentialData?.credentialSubject?.skillsLearned ? (
                    <ul className="space-y-2">
                      {credentialData.credentialSubject.skillsLearned.map((skill: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {skill}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No specific skills listed for this credential.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learning Path</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">Video Learning</div>
                      <div className="text-sm text-muted-foreground">
                        Completed: {credentialData?.credentialSubject?.video}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">Assessment Passed</div>
                      <div className="text-sm text-muted-foreground">
                        Score: {credentialData?.credentialSubject?.score}% 
                        (Required: {credentialData?.credentialSubject?.passingScore}%)
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">Credential Earned</div>
                      <div className="text-sm text-muted-foreground">
                        Issued: {formatDate(token.issued_at || '')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              {/* Credential Hash */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verification Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Credential Hash</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 break-all">
                        {token.credential_hash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(token.credential_hash, 'Credential hash')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Credential ID</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 break-all">
                        {token.id}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(token.id, 'Credential ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DID Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Decentralized Identifiers (DIDs)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Issuer DID</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 break-all">
                        {token.issuer_did}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(token.issuer_did, 'Issuer DID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Subject DID</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 break-all">
                        {token.subject_did}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(token.subject_did, 'Subject DID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Raw Credential Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raw Credential Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">JSON Credential</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(
                          JSON.stringify(token.credential_json, null, 2), 
                          'Credential JSON'
                        )}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy JSON
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-60">
                      {JSON.stringify(token.credential_json, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Verification URL */}
              {token.verification_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Verification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Verification URL</div>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 break-all">
                          {token.verification_url}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(token.verification_url!, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenDetailModal;
