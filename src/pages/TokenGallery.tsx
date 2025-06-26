
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download, Eye, Calendar, Trophy, CheckCircle, Share, ExternalLink } from 'lucide-react';
import TokenDetailModal from '@/components/tokens/TokenDetailModal';

interface TokenWithDetails extends Tables<'learning_tokens'> {
  video?: Tables<'videos'>;
  playlist?: Tables<'playlists'>;
}

const TokenGallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<TokenWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<TokenWithDetails | null>(null);
  const [showTokenDetail, setShowTokenDetail] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_tokens')
        .select(`
          *,
          video:videos (*),
          playlist:playlists (*)
        `)
        .eq('user_id', user!.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast({
        title: "Error loading tokens",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadCredential = (token: TokenWithDetails) => {
    const credentialData = typeof token.credential_json === 'object' && token.credential_json !== null 
      ? token.credential_json 
      : {};

    const credential = {
      ...credentialData,
      tokenId: token.id,
      credentialHash: token.credential_hash,
      issuerDID: token.issuer_did,
      subjectDID: token.subject_did,
      status: token.status,
      issuedAt: token.issued_at,
      verificationUrl: token.verification_url,
      downloadedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(credential, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential-${token.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Credential downloaded",
      description: "Your LFDT-compliant learning credential has been downloaded successfully.",
    });
  };

  const shareCredential = (token: TokenWithDetails, platform: string) => {
    const credentialData = typeof token.credential_json === 'object' && token.credential_json !== null 
      ? token.credential_json as any
      : {};
    
    const videoTitle = credentialData?.credentialSubject?.hasCredential?.video?.title || token.video?.title || 'Video Learning';
    const score = credentialData?.credentialSubject?.hasCredential?.assessment?.score || 'High';
    const course = credentialData?.credentialSubject?.hasCredential?.course || token.playlist?.title || 'Self-Learning';
    
    const text = `🎓 I just earned a verifiable learning credential for completing "${videoTitle}" with ${score}% score in ${course}! This credential is blockchain-verified and LFDT-compliant. #LearningCredentials #VerifiableEducation #CredTube`;
    const url = token.verification_url || `${window.location.origin}/verify/${token.credential_hash}`;
    
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
      toast({
        title: "Credential shared",
        description: `Your verifiable credential has been shared on ${platform}.`,
      });
    }
  };

  const copyVerificationLink = (token: TokenWithDetails) => {
    const verificationUrl = token.verification_url || `${window.location.origin}/verify/${token.credential_hash}`;
    navigator.clipboard.writeText(verificationUrl);
    toast({
      title: "Verification link copied",
      description: "You can share this link to allow others to verify your credential.",
    });
  };

  const viewTokenDetail = (token: TokenWithDetails) => {
    setSelectedToken(token);
    setShowTokenDetail(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-600" />
            My Learning Credentials
          </h1>
          <p className="text-muted-foreground">
            Your LFDT-compliant, verifiable learning credentials earned from completing courses
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{tokens.length}</div>
          <div className="text-sm text-muted-foreground">Total Credentials</div>
        </div>
      </div>

      {tokens.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No credentials earned yet</CardTitle>
            <CardDescription>
              Complete video quizzes to earn your first LFDT-compliant learning credentials. 
              These tokens are verifiable, shareable, and perfect for professional portfolios.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => {
            const credentialData = typeof token.credential_json === 'object' && token.credential_json !== null 
              ? token.credential_json as any
              : {};
            
            const hasCredential = credentialData?.credentialSubject?.hasCredential;
            const videoTitle = hasCredential?.video?.title || token.video?.title || 'Unknown Video';
            const course = hasCredential?.course || token.playlist?.title || 'Individual Learning';
            const score = hasCredential?.assessment?.score || 'N/A';
            
            return (
              <Card key={token.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        {videoTitle}
                      </CardTitle>
                      <CardDescription>
                        {course}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(token.status || 'issued')}>
                      {token.status === 'issued' && <CheckCircle className="w-3 h-3 mr-1" />}
                      Verified
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Score</div>
                      <div className="text-lg font-bold">
                        {score}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Earned</div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(token.issued_at || '')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Credential ID: {token.id.slice(0, 8)}...
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => viewTokenDetail(token)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => downloadCredential(token)}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => shareCredential(token, 'linkedin')}
                        className="text-xs"
                      >
                        <Share className="w-3 h-3 mr-1" />
                        LinkedIn
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => copyVerificationLink(token)}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Verify
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedToken && (
        <TokenDetailModal
          token={selectedToken}
          isOpen={showTokenDetail}
          onClose={() => {
            setShowTokenDetail(false);
            setSelectedToken(null);
          }}
        />
      )}
    </div>
  );
};

export default TokenGallery;
