import { useState } from "react";
import { Mic, X, Sparkles } from "lucide-react";
import { VoiceAgent } from "./VoiceAgent";
import { cn } from "@/lib/utils";

/**
 * Floating mic button (bottom-left) that opens the Aria voice agent modal.
 * Placed opposite the chat assistant button to avoid overlap.
 */
export function FloatingVoiceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button — sits next to the chat bot (bottom-right) */}
      <button
        onClick={() => setOpen(true)}
        title="Talk to Aria"
        className={cn(
          "fixed bottom-7 right-24 z-40 w-12 h-12 rounded-full",
          "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
          "shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all",
          "flex items-center justify-center",
        )}
      >
        <Mic className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    Aria
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your AI voice tutor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6">
              <VoiceAgent onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
