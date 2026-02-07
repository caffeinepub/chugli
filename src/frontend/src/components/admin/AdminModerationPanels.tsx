import { useState } from 'react';
import { Trash2, Ban, UserX, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  useGetRoomsByLocation,
  useAdminDeleteMessage,
  useAdminBanUser,
  useAdminUnbanUser,
} from '../../hooks/useQueries';
import { useAdminCapability } from '../../hooks/useAdminManagement';
import { validatePrincipalText } from '../../utils/validation/principalText';
import { getErrorWithGuidance } from '../../utils/auth/isAuthError';
import { toast } from 'sonner';
import RoomDeleteWithPasswordDialog from '../rooms/RoomDeleteWithPasswordDialog';

export default function AdminModerationPanels() {
  const { canPerformAdminOps, reason, nextStep } = useAdminCapability();

  return (
    <div className="space-y-6">
      {!canPerformAdminOps && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">{reason}</p>
            {nextStep && <p className="text-sm mt-1">{nextStep}</p>}
          </AlertDescription>
        </Alert>
      )}

      <RoomManagementPanel disabled={!canPerformAdminOps} />
      <Separator />
      <MessageModerationPanel disabled={!canPerformAdminOps} />
      <Separator />
      <UserBanPanel disabled={!canPerformAdminOps} />
    </div>
  );
}

function RoomManagementPanel({ disabled }: { disabled: boolean }) {
  const { data: rooms } = useGetRoomsByLocation(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  const handleDeleteClick = () => {
    if (!selectedRoomId) {
      toast.error('Please enter a room ID');
      return;
    }
    if (!selectedRoom) {
      toast.error('Room not found');
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Management</CardTitle>
        <CardDescription>Delete rooms by entering the room password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-id">Room ID</Label>
          <Input
            id="room-id"
            placeholder="Enter room ID"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={disabled}
          />
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteClick}
          disabled={disabled || !selectedRoomId}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Room
        </Button>

        {selectedRoom && (
          <RoomDeleteWithPasswordDialog
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={() => {
              setSelectedRoomId('');
              toast.success('Room deleted successfully');
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MessageModerationPanel({ disabled }: { disabled: boolean }) {
  const deleteMessage = useAdminDeleteMessage();
  const [roomId, setRoomId] = useState('');
  const [messageId, setMessageId] = useState('');

  const handleDeleteMessage = async () => {
    if (!roomId || !messageId) {
      toast.error('Please enter both room ID and message ID');
      return;
    }

    try {
      await deleteMessage.mutateAsync({ roomId, messageId });
      toast.success('Message deleted successfully');
      setRoomId('');
      setMessageId('');
    } catch (error) {
      const errorMsg = getErrorWithGuidance(error);
      toast.error(errorMsg);
      console.error('Delete message error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Moderation</CardTitle>
        <CardDescription>Delete inappropriate messages (admin only)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="msg-room-id">Room ID</Label>
          <Input
            id="msg-room-id"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={disabled || deleteMessage.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message-id">Message ID</Label>
          <Input
            id="message-id"
            placeholder="Enter message ID"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            disabled={disabled || deleteMessage.isPending}
          />
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteMessage}
          disabled={disabled || deleteMessage.isPending || !roomId || !messageId}
        >
          {deleteMessage.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function UserBanPanel({ disabled }: { disabled: boolean }) {
  const banUser = useAdminBanUser();
  const unbanUser = useAdminUnbanUser();
  const [principalText, setPrincipalText] = useState('');

  const handleBanUser = async () => {
    const result = validatePrincipalText(principalText);
    if (!result.valid) {
      toast.error(result.error);
      return;
    }

    try {
      await banUser.mutateAsync(result.principal);
      toast.success('User banned successfully');
      setPrincipalText('');
    } catch (error) {
      const errorMsg = getErrorWithGuidance(error);
      toast.error(errorMsg);
      console.error('Ban user error:', error);
    }
  };

  const handleUnbanUser = async () => {
    const result = validatePrincipalText(principalText);
    if (!result.valid) {
      toast.error(result.error);
      return;
    }

    try {
      await unbanUser.mutateAsync(result.principal);
      toast.success('User unbanned successfully');
      setPrincipalText('');
    } catch (error) {
      const errorMsg = getErrorWithGuidance(error);
      toast.error(errorMsg);
      console.error('Unban user error:', error);
    }
  };

  const isPending = banUser.isPending || unbanUser.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Ban Management</CardTitle>
        <CardDescription>Ban or unban users by their Principal ID (admin only)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-principal">User Principal ID</Label>
          <Input
            id="user-principal"
            placeholder="Enter principal ID"
            value={principalText}
            onChange={(e) => setPrincipalText(e.target.value)}
            disabled={disabled || isPending}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleBanUser}
            disabled={disabled || isPending || !principalText}
          >
            {banUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Banning...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleUnbanUser}
            disabled={disabled || isPending || !principalText}
          >
            {unbanUser.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Unbanning...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Unban User
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
