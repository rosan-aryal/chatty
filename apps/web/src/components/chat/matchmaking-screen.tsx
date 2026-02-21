"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchmakingScreenProps {
  status: "idle" | "searching" | "matched";
  onStartSearch: (genderPreference?: string) => void;
  onCancel: () => void;
  isPremium?: boolean;
  partnerName?: string;
}

export function MatchmakingScreen({
  status,
  onStartSearch,
  onCancel,
  isPremium,
  partnerName,
}: MatchmakingScreenProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [genderPref, setGenderPref] = useState<string | undefined>();

  useEffect(() => {
    if (status !== "searching") {
      setTimeLeft(60);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "matched") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20"
        >
          <Sparkles className="h-10 w-10 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-bold">Match Found!</h2>
        <p className="text-muted-foreground">
          You&apos;re now chatting with <span className="font-semibold text-foreground">{partnerName}</span>
        </p>
      </motion.div>
    );
  }

  if (status === "searching") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-primary/20"
            style={{ width: 96, height: 96, left: -8, top: -8 }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Finding someone to chat with...</h2>
          <p className="text-sm text-muted-foreground">
            Time remaining: <span className="font-mono font-medium text-foreground">{timeLeft}s</span>
          </p>
        </div>
        <Button variant="outline" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    );
  }

  // Idle state
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Search className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Chat Anonymously</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Get matched with a random person for an anonymous conversation. Your identity stays hidden.
        </p>
      </div>

      {isPremium && (
        <div className="flex gap-2">
          <span className="text-xs text-muted-foreground self-center mr-1">Match with:</span>
          {[
            { value: undefined, label: "Anyone" },
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setGenderPref(opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                genderPref === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <Button size="lg" onClick={() => onStartSearch(genderPref)} className="gap-2 px-8">
        <Sparkles className="h-4 w-4" />
        Start Chat
      </Button>
    </div>
  );
}
