import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '../../backend';
import { useModeration } from '../../hooks/useModeration';
import MessageActionsMenu from './MessageActionsMenu';
import { useUserProfile } from '../../hooks/useUserProfile';

interface MessageListProps {
  messages: Message[];
  roomId: string;
}

export default function MessageList({ messages, roomId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { filterMessages } = useModeration();
  const { profile } = useUserProfile();
  const filteredMessages = filterMessages(messages);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  if (filteredMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-4">
        <div>
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to say something!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div ref={scrollRef} className="space-y-4 py-4">
        {filteredMessages.map((message) => {
          const isOwnMessage = profile?.nickname === message.sender;
          const timestamp = new Date(Number(message.timestamp) / 1000000);

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {message.sender.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className={`flex-1 min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{message.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`group relative max-w-[85%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>

                  <div className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageActionsMenu
                      message={message}
                      roomId={roomId}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
