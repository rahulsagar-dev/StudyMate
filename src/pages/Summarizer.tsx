import { FileText } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function Summarizer() {
  return (
    <UnderConstruction
      title="AI Summarizer Under Construction"
      description="Soon you'll be able to condense lengthy notes and articles into clear, concise summaries instantly. Perfect for quick revision!"
      icon={<FileText className="h-12 w-12 text-primary" />}
    />
  );
}
