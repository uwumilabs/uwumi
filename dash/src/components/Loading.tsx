"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2
          className={`${sizeClasses[size]} motion-safe:animate-spin text-signal`}
        />
        {text && (
          <p className="text-sm text-muted-foreground">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export function LoadingSkeleton({
  className = "",
  rows = 3,
}: LoadingSkeletonProps) {
  return (
    <div className={`motion-safe:animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="mb-3 last:mb-0">
          <div className="h-4 bg-paper-3 rounded-full mb-2"></div>
          <div className="h-4 bg-paper-3 rounded-full w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className = "" }: LoadingCardProps) {
  return (
    <div
      className={`motion-safe:animate-pulse bg-card rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-12 w-12 bg-paper-3 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-paper-3 rounded-full mb-2"></div>
          <div className="h-3 bg-paper-3 rounded-full w-2/3"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-paper-3 rounded-full"></div>
        <div className="h-3 bg-paper-3 rounded-full w-5/6"></div>
        <div className="h-3 bg-paper-3 rounded-full w-4/6"></div>
      </div>
    </div>
  );
}

interface LoadingPageProps {
  text?: string;
}

export function LoadingPage({ text = "Loading..." }: LoadingPageProps) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner size="lg" text={text} />
        </motion.div>
      </div>
    </div>
  );
}
