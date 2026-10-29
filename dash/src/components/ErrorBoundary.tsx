"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-dvh flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-4">
            <div className="bg-card rounded-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-paper-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>

              <h3 className="font-display text-lg font-medium lowercase text-ink mb-2">
                Something went wrong
              </h3>

              <p className="text-sm text-muted-foreground mb-6">
                {this.state.error?.message ||
                  "An unexpected error occurred. Please try again."}
              </p>

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center h-9 px-4 rounded-full font-display text-sm font-medium lowercase text-primary-foreground bg-primary hover:bg-signal-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus transition-colors duration-micro ease-out"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
