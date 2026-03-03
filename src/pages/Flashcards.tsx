import { useState } from "react";
import { Layers, Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@/types/flashcard";

function FlashcardItem({ card, onDelete }: { card: Flashcard; onDelete: (id: string) => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 cursor-pointer h-48"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 preserve-3d ${flipped ? "rotate-y-180" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border border-border/50 bg-card p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-foreground font-medium leading-relaxed">{card.front}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Click to flip</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-foreground leading-relaxed">{card.back}</p>
          <span className="text-xs text-primary">Answer</span>
        </div>
      </div>
    </div>
  );
}

export default function Flashcards() {
  const { toast } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const handleAdd = () => {
    if (!front.trim() || !back.trim()) {
      toast({ title: "Missing fields", description: "Fill in both front and back.", variant: "destructive" });
      return;
    }
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      front: front.trim(),
      back: back.trim(),
      createdAt: new Date().toISOString(),
    };
    setCards((prev) => [newCard, ...prev]);
    setFront("");
    setBack("");
    toast({ title: "Flashcard created!" });
  };

  const handleDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Flashcard deleted" });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-sm text-muted-foreground">Create and review flashcards to boost retention</p>
        </div>
      </div>

      {/* Create Form */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create Flashcard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Front — Question or term"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <Textarea
            placeholder="Back — Answer or definition"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="min-h-[80px] bg-secondary/50 border-border/50 resize-none"
          />
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Save Flashcard
          </Button>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <RotateCcw className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">You haven't created any flashcards yet.</p>
            <p className="text-sm text-muted-foreground/60">Create your first flashcard above to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-3">{cards.length} flashcard{cards.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <FlashcardItem key={card.id} card={card} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
