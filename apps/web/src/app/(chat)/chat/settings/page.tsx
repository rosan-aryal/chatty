"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";
import { authClient } from "@/lib/auth-client";
import { Crown, Shield, ExternalLink, Loader2, Save } from "lucide-react";
import Link from "next/link";

const API = env.NEXT_PUBLIC_SERVER_URL;

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/profile`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    if (profile) {
      setGender(profile.gender || "");
      setCountry(profile.country || "");
      setIsAnonymous(profile.isAnonymous ?? true);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/user/onboard`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, country }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const toggleVisibility = useMutation({
    mutationFn: async (value: boolean) => {
      const res = await fetch(`${API}/api/user/visibility`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnonymous: value }),
      });
      if (!res.ok) throw new Error("Failed to toggle visibility");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update visibility"),
  });

  const handleBillingPortal = async () => {
    try {
      const result = await (authClient as any).subscription.billingPortal({
        returnUrl: window.location.href,
      });
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      toast.error("Could not open billing portal");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Profile Info (read-only) */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Profile
          </h2>
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <p className="text-sm font-medium">{profile?.name || "\u2014"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <p className="text-sm font-medium">
                {profile?.email || "\u2014"}
              </p>
            </div>
          </div>
        </section>

        {/* Editable details */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </h2>
          <div className="rounded-xl border border-border p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Gender</label>
              <div className="flex gap-2">
                {["male", "female", "other"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                      gender === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter your country"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button
              size="sm"
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="gap-1.5"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          </div>
        </section>

        {/* Privacy */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Privacy
          </h2>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Anonymous Mode
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hide your profile from non-friends
              </p>
            </div>
            <button
              onClick={() => {
                const next = !isAnonymous;
                setIsAnonymous(next);
                toggleVisibility.mutate(next);
              }}
              disabled={toggleVisibility.isPending}
              className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                isAnonymous ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  isAnonymous ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Subscription */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Subscription
          </h2>
          {profile?.isPremium ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Premium Active
              </p>
              <p className="text-xs text-muted-foreground">
                You have access to all premium features including
                gender-preference matching.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBillingPortal}
                className="gap-1.5"
              >
                Manage Billing
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Link href="/chat/premium">
              <div className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 cursor-pointer group">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade to Premium
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unlock gender-preference matching and exclusive features
                </p>
              </div>
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
