import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  Code,
  Settings,
  Trash2,
  Search,
  MessageSquare,
  ShoppingCart,
  GraduationCap,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { ChatRoom } from "@shared/schema";

interface ChatRoomWithStats extends ChatRoom {
  messageCount: number;
  activeParticipants: number;
}

interface ChatListProps {
  chatRooms: ChatRoomWithStats[];
  onGetEmbedCode: (chatRoom: ChatRoomWithStats) => void;
}

export default function ChatList({ chatRooms, onGetEmbedCode }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return apiRequest("DELETE", `/api/chatrooms/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      toast({
        title: "Sucesso",
        description: "Sala de chat excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir sala de chat",
        variant: "destructive",
      });
    },
  });

  const toggleChatStatusMutation = useMutation({
    mutationFn: async ({
      chatId,
      newStatus,
    }: {
      chatId: string;
      newStatus: string;
    }) => {
      return apiRequest("PUT", `/api/chatrooms/${chatId}`, {
        status: newStatus,
      });
    },
    onSuccess: (data, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      toast({
        title: "Sucesso",
        description: `Chat ${
          newStatus === "active" ? "ativado" : "pausado"
        } com sucesso`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do chat",
        variant: "destructive",
      });
    },
  });

  const handleDeleteChat = (chatId: string, chatName: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir "${chatName}"? Esta ação não pode ser desfeita.`
      )
    ) {
      deleteChatMutation.mutate(chatId);
    }
  };

  const handleViewChat = (chatId: string) => {
    window.open(`/${chatId}?name=Admin`, "_blank");
  };

  const handleToggleChatStatus = (room: ChatRoomWithStats) => {
    const newStatus = room.status === "active" ? "paused" : "active";
    toggleChatStatusMutation.mutate({ chatId: room.id, newStatus });
  };

  const getActivityTime = (createdAt: Date | string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hora atrás`;
    return `${Math.floor(diffMins / 1440)} dia atrás`;
  };

  const getChatIcon = (name: string) => {
    if (!name) return <MessageSquare className="w-4 h-4" />;
    const lowerName = name.toLowerCase();
    if (lowerName.includes("support") || lowerName.includes("customer")) {
      return <MessageSquare className="w-4 h-4" />;
    }
    if (lowerName.includes("sales") || lowerName.includes("inquiry")) {
      return <ShoppingCart className="w-4 h-4" />;
    }
    if (lowerName.includes("course") || lowerName.includes("help")) {
      return <GraduationCap className="w-4 h-4" />;
    }
    return <MessageSquare className="w-4 h-4" />;
  };

  const getIconColor = (name: string) => {
    if (!name) return "bg-primary/10 text-primary";
    const lowerName = name.toLowerCase();
    if (lowerName.includes("support") || lowerName.includes("customer")) {
      return "bg-primary/10 text-primary";
    }
    if (lowerName.includes("sales") || lowerName.includes("inquiry")) {
      return "bg-green-100 text-green-600";
    }
    if (lowerName.includes("course") || lowerName.includes("help")) {
      return "bg-purple-100 text-purple-600";
    }
    return "bg-primary/10 text-primary";
  };

  const filteredChatRooms = chatRooms.filter(
    (room) =>
      (room.name &&
        room.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.id && room.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.description &&
        room.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Suas Salas de Chat</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-48"
                data-testid="input-search-chats"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredChatRooms.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {searchTerm
              ? "Nenhum chat encontrado para sua busca."
              : "Nenhuma sala de chat criada ainda."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChatRooms.map((room) => (
              <div
                key={room.id}
                className="p-6 hover:bg-muted/50 transition-colors"
                data-testid={`chat-room-${room.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${getIconColor(
                          room.name || ""
                        )}`}
                      >
                        {getChatIcon(room.name || "")}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {room.name || "Chat sem nome"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {room.description || "Sem descrição"}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            ID:{" "}
                            <code className="bg-muted px-1 rounded font-mono">
                              {room.id}
                            </code>
                          </span>
                          <Badge
                            variant={
                              room.status === "active"
                                ? "default"
                                : room.status === "paused"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {room.status === "active" && "● "}
                            {room.status.charAt(0).toUpperCase() +
                              room.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Última atividade: {getActivityTime(room.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {room.messageCount} mensagens
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {room.activeParticipants} usuários ativos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleChatStatus(room)}
                      title={
                        room.status === "active"
                          ? "Pause Chat"
                          : "Activate Chat"
                      }
                      disabled={toggleChatStatusMutation.isPending}
                      className={cn(
                        room.status === "active"
                          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      )}
                      data-testid={`button-toggle-${room.id}`}
                    >
                      {room.status === "active" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewChat(room.id)}
                      title="View Chat"
                      data-testid={`button-view-${room.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGetEmbedCode(room)}
                      title="Get Embed Code"
                      data-testid={`button-embed-${room.id}`}
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Settings"
                      data-testid={`button-settings-${room.id}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChat(room.id, room.name)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-${room.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
