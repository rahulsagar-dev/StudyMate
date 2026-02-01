import { useState } from "react";
import { Layers, Plus, ChevronLeft, ChevronRight, RotateCcw, Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleDecks = [
  { id: 1, name: "Biology - Photosynthesis", cards: 24, mastered: 18, color: "xp" },
  { id: 2, name: "Physics - Newton's Laws", cards: 15, mastered: 10, color: "primary" },
  { id: 3, name: "History - World War II", cards: 32, mastered: 20, color: "level" },
  { id: 4, name: "Chemistry - Periodic Table", cards: 20, mastered: 12, color: "achievement" },
];

const sampleCards = [
  {
    front: "What is photosynthesis?",
    back: "Photosynthesis is the process by which plants convert light energy, usually from the sun, into chemical energy that can be later released to fuel the plant's activities.",
  },
  {
    front: "What are the reactants of photosynthesis?",
    back: "Carbon dioxide (CO₂) and Water (H₂O)",
  },
  {
    front: "What are the products of photosynthesis?",
    back: "Glucose (C₆H₁₂O₆) and Oxygen (O₂)",
  },
];

export default function Flashcards() {
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % sampleCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + sampleCards.length) % sampleCards.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Flashcards</h1>
            <p className="text-muted-foreground">Master your subjects with spaced repetition</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Create Deck
        </button>
      </div>

      {selectedDeck === null ? (
        /* Deck Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => setSelectedDeck(deck.id)}
              className="bg-card rounded-2xl border border-border/50 p-6 text-left hover:border-primary/30 transition-all hover:scale-[1.02] group"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  deck.color === "xp" && "bg-xp/10",
                  deck.color === "primary" && "bg-primary/10",
                  deck.color === "level" && "bg-level/10",
                  deck.color === "achievement" && "bg-achievement/10"
                )}
              >
                <Layers
                  className={cn(
                    "h-6 w-6",
                    deck.color === "xp" && "text-xp",
                    deck.color === "primary" && "text-primary",
                    deck.color === "level" && "text-level",
                    deck.color === "achievement" && "text-achievement"
                  )}
                />
              </div>
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {deck.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{deck.cards} cards</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mastered</span>
                  <span className="text-xp font-medium">{deck.mastered}/{deck.cards}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-xp rounded-full"
                    style={{ width: `${(deck.mastered / deck.cards) * 100}%` }}
                  />
                </div>
              </div>
            </button>
          ))}

          {/* AI Generate Card */}
          <button className="bg-card rounded-2xl border border-dashed border-primary/30 p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-primary">Generate with AI</p>
            <p className="text-xs text-muted-foreground text-center">
              Create flashcards from your notes automatically
            </p>
          </button>
        </div>
      ) : (
        /* Flashcard Study Mode */
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setSelectedDeck(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Decks
          </button>

          {/* Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-80 cursor-pointer perspective-1000"
          >
            <div
              className={cn(
                "absolute inset-0 bg-card rounded-3xl border border-border/50 p-8 flex items-center justify-center text-center transition-all duration-500 backface-hidden",
                isFlipped && "rotate-y-180 opacity-0"
              )}
            >
              <div>
                <p className="text-xs text-muted-foreground mb-4">QUESTION</p>
                <p className="text-xl font-medium text-foreground">
                  {sampleCards[currentCard].front}
                </p>
                <p className="text-sm text-muted-foreground mt-6">Click to reveal answer</p>
              </div>
            </div>
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/30 p-8 flex items-center justify-center text-center transition-all duration-500 backface-hidden rotate-y-180",
                isFlipped && "rotate-y-0 opacity-100"
              )}
            >
              <div>
                <p className="text-xs text-primary mb-4">ANSWER</p>
                <p className="text-lg text-foreground">{sampleCards[currentCard].back}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handlePrev}
              className="p-3 rounded-xl bg-secondary hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors group">
              <X className="h-6 w-6 text-destructive" />
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-3 rounded-xl bg-secondary hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="p-4 rounded-xl bg-xp/10 hover:bg-xp/20 transition-colors group">
              <Check className="h-6 w-6 text-xp" />
            </button>

            <button
              onClick={handleNext}
              className="p-3 rounded-xl bg-secondary hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Card {currentCard + 1} of {sampleCards.length}
            </p>
            <div className="flex gap-1 justify-center mt-3">
              {sampleCards.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentCard ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
