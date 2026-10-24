"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              card: "bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
