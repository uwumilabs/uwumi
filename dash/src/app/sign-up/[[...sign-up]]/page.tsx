"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-signal-deep rounded-full font-display lowercase",
              card: "bg-card rounded-lg shadow-card",
            },
          }}
        />
      </div>
    </div>
  );
}
