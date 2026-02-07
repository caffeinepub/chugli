import { useState } from 'react';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAccess } from '../../hooks/useAdminAccess';
import { useAdminCapability } from '../../hooks/useAdminManagement';
import { useGetRoom } from '../../hooks/useQueries';
import RoomDeleteWithPasswordDialog from '../rooms/RoomDeleteWithPasswordDialog';

interface InRoomAdminControlsProps {
  roomId: string;
  onRoomDeleted: () => void;
}

export default function InRoomAdminControls({ roomId, onRoomDeleted }: InRoomAdminControlsProps) {
  const { isUnlocked, lock } = useAdminAccess();
  const { canPerformAdminOps, reason, nextStep } = useAdminCapability();
  const { data: room } = useGetRoom(roomId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Don't show controls if not unlocked
  if (!isUnlocked) {
    return null;
  }

  const handleDeleteSuccess = () => {
    onRoomDeleted();
  };

  return (
    <Card className="mx-4 mt-4 border-orange-200 dark:border-orange-800">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Room Management</h3>
            <Button variant="ghost" size="sm" onClick={lock}>
              <Lock className="h-4 w-4 mr-2" />
              Lock Controls
            </Button>
          </div>

          {!canPerformAdminOps && (
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-medium">{reason}</p>
                {nextStep && <p className="text-sm mt-1">{nextStep}</p>}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Room
            </Button>
          </div>
        </div>
      </CardContent>

      {room && (
        <RoomDeleteWithPasswordDialog
          roomId={roomId}
          roomName={room.name}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </Card>
  );
}
