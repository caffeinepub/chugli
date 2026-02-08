import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle } from 'lucide-react';

interface AdminPasswordAccessPromptProps {
  onUnlock: (password: string) => boolean;
  error?: string | null;
}

export default function AdminPasswordAccessPrompt({ onUnlock, error }: AdminPasswordAccessPromptProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = onUnlock(password);
    
    if (!success) {
      setPassword('');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Access
          </CardTitle>
          <CardDescription>
            Enter the password to unlock admin controls. Your principal must also have backend admin privileges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !password}>
              {isSubmitting ? 'Unlocking...' : 'Unlock Admin Access'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
