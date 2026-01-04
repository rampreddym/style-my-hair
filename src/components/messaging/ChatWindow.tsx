import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Image, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ChatWindowProps {
  appointmentId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  onBack?: () => void;
}

export const ChatWindow = ({
  appointmentId,
  otherUserId,
  otherUserName,
  otherUserPhoto,
  onBack,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    subscribeToMessages();
  }, [appointmentId, user]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      markMessagesAsRead(data);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.to_user_id === user?.id) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async (msgs: Message[]) => {
    const unreadIds = msgs
      .filter((m) => m.to_user_id === user?.id && !m.read_at)
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
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      appointment_id: appointmentId,
      from_user_id: user.id,
      to_user_id: otherUserId,
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
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {otherUserPhoto ? (
              <img src={otherUserPhoto} alt={otherUserName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-medium text-primary">{otherUserName.charAt(0)}</span>
            )}
          </div>
          <div>
            <CardTitle className="text-base">{otherUserName}</CardTitle>
            <p className="text-xs text-muted-foreground">About your appointment</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
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
        <div className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
