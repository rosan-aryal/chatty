import { Check, X, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  { name: "Random Anonymous Chat", free: true, premium: true },
  { name: "Group Chats", free: true, premium: true },
  { name: "Friend System & DMs", free: true, premium: true },
  { name: "M \u2192 M Gender Matching", free: true, premium: true },
  { name: "F \u2192 F Gender Matching", free: false, premium: true },
  { name: "F \u2192 M Gender Matching", free: false, premium: true },
  { name: "M \u2192 F Gender Matching", free: false, premium: true },
  { name: "Country-Based Matching", free: true, premium: true },
  { name: "Priority Matching Queue", free: false, premium: true },
  { name: "Custom Profile Themes", free: false, premium: true },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Start chatting for free. Upgrade for premium matching features.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <div className="rounded-2xl border p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to start chatting
            </p>
          </div>
          <Link
            href="/chat"
            className="block w-full rounded-lg border py-2.5 text-center text-sm font-medium hover:bg-muted transition-colors"
          >
            Get Started
          </Link>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f.name} className="flex items-center gap-3 text-sm">
                {f.free ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={f.free ? "" : "text-muted-foreground/60"}>
                  {f.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="relative rounded-2xl border-2 border-primary p-8 space-y-6">
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
            Popular
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Premium
              <Zap className="h-4 w-4 text-yellow-500" />
            </h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Unlock all matching preferences and premium features
            </p>
          </div>
          <Link
            href="/chat"
            className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upgrade to Premium
          </Link>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f.name} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
