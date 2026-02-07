import { Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { useAdminCapability } from '../hooks/useAdminManagement';
import AdminPasswordAccessPrompt from '../components/admin/AdminPasswordAccessPrompt';
import AdminModerationPanels from '../components/admin/AdminModerationPanels';
import { toast } from 'sonner';

export default function AdminPage() {
  const { isUnlocked, unlock, lock, error } = useAdminAccess();
  const { canPerformAdminOps, reason, nextStep } = useAdminCapability();

  const handleLock = () => {
    lock();
    toast.success('Admin access locked');
  };

  if (!isUnlocked) {
    return (
      <div className="container max-w-md mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Enter the admin password to access moderation tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminPasswordAccessPrompt onUnlock={unlock} error={error} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage rooms, messages, and users
            </p>
          </div>
          <Button variant="outline" onClick={handleLock}>
            <Lock className="h-4 w-4 mr-2" />
            Lock
          </Button>
        </div>

        {!canPerformAdminOps && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">{reason}</div>
              {nextStep && <div className="mt-2 text-sm">{nextStep}</div>}
            </AlertDescription>
          </Alert>
        )}

        <AdminModerationPanels />
      </div>
    </div>
  );
}
