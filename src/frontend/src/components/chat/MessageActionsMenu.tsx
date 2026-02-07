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
import {
  useMuteUser,
  useBlockUser,
  useReportContent,
} from '../../hooks/useQueries';
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
    </>
  );
}
