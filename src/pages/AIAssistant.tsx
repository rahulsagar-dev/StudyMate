import { Bot, MessageSquare, MicIcon, History, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceMode } from "@/components/ai-tutor/VoiceMode";
import { ChatMode } from "@/components/ai-tutor/ChatMode";
import { motion } from "framer-motion";

export default function AIAssistant() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
            <p className="text-sm text-muted-foreground">Your personal study assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.dispatchEvent(new CustomEvent("ai-tutor:open-history"))}
          >
            <History className="h-4 w-4" /> History
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.dispatchEvent(new CustomEvent("ai-tutor:new-chat"))}
          >
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card className="overflow-hidden border-white/10" style={{ background: "hsl(240 30% 6%)" }}>
        <Tabs defaultValue="chat">
          <TabsList className="w-full justify-center rounded-none border-b border-white/10 bg-transparent h-12 p-0">
            <TabsTrigger value="voice" className="gap-2 rounded-none h-full border-b-2 border-transparent text-white/60 data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-primary">
              <MicIcon className="h-4 w-4" /> Voice Mode
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 rounded-none h-full border-b-2 border-transparent text-white/60 data-[state=active]:bg-white/5 data-[state=active]:text-white data-[state=active]:border-primary">
              <MessageSquare className="h-4 w-4" /> Chat Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="m-0">
            <VoiceMode />
          </TabsContent>
          <TabsContent value="chat" className="m-0">
            <ChatMode />
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
