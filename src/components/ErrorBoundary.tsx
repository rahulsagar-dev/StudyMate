import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-2xl border border-border/50 bg-card p-8 text-center">
          <h1 className="text-xl font-display font-semibold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This page hit an unexpected error. Your progress is safe — reload to keep studying.
          </p>
          <Button onClick={this.handleReload} className="bg-gradient-primary hover:opacity-90">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
}
