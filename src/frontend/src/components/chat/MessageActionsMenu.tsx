import { useState, useEffect } from 'react';
import { MoreVertical, Volume2, Ban, Flag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '../../backend';
import { useModeration } from '../../hooks/useModeration';
import { useAdminAccess } from '../../hooks/useAdminAccess';
import {
  useMuteUser,
  useBlockUser,
  useReportContent,
  useAdminDeleteMessage,
} from '../../hooks/useQueries';
import { toast } from 'sonner';

interface MessageActionsMenuProps {
  message: Message;
  roomId: string;
}

export default function MessageActionsMenu({ message, roomId }: MessageActionsMenuProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { muteUser, blockUser } = useModeration();
  const { isUnlocked: isAdminUnlocked } = useAdminAccess();
  const muteUserMutation = useMuteUser();
  const blockUserMutation = useBlockUser();
  const reportMutation = useReportContent();
  const deleteMessageMutation = useAdminDeleteMessage();

  // Force re-render when admin access changes
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const handleAdminAccessChange = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('admin-access-changed', handleAdminAccessChange);
    return () => {
      window.removeEventListener('admin-access-changed', handleAdminAccessChange);
    };
  }, []);

  const handleMute = async () => {
    muteUser(message.sender);
    try {
      await muteUserMutation.mutateAsync(message.sender);
      toast.success(`Muted ${message.sender}`);
    } catch (error) {
      toast.error('Failed to sync mute to backend');
    }
  };

  const handleBlock = async () => {
    blockUser(message.sender);
    try {
      await blockUserMutation.mutateAsync(message.sender);
      toast.success(`Blocked ${message.sender}`);
    } catch (error) {
      toast.error('Failed to sync block to backend');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    try {
      await reportMutation.mutateAsync({
        reportedUser: message.sender,
        reportedMessage: message.id,
        room: roomId,
        reason: reportReason,
      });
      toast.success('Content reported successfully');
      setReportDialogOpen(false);
      setReportReason('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to report content');
    }
  };

  const handleAdminDelete = async () => {
    try {
      await deleteMessageMutation.mutateAsync({
        roomId,
        messageId: message.id,
      });
      toast.success('Message deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete message');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleMute}>
            <Volume2 className="h-4 w-4 mr-2" />
            Mute User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBlock}>
            <Ban className="h-4 w-4 mr-2" />
            Block User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
          
          {isAdminUnlocked && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Message (Admin)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason for reporting</Label>
              <Textarea
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe why you're reporting this content..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={reportMutation.isPending || !reportReason.trim()}
            >
              {reportMutation.isPending ? 'Reporting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p className="font-medium">{message.sender}</p>
                <p className="text-muted-foreground">{message.content}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAdminDelete}
              disabled={deleteMessageMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMessageMutation.isPending ? 'Deleting...' : 'Delete Message'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
