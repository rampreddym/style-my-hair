import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  is_image: boolean;
  image_url?: string;
  created_at: string;
  read_at?: string;
}

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylistId: string;
  stylistName: string;
  stylistPhoto?: string;
  customerId: string | null;
  appointmentId?: string;
}

export const MessagingDialog = ({
  open,
  onOpenChange,
  stylistId,
  stylistName,
  stylistPhoto,
  customerId,
  appointmentId,
}: MessagingDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [stylistUserId, setStylistUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && stylistId) {
      fetchStylistUserId();
    }
  }, [open, stylistId]);

  useEffect(() => {
    if (open && user && stylistUserId) {
      fetchMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [open, user, stylistUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchStylistUserId = async () => {
    const { data } = await supabase
      .from("stylists")
      .select("user_id")
      .eq("id", stylistId)
      .single();
    
    if (data?.user_id) {
      setStylistUserId(data.user_id);
    }
  };

  const fetchMessages = async () => {
    if (!user || !stylistUserId) return;

    // Fetch messages between current user and stylist
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${stylistUserId}),and(from_user_id.eq.${stylistUserId},to_user_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      markMessagesAsRead(data);
    }
  };

  const subscribeToMessages = () => {
    if (!user || !stylistUserId) return () => {};

    const channel = supabase
      .channel(`messages-${user.id}-${stylistUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's part of this conversation
          if (
            (newMsg.from_user_id === user.id && newMsg.to_user_id === stylistUserId) ||
            (newMsg.from_user_id === stylistUserId && newMsg.to_user_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.to_user_id === user.id) {
              markMessageAsRead(newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async (msgs: Message[]) => {
    if (!user) return;
    const unreadIds = msgs
      .filter((m) => m.to_user_id === user.id && !m.read_at)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !stylistUserId) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      appointment_id: appointmentId || null,
      from_user_id: user.id,
      to_user_id: stylistUserId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {stylistPhoto ? (
                <img src={stylistPhoto} alt={stylistName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-medium text-primary">{stylistName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base">{stylistName}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {t('messaging.sendMessage')}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  {t('messaging.noMessages')}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {t('messaging.startConversation')}
                </p>
              </div>
            )}
            {messages.map((message) => {
              const isOwn = message.from_user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    {message.is_image && message.image_url ? (
                      <img
                        src={message.image_url}
                        alt="Shared image"
                        className="rounded-lg max-w-full"
                      />
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatTime(message.created_at)}
                      {isOwn && message.read_at && " ✓"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t flex gap-2 flex-shrink-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messaging.typeMessage')}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending || !stylistUserId}
          />
          <Button 
            onClick={sendMessage} 
            disabled={sending || !newMessage.trim() || !stylistUserId}
            className=""
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
