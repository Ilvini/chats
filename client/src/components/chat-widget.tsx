import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Minus, X, Bot, User } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ChatRoom, Message } from "@shared/schema";

interface ChatWidgetProps {
  chatRoom: ChatRoom;
  userName: string;
  isEmbedded?: boolean;
  className?: string;
}

export default function ChatWidget({ chatRoom, userName, isEmbedded = false, className }: ChatWidgetProps) {
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/chatrooms', chatRoom.id, 'messages'],
  });

  const { isConnected, sendMessage: sendWsMessage } = useWebSocket(chatRoom.id, userName, {
    onMessage: (data) => {
      if (data.type === 'newMessage') {
        queryClient.setQueryData(
          ['/api/chatrooms', chatRoom.id, 'messages'],
          (oldMessages: Message[] = []) => [...oldMessages, data.message]
        );
      } else if (data.type === 'userJoined') {
        toast({
          description: `${data.userName} joined the chat`,
          duration: 2000,
        });
      } else if (data.type === 'userLeft') {
        toast({
          description: `${data.userName} left the chat`,
          duration: 2000,
        });
      } else if (data.type === 'typing') {
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });
        
        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(user => user !== data.userName));
        }, 3000);
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      return apiRequest('POST', `/api/chatrooms/${chatRoom.id}/messages`, {
        userName,
        content: messageContent,
        messageType: 'user'
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    const messageContent = message.trim();
    setMessage("");

    // Send via WebSocket for real-time delivery
    sendWsMessage({
      type: 'message',
      chatRoomId: chatRoom.id,
      userName,
      content: messageContent,
      messageType: 'user'
    });
  };

  const handleTyping = () => {
    if (isConnected) {
      sendWsMessage({
        type: 'typing',
        chatRoomId: chatRoom.id,
        userName
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Parse chat settings
  const settings = chatRoom.settings ? JSON.parse(chatRoom.settings) : {};
  const welcomeMessage = settings.welcomeMessage || "Welcome to our chat! How can we help you today?";

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'bot':
      case 'system':
        return <Bot className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getMessageBgColor = (messageType: string, msgUserName: string) => {
    if (messageType === 'system') return "bg-muted";
    if (msgUserName === userName) return "bg-primary text-primary-foreground";
    return "bg-card border border-border";
  };

  if (isMinimized && isEmbedded) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-16 h-16 shadow-lg"
          data-testid="button-open-chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "chat-widget",
      isEmbedded ? "fixed bottom-4 right-4 z-50 w-96 h-[600px]" : "w-full h-screen",
      className
    )}>
      <Card className="h-full flex flex-col shadow-lg">
        {/* Chat Header */}
        <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{chatRoom.name}</h4>
              <p className="text-xs opacity-90">
                {isConnected ? "Online now" : "Connecting..."}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEmbedded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                data-testid="button-minimize-chat"
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Chat Messages */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Welcome message */}
                <div className="text-center">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {userName} joined the chat
                  </span>
                </div>

                {/* Welcome message from bot */}
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-foreground">
                      Hello {userName}! {welcomeMessage}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatTime(new Date())}
                    </span>
                  </div>
                </div>

                {/* Chat messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start space-x-2",
                      msg.userName === userName ? "justify-end" : ""
                    )}
                  >
                    {msg.userName !== userName && (
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        {getMessageIcon(msg.messageType)}
                      </div>
                    )}
                    
                    <div className={cn(
                      "rounded-lg p-3 max-w-xs chat-message",
                      getMessageBgColor(msg.messageType, msg.userName)
                    )}>
                      {msg.messageType === 'system' ? (
                        <p className="text-xs text-center text-muted-foreground">{msg.content}</p>
                      ) : (
                        <>
                          {msg.userName !== userName && (
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {msg.userName}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <span className={cn(
                            "text-xs mt-1 block",
                            msg.userName === userName ? "opacity-70" : "text-muted-foreground"
                          )}>
                            {formatTime(msg.timestamp)}
                          </span>
                        </>
                      )}
                    </div>

                    {msg.userName === userName && (
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs font-medium text-secondary-foreground">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              disabled={!isConnected || sendMessageMutation.isPending}
              className="flex-1"
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || !isConnected || sendMessageMutation.isPending}
              size="sm"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
