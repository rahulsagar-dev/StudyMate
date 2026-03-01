import { Bot } from "lucide-react";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function AIAssistant() {
  return (
    <UnderConstruction
      title="AI Assistant Coming Soon"
      description="Get ready to supercharge your learning! Our AI assistant will help you study smarter, answer questions, and guide you through difficult concepts."
      icon={<Bot className="h-12 w-12 text-primary" />}
    />
  );
}
