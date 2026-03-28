import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetChatHistory, useSendChatMessage, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AIChatbot() {
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useGetChatHistory();
  const sendMutation = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        setInput("");
      }
    }
  });

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMutation.mutate({ data: { message: input } });
  };

  return (
    <div className="h-screen flex flex-col pt-0">
      <div className="shrink-0 bg-background/80 backdrop-blur-md border-b z-10">
        <PageHeader title="Health AI" description="Ask questions about PCOS, Thyroid, or your symptoms." />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : history?.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Bot className="w-16 h-16 mx-auto mb-4" />
            <p>Start a conversation. I'm here to help.</p>
          </div>
        ) : (
          history?.map((msg, i) => (
            <motion.div 
              key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-white shadow-md'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-card border border-border shadow-sm rounded-tl-sm text-foreground'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))
        )}
        {sendMutation.isPending && (
          <div className="flex gap-4 max-w-3xl mr-auto">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0"><Bot className="w-6 h-6" /></div>
            <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-2 text-muted-foreground">
               <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 sm:p-6 bg-background border-t">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type your health question..." disabled={sendMutation.isPending}
            className="flex-1 bg-card border border-border rounded-full px-6 py-4 outline-none focus:border-primary focus:ring-4 ring-primary/10 shadow-sm disabled:opacity-50 pr-16"
          />
          <button type="submit" disabled={!input.trim() || sendMutation.isPending} className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
