import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthControls } from '../hooks/useAuthControls';
import { getAndClearPostLoginRedirect } from '../utils/auth/postLoginRedirect';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoggingIn, isLoginError, loginError } = useAuthControls();

  // Redirect after successful login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = getAndClearPostLoginRedirect();
      navigate({ to: redirectPath || '/' });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    login();
  };

  const handleInternetIdentityLogin = () => {
    login();
  };

  return (
    <div className="container h-full flex items-center justify-center px-4 py-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Chugli</CardTitle>
          <CardDescription>
            Sign in to create rooms and join conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoginError && loginError && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginError.message || 'Login failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Continue with Google (via Internet Identity)
                </>
              )}
            </Button>

            <Button
              onClick={handleInternetIdentityLogin}
              disabled={isLoggingIn}
              variant="outline"
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Continue with Internet Identity
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>
              Internet Identity is a secure, privacy-preserving authentication system.
              You can use Google, Apple, or other methods to sign in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
