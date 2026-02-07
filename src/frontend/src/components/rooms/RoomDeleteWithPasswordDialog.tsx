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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteRoomWithPassword } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { getErrorWithGuidance } from '../../utils/auth/isAuthError';

interface RoomDeleteWithPasswordDialogProps {
  roomId: string;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function RoomDeleteWithPasswordDialog({
  roomId,
  roomName,
  open,
  onOpenChange,
  onSuccess,
}: RoomDeleteWithPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const deleteRoom = useDeleteRoomWithPassword();

  const handleDelete = async () => {
    if (!password.trim()) {
      toast.error('Please enter the room password');
      return;
    }

    try {
      await deleteRoom.mutateAsync({ roomId, password: password.trim() });
      toast.success('Room deleted successfully');
      setPassword('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMsg = getErrorWithGuidance(error);
      toast.error(errorMsg);
      console.error('Room deletion error:', error);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the room password to delete "{roomName}". This action cannot be undone and will remove all messages in this room.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="room-password">Room Password</Label>
          <Input
            id="room-password"
            type="password"
            placeholder="Enter room password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password.trim()) {
                handleDelete();
              }
            }}
            disabled={deleteRoom.isPending}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={deleteRoom.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRoom.isPending || !password.trim()}
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
