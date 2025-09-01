import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ChatRoom } from "@shared/schema";

interface EmbedCodeModalProps {
  chatRoom: ChatRoom;
  onClose: () => void;
}

interface ChatRoomWithStats extends ChatRoom {
  messageCount: number;
  activeParticipants: number;
}

export default function EmbedCodeModal({ chatRoom, onClose }: EmbedCodeModalProps) {
  const { toast } = useToast();
  const [width, setWidth] = useState("400");
  const [height, setHeight] = useState("600");
  const [defaultName, setDefaultName] = useState("");
  const [showBranding, setShowBranding] = useState(true);
  const [theme, setTheme] = useState("blue");
  const [position, setPosition] = useState("bottom-right");
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to our chat! How can we help you today?");

  const baseUrl = window.location.origin;
  const chatUrl = `${baseUrl}/${chatRoom.id}`;
  const embedUrl = defaultName 
    ? `${chatUrl}?name=${encodeURIComponent(defaultName)}`
    : chatUrl;

  const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  title="${chatRoom.name}"
></iframe>`;

  const jsWidgetCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-chat-id', '${chatRoom.id}');
    script.setAttribute('data-position', '${position}');
    ${defaultName ? `script.setAttribute('data-default-name', '${defaultName}');` : ''}
    script.setAttribute('data-theme', '${theme}');
    document.head.appendChild(script);
  })();
</script>`;

  const reactCode = `import ChatWidget from '@chatlink/react';

<ChatWidget 
  chatId="${chatRoom.id}"
  ${defaultName ? `defaultName="${defaultName}"` : ''}
  theme="${theme}"
  position="${position}"
  width="${width}"
  height="${height}"
/>`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: `${label} copied to clipboard!`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewEmbed = () => {
    window.open(embedUrl, '_blank', 'width=500,height=700');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Embed Code & Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Chat Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  data-testid="input-embed-width"
                />
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  data-testid="input-embed-height"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="defaultName">Default User Name (optional)</Label>
              <Input
                id="defaultName"
                value={defaultName}
                onChange={(e) => setDefaultName(e.target.value)}
                placeholder="e.g., Visitor"
                data-testid="input-default-name"
              />
            </div>

            <div>
              <Label htmlFor="theme">Chat Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Default Blue</SelectItem>
                  <SelectItem value="green">Green Theme</SelectItem>
                  <SelectItem value="purple">Purple Theme</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">Widget Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger data-testid="select-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                  <SelectItem value="full-screen">Full Screen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                data-testid="textarea-welcome-message"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showBranding"
                  checked={showBranding}
                  onCheckedChange={(checked) => setShowBranding(!!checked)}
                  data-testid="checkbox-show-branding"
                />
                <Label htmlFor="showBranding" className="text-sm">Show ChatLink branding</Label>
              </div>
            </div>
          </div>

          {/* Code Preview */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Generated Code</h4>
            
            <Tabs defaultValue="iframe" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="iframe" data-testid="tab-iframe">Iframe</TabsTrigger>
                <TabsTrigger value="javascript" data-testid="tab-javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="react" data-testid="tab-react">React</TabsTrigger>
              </TabsList>
              
              <TabsContent value="iframe" className="space-y-3">
                <div>
                  <Label>Iframe Embed</Label>
                  <div className="bg-muted p-3 rounded-md border border-border max-h-48 overflow-y-auto">
                    <code className="text-xs text-foreground break-all whitespace-pre-wrap">
                      {iframeCode}
                    </code>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="javascript" className="space-y-3">
                <div>
                  <Label>JavaScript Widget</Label>
                  <div className="bg-muted p-3 rounded-md border border-border max-h-48 overflow-y-auto">
                    <code className="text-xs text-foreground break-all whitespace-pre-wrap">
                      {jsWidgetCode}
                    </code>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="react" className="space-y-3">
                <div>
                  <Label>React Component</Label>
                  <div className="bg-muted p-3 rounded-md border border-border max-h-48 overflow-y-auto">
                    <code className="text-xs text-foreground break-all whitespace-pre-wrap">
                      {reactCode}
                    </code>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex space-x-2">
              <Button
                onClick={() => copyToClipboard(iframeCode, "Iframe code")}
                size="sm"
                data-testid="button-copy-iframe"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={() => downloadCode(iframeCode, `${chatRoom.id}-embed.html`)}
                variant="secondary"
                size="sm"
                data-testid="button-download-code"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={previewEmbed}
                variant="secondary"
                size="sm"
                data-testid="button-preview-embed"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>

            <div>
              <Label>Direct Chat URL</Label>
              <div className="flex">
                <Input
                  value={embedUrl}
                  readOnly
                  className="rounded-r-none"
                  data-testid="input-chat-url"
                />
                <Button
                  onClick={() => copyToClipboard(embedUrl, "Chat URL")}
                  variant="secondary"
                  className="rounded-l-none border-l-0"
                  data-testid="button-copy-url"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
