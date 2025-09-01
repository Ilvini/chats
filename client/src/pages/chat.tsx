import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ChatWidget from "@/components/chat-widget";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { ChatRoom } from "@shared/schema";

export default function Chat() {
  const params = useParams();
  const chatId = params.chatId;

  // Obter nome do usuário dos parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get("name") || "Anônimo";

  const {
    data: chatRoom,
    isLoading,
    error,
  } = useQuery<ChatRoom>({
    queryKey: ["/api/chatrooms", chatId],
    enabled: !!chatId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando chat...
          </p>
        </div>
      </div>
    );
  }

  if (error || !chatRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">
                Chat não encontrado
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              A sala de chat que você procura não existe ou foi removida.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ID do chat:{" "}
              <code className="bg-muted px-1 rounded">{chatId}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chatRoom.status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground mb-2">
                {chatRoom.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Este chat está pausado no momento. Por favor, volte mais tarde.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatWidget chatRoom={chatRoom} userName={userName} isEmbedded={false} />
    </div>
  );
}
