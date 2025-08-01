  'use client';

  import { useState } from 'react';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import { Button } from '@/components/ui/button';
  import { Textarea } from '@/components/ui/textarea';
  import { Card } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { toast } from 'sonner';
  import { difyAPI } from '@/lib/dify/api';
  import type { DifyApp } from '@/lib/dify/config';
  import { Send, Loader2 } from 'lucide-react';
  import { useTranslations } from 'next-intl';

  interface DifyAppModalProps {
    app: DifyApp;
    isOpen: boolean;
    onClose: () => void;
  }

  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }

  export function DifyAppModal({ app, isOpen, onClose }: DifyAppModalProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string>();
    const { toast } = useToast();
    const t = useI18n();

    const handleSubmit = async () => {
      if (!input.trim() || isLoading) return;

      setIsLoading(true);
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      try {
        const response = await difyAPI.createChatMessage(app.id, {
          query: input,
          user: 'current-user',
          inputs: {},
          conversation_id: conversationId,
        });

        setConversationId(response.conversation_id);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer || 'No response received',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        toast.error({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{app.name}</span>
              <div className="flex gap-2">
                <Badge variant={app.is_installed ? "default" : "secondary"}>
                  {app.is_installed ? 'Installed' : 'Not Installed'}
                </Badge>
                <Badge variant="outline">{app.model_config?.model?.provider}</Badge>
              </div>
            </DialogTitle>
            <DialogDescription>{app.description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-4 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-50 dark:bg-blue-900'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-gray-50 dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="min-h-10 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }