import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, MessageSquare, ExternalLink, Plus } from "lucide-react";
import ChatList from "@/components/chat-list";
import CreateChatForm from "@/components/create-chat-form";
import EmbedCodeModal from "@/components/embed-code-modal";
import type { ChatRoom } from "@shared/schema";

interface ChatRoomWithStats extends ChatRoom {
  messageCount: number;
  activeParticipants: number;
}

export default function Dashboard() {
  const [selectedChatForEmbed, setSelectedChatForEmbed] = useState<ChatRoomWithStats | null>(null);

  const { data: chatRooms = [], isLoading } = useQuery<ChatRoomWithStats[]>({
    queryKey: ['/api/chatrooms'],
  });

  // Calculate dashboard stats
  const totalChats = chatRooms.length;
  const activeUsers = chatRooms.reduce((sum, room) => sum + room.activeParticipants, 0);
  const totalMessages = chatRooms.reduce((sum, room) => sum + room.messageCount, 0);
  const embedViews = totalMessages * 2; // Mock calculation

  const handleGetEmbedCode = (chatRoom: ChatRoomWithStats) => {
    setSelectedChatForEmbed(chatRoom);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="text-primary h-8 w-8" />
                <h1 className="text-xl font-bold text-foreground">ChatLink</h1>
              </div>
              <span className="text-sm text-muted-foreground">Embeddable Chat Service</span>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="#dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</a>
              <a href="#analytics" className="text-muted-foreground hover:text-primary transition-colors">Analytics</a>
              <a href="#settings" className="text-muted-foreground hover:text-primary transition-colors">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-chats">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Chats</p>
                  <p className="text-2xl font-bold text-foreground">{totalChats}</p>
                </div>
                <MessageCircle className="text-primary h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-users">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
                </div>
                <Users className="text-green-500 h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-messages-today">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Messages</p>
                  <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
                </div>
                <MessageSquare className="text-blue-500 h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-embed-views">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Embed Views</p>
                  <p className="text-2xl font-bold text-foreground">{embedViews}</p>
                </div>
                <ExternalLink className="text-purple-500 h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat List Section */}
          <div className="lg:col-span-2">
            <ChatList chatRooms={chatRooms} onGetEmbedCode={handleGetEmbedCode} />
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <CreateChatForm />

            {/* Quick Embed Example */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Embed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy and paste this code into your website:
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-xs text-foreground break-all">
                    {`<iframe src="${window.location.origin}/cs-support-001?name=John" width="400" height="600" frameborder="0"></iframe>`}
                  </code>
                </div>
                <Button 
                  className="w-full mt-3" 
                  variant="secondary" 
                  data-testid="button-copy-quick-embed"
                  onClick={() => {
                    const code = `<iframe src="${window.location.origin}/cs-support-001?name=John" width="400" height="600" frameborder="0"></iframe>`;
                    navigator.clipboard.writeText(code);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <a href="#docs" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                    <span className="text-sm">📚</span>
                    <span className="text-sm">Documentation</span>
                  </a>
                  <a href="#api" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                    <span className="text-sm">⚡</span>
                    <span className="text-sm">API Reference</span>
                  </a>
                  <a href="#examples" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                    <span className="text-sm">💡</span>
                    <span className="text-sm">Examples</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Embed Code Modal */}
      {selectedChatForEmbed && (
        <EmbedCodeModal 
          chatRoom={selectedChatForEmbed}
          onClose={() => setSelectedChatForEmbed(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="text-primary h-5 w-5" />
                <span className="font-bold text-foreground">ChatLink</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Simple, embeddable chat service for your websites.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-3">Product</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#api" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#docs" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#help" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-3">Company</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#privacy" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#terms" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 ChatLink. Built with ❤️ for seamless communication.
          </div>
        </div>
      </footer>
    </div>
  );
}
