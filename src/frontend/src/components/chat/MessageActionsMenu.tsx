import { useState } from 'react';
import { MoreVertical, Volume2, Ban, Flag, Trash2, ShieldOff, ShieldCheck } from 'lucide-react';
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
import {
  useMuteUser,
  useBlockUser,
  useReportContent,
  useIsAdmin,
  useDeleteMessage,
  useBanUser,
  useUnbanUser,
  useIsUserBanned,
} from '../../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

interface MessageActionsMenuProps {
  message: Message;
  roomId: string;
}

export default function MessageActionsMenu({ message, roomId }: MessageActionsMenuProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [banConfirmOpen, setBanConfirmOpen] = useState(false);
  const [unbanConfirmOpen, setUnbanConfirmOpen] = useState(false);

  const { muteUser, blockUser } = useModeration();
  const muteUserMutation = useMuteUser();
  const blockUserMutation = useBlockUser();
  const reportMutation = useReportContent();

  // Admin hooks
  const { data: isAdmin = false } = useIsAdmin();
  const deleteMessageMutation = useDeleteMessage();
  const banUserMutation = useBanUser();
  const unbanUserMutation = useUnbanUser();

  const senderPrincipal = message.senderPrincipal ? Principal.fromText(message.senderPrincipal.toString()) : null;
  const { data: isUserBanned = false } = useIsUserBanned(senderPrincipal);

  const handleMute = async () => {
    muteUser(message.sender);
    try {
      await muteUserMutation.mutateAsync(message.sender);
      toast.success(`Muted ${message.sender}`);
    } catch (error) {
      console.error('Failed to sync mute:', error);
    }
  };

  const handleBlock = async () => {
    blockUser(message.sender);
    try {
      await blockUserMutation.mutateAsync(message.sender);
      toast.success(`Blocked ${message.sender}`);
    } catch (error) {
      console.error('Failed to sync block:', error);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await reportMutation.mutateAsync({
        reportedUser: message.sender,
        reportedMessage: message.id,
        room: roomId,
        reason: reportReason.trim(),
      });
      toast.success('Report submitted. Thank you for keeping our community safe.');
      setReportDialogOpen(false);
      setReportReason('');
    } catch (error) {
      toast.error('Failed to submit report');
      console.error(error);
    }
  };

  const handleDeleteMessage = async () => {
    try {
      await deleteMessageMutation.mutateAsync({ roomId, messageId: message.id });
      toast.success('Message deleted successfully');
      setDeleteConfirmOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete message');
      console.error(error);
    }
  };

  const handleBanUser = async () => {
    if (!senderPrincipal) {
      toast.error('Cannot ban user: sender information unavailable');
      return;
    }

    try {
      await banUserMutation.mutateAsync(senderPrincipal);
      toast.success(`User ${message.sender} has been banned`);
      setBanConfirmOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to ban user');
      console.error(error);
    }
  };

  const handleUnbanUser = async () => {
    if (!senderPrincipal) {
      toast.error('Cannot unban user: sender information unavailable');
      return;
    }

    try {
      await unbanUserMutation.mutateAsync(senderPrincipal);
      toast.success(`User ${message.sender} has been unbanned`);
      setUnbanConfirmOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to unban user');
      console.error(error);
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
            <Volume2 className="mr-2 h-4 w-4" />
            Mute User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBlock}>
            <Ban className="mr-2 h-4 w-4" />
            Block User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
            <Flag className="mr-2 h-4 w-4" />
            Report
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Message
              </DropdownMenuItem>
              {senderPrincipal ? (
                isUserBanned ? (
                  <DropdownMenuItem onClick={() => setUnbanConfirmOpen(true)}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Unban User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setBanConfirmOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Ban User
                  </DropdownMenuItem>
                )
              ) : (
                <DropdownMenuItem disabled>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Ban User (unavailable)
                </DropdownMenuItem>
              )}
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
              Help us keep Chugli safe. Reports are reviewed by our team. Your identity will remain private.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason for reporting</Label>
              <Textarea
                id="report-reason"
                placeholder="Please describe why you're reporting this message..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={reportMutation.isPending}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Message Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              disabled={deleteMessageMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMessageMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Confirmation */}
      <AlertDialog open={banConfirmOpen} onOpenChange={setBanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {message.sender}? They will no longer be able to create rooms or send
              messages until unbanned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={banUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {banUserMutation.isPending ? 'Banning...' : 'Ban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban User Confirmation */}
      <AlertDialog open={unbanConfirmOpen} onOpenChange={setUnbanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban {message.sender}? They will be able to create rooms and send messages
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbanUser} disabled={unbanUserMutation.isPending}>
              {unbanUserMutation.isPending ? 'Unbanning...' : 'Unban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
