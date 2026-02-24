"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Shield, ExternalLink, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import {
  useUpdateProfile,
  useToggleVisibility,
  useBillingPortal,
} from "@/hooks/use-settings";
import { CountrySelector } from "@/components/country-selector";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const toggleVisibility = useToggleVisibility();
  const handleBillingPortal = useBillingPortal();

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

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
              <CountrySelector
                value={country}
                onChange={(code) => setCountry(code)}
              />
            </div>
            <Button
              size="sm"
              onClick={() => updateProfile.mutate({ gender, country })}
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
            <Link href={"/chat/premium" as any}>
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
