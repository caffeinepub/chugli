import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoomMessages } from '../hooks/useQueries';
import MessageList from '../components/chat/MessageList';
import MessageComposer from '../components/chat/MessageComposer';

export default function ChatPage() {
  const { roomId } = useParams({ from: '/chat/$roomId' });
  const navigate = useNavigate();
  const { data: messages, isLoading } = useRoomMessages(roomId, true);

  const handleLeave = () => {
    navigate({ to: '/' });
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
    </div>
  );
}
