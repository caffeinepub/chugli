import { useState, KeyboardEvent } from 'react';
import { Send, Loader2, LogIn, AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSendMessage } from '../../hooks/useQueries';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuthControls } from '../../hooks/useAuthControls';
import { setPostLoginRedirect } from '../../utils/auth/postLoginRedirect';
import { isAuthError } from '../../utils/auth/isAuthError';
import { toast } from 'sonner';

interface MessageComposerProps {
  roomId: string;
}

const MAX_LENGTH = 500;

export default function MessageComposer({ roomId }: MessageComposerProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const sendMessage = useSendMessage();
  const { profile, isLoading: profileLoading, isProfileReady, hasAuthError, createDefaultProfile } = useUserProfile();
  const { isAuthenticated, logout } = useAuthControls();

  const handleLoginClick = () => {
    setPostLoginRedirect(window.location.pathname);
    navigate({ to: '/login' });
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    
    // Ensure we have a profile before sending
    if (!profile) {
      toast.error('Profile not ready. Please wait...');
      return;
    }

    if (content.length > MAX_LENGTH) {
      toast.error(`Message too long (max ${MAX_LENGTH} characters)`);
      return;
    }

    try {
      await sendMessage.mutateAsync({
        roomId,
        sender: profile.nickname,
        content: content.trim(),
      });
      setContent('');
    } catch (error) {
      if (isAuthError(error)) {
        toast.error('Please log in to send messages');
        handleLoginClick();
      } else {
        toast.error('Failed to send message');
        console.error(error);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogoutAndRetry = async () => {
    try {
      await logout();
      toast.success('Logged out. Please log in again.');
      setTimeout(() => handleLoginClick(), 500);
    } catch (error) {
      toast.error('Failed to log out');
      console.error(error);
    }
  };

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;

  // Show login prompt when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container px-4 py-4">
          <Alert>
            <LogIn className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Log in to join the conversation and send messages</span>
              <Button onClick={handleLoginClick} size="sm" className="ml-4">
                Log in
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show error state when authenticated but profile has authorization error
  if (hasAuthError) {
    return (
      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container px-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Error</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>Your account is logged in, but your profile could not be loaded. This may be a permission issue.</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate({ to: '/settings' })} 
                  size="sm" 
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Button>
                <Button 
                  onClick={handleLogoutAndRetry} 
                  size="sm"
                  variant="outline"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Log out and try again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show loading state when profile is being set up
  if (profileLoading || !isProfileReady) {
    return (
      <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container px-4 py-4">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Setting up your profile...
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container px-4 py-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Textarea
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendMessage.isPending || !isProfileReady}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            {content.length > MAX_LENGTH - 50 && (
              <p className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {remaining} characters remaining
              </p>
            )}
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || sendMessage.isPending || isOverLimit || !isProfileReady}
            className="h-11 w-11 flex-shrink-0"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
