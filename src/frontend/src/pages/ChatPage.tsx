import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRoomMessages, useIsAdmin, useDeleteRoom } from '../hooks/useQueries';
import MessageList from '../components/chat/MessageList';
import MessageComposer from '../components/chat/MessageComposer';
import { toast } from 'sonner';
import { MoreVertical } from 'lucide-react';

export default function ChatPage() {
  const { roomId } = useParams({ from: '/chat/$roomId' });
  const navigate = useNavigate();
  const { data: messages, isLoading } = useRoomMessages(roomId, true);
  const { data: isAdmin = false } = useIsAdmin();
  const deleteRoomMutation = useDeleteRoom();
  const [deleteRoomConfirmOpen, setDeleteRoomConfirmOpen] = useState(false);

  const handleLeave = () => {
    navigate({ to: '/' });
  };

  const handleDeleteRoom = async () => {
    try {
      await deleteRoomMutation.mutateAsync(roomId);
      toast.success('Room deleted successfully');
      setDeleteRoomConfirmOpen(false);
      navigate({ to: '/' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete room');
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={handleLeave}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">Room Chat</h2>
            <p className="text-xs text-muted-foreground truncate">Room ID: {roomId.split('-')[0]}</p>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setDeleteRoomConfirmOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Room
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MessageList messages={messages || []} roomId={roomId} />
        )}
      </div>

      {/* Composer */}
      <MessageComposer roomId={roomId} />

      {/* Delete Room Confirmation */}
      <AlertDialog open={deleteRoomConfirmOpen} onOpenChange={setDeleteRoomConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? All messages in this room will be permanently deleted. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={deleteRoomMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRoomMutation.isPending ? 'Deleting...' : 'Delete Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
