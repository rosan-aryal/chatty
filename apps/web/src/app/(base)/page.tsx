import Link from "next/link";
import {
  MessageCircle,
  Shield,
  Users,
  Zap,
  Globe,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Anonymous Chat",
    description:
      "Connect with random people instantly. No sign-up needed to start chatting.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Stay anonymous or reveal your identity. You're always in control.",
  },
  {
    icon: Users,
    title: "Group Chats",
    description:
      "Create or join public and private group conversations with friends.",
  },
  {
    icon: Globe,
    title: "Country Matching",
    description:
      "Match with people from your country or explore conversations worldwide.",
  },
  {
    icon: Zap,
    title: "Gender Preferences",
    description:
      "Choose who you match with. Premium users get full gender preference controls.",
  },
  {
    icon: Lock,
    title: "Secure & Fast",
    description:
      "Real-time WebSocket messaging with end-to-end reliability.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live now — thousands chatting
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Chat with anyone,{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            anywhere
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Meet new people through random anonymous conversations, create group
          chats, add friends, and build connections — all in real time.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/chat"
            className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Chatting
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border px-8 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to connect
          </h2>
          <p className="mt-3 text-muted-foreground">
            A full-featured chat platform built for meaningful conversations.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border p-6 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
