import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface UnderConstructionProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function UnderConstruction({ title, description, icon }: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
          {icon || <Construction className="h-12 w-12 text-primary" />}
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
          <span className="text-lg">🚧</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-display font-bold text-foreground mb-3">
        {title}
      </h1>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                i <= 2 ? "bg-primary" : "bg-muted"
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">In Development</span>
      </div>

      {/* Back to Dashboard */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-xp/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
