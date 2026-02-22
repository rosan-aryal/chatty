"use client";

import { Button } from "@/components/ui/button";
import { Crown, Check, X, ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

const features = [
  { name: "Random matchmaking", free: true, premium: true },
  { name: "Anonymous chat", free: true, premium: true },
  { name: "Group chats", free: true, premium: true },
  { name: "Friend system", free: true, premium: true },
  { name: "Male to Female matching", free: false, premium: true },
  { name: "Female to Female matching", free: false, premium: true },
];

export default function PremiumPage() {
  const handleSubscribe = async () => {
    try {
      const result = await (authClient as any).subscription.upgrade({
        plan: "premium",
        successUrl: `${window.location.origin}/chat`,
        cancelUrl: `${window.location.origin}/chat/premium`,
      });
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      toast.error("Could not start checkout");
    }
  };

  return (
    <div className="flex h-full flex-col items-center p-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Back link */}
        <Link
          href={"/chat/settings" as any}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        {/* Hero */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Go Premium</h1>
          <p className="text-muted-foreground">
            Unlock gender-preference matching and more
          </p>
        </div>

        {/* Feature comparison table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 border-b border-border bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium">Feature</span>
            <span className="text-sm font-medium text-center">Free</span>
            <span className="text-sm font-medium text-center">Premium</span>
          </div>
          {features.map((f, i) => (
            <div
              key={f.name}
              className={`grid grid-cols-3 px-4 py-3 ${
                i < features.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <span className="text-sm">{f.name}</span>
              <span className="flex justify-center">
                {f.free ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <span className="flex justify-center">
                <Check className="h-4 w-4 text-green-500" />
              </span>
            </div>
          ))}
        </div>

        {/* Subscribe CTA */}
        <div className="text-center space-y-3">
          <Button
            size="lg"
            onClick={handleSubscribe}
            className="gap-2 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20"
          >
            <Crown className="h-4 w-4" />
            Subscribe to Premium
          </Button>
          <p className="text-xs text-muted-foreground">
            Monthly subscription. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
