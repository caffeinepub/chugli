import { useState } from 'react';
import { MoreVertical, Volume2, Ban, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '../../backend';
import { useModeration } from '../../hooks/useModeration';
import { useMuteUser, useBlockUser, useReportContent } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface MessageActionsMenuProps {
  message: Message;
  roomId: string;
}

export default function MessageActionsMenu({ message, roomId }: MessageActionsMenuProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const { muteUser, blockUser } = useModeration();
  const muteUserMutation = useMuteUser();
  const blockUserMutation = useBlockUser();
  const reportMutation = useReportContent();

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
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
