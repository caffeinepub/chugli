import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminDeleteRoom } from '../../hooks/useQueries';
import { getErrorWithGuidance } from '../../utils/auth/isAuthError';
import { ADMIN_PASSWORD } from '../../config/adminPassword';
import { toast } from 'sonner';

interface RoomDeleteWithPasswordDialogProps {
  roomId: string;
  roomName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function RoomDeleteWithPasswordDialog({
  roomId,
  roomName,
  trigger,
  onSuccess,
}: RoomDeleteWithPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const deleteRoom = useAdminDeleteRoom();

  const handleDelete = async () => {
    // Validate password against the shared admin password
    if (password !== ADMIN_PASSWORD) {
      setValidationError('Incorrect password. Please enter the correct admin password.');
      return;
    }

    setValidationError(null);

    try {
      await deleteRoom.mutateAsync({ roomId, providedPassword: password });
      toast.success(`Room "${roomName}" deleted successfully`);
      setOpen(false);
      setPassword('');
      onSuccess?.();
    } catch (error) {
      const errorMsg = getErrorWithGuidance(error);
      toast.error(errorMsg);
      console.error('Delete room error:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setPassword('');
      setValidationError(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the room <strong>"{roomName}"</strong> and all its messages.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="delete-password">Admin Password</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationError(null);
              }}
              placeholder="Enter admin password"
              disabled={deleteRoom.isPending}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the same password used to unlock admin controls.
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRoom.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRoom.isPending || !password}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRoom.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Room
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
