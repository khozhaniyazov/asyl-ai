import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MessageCircle, Send, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../api";
import { useTranslation } from "react-i18next";

interface ConversationItem { id: number; parent_id: number; parent_name: string; parent_phone: string; last_message_at: string | null; unread_count: number; }
interface MessageItem { id: number; sender_type: string; text: string | null; media_url: string | null; read_at: string | null; created_at: string | null; }

export default function MessagesView() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvo, setActiveConvo] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try { const data = await api.getConversations(); setConversations(data); } catch { /* empty */ }
    setLoading(false);
  };

  const loadMessages = async (convoId: number) => {
    try { const data = await api.getMessages(convoId); setMessages(data); } catch { /* empty */ }
  };

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (activeConvo) loadMessages(activeConvo.id); }, [activeConvo]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo) return;
    setSending(true);
    try {
      await api.sendMessage(activeConvo.id, { text: newMsg });
      setNewMsg("");
      loadMessages(activeConvo.id);
      loadConversations();
    } catch { /* empty */ }
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("messages.title")}</h1>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[400px]">
        {/* Conversation list */}
        <div className={`${activeConvo ? "hidden md:block" : ""} w-full md:w-80 bg-card border border-border rounded-xl overflow-hidden`}>
          <div className="p-3 border-b border-border"><p className="text-xs text-muted-foreground">{t("messages.conversations")} ({conversations.length})</p></div>
          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm"><MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />{t("messages.noConversations")}</div>
            ) : conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveConvo(c)} className={`w-full px-4 py-3 text-left border-b border-border hover:bg-accent/30 transition-colors ${activeConvo?.id === c.id ? "bg-accent/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{c.parent_name}</p>
                  {c.unread_count > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{c.unread_count}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.parent_phone}</p>
                {c.last_message_at && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(c.last_message_at).toLocaleString("ru-RU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {activeConvo ? (
          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <button onClick={() => setActiveConvo(null)} className="md:hidden p-1"><ArrowLeft className="w-4 h-4" /></button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">{activeConvo.parent_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
              <div><p className="text-sm font-medium">{activeConvo.parent_name}</p><p className="text-xs text-muted-foreground">{activeConvo.parent_phone}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === "therapist" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${msg.sender_type === "therapist" ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                    {msg.text && <p>{msg.text}</p>}
                    <p className={`text-[10px] mt-1 ${msg.sender_type === "therapist" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder={t("messages.typeMessage")} className="flex-1 px-3 py-2 bg-input-background rounded-xl text-sm outline-none" />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()} className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 bg-card border border-border rounded-xl items-center justify-center text-muted-foreground">
            <div className="text-center"><MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">{t("messages.selectConversation")}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
