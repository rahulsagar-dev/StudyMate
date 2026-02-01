import { Layers } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Flashcards() {
  return (
    <UnderConstruction
      title="Flashcards Feature Being Built"
      description="Master any subject with spaced repetition! Create, organize, and review flashcard decks to boost your memory and retention."
      icon={<Layers className="h-12 w-12 text-primary" />}
    />
  );
}
