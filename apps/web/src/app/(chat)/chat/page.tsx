"use client";

import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  Users,
  UserPlus,
  Crown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

const actions = [
  {
    title: "Chat Anonymously",
    description:
      "Get matched with a random person for an anonymous conversation",
    icon: MessageCircle,
    href: "/chat/anonymously",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Browse Groups",
    description: "Join public groups or create your own community",
    icon: Users,
    href: "/chat/groups",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Friends",
    description: "Chat with your friends or manage friend requests",
    icon: UserPlus,
    href: "/chat/friends",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export default function ChatDashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/profile`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  return (
    <div className="flex h-full flex-col p-6 md:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          What would you like to do today?
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <div className="group h-full cursor-pointer rounded-xl border border-border p-5 transition-all hover:border-primary/30 hover:bg-muted/50">
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${action.bg}`}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                {action.title}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Premium upsell */}
      {profile && !profile.isPremium && (
        <Link href="/chat/premium">
          <div className="cursor-pointer rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-5 transition-all hover:from-amber-500/10 hover:to-orange-500/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Upgrade to Premium</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Unlock gender-preference matching (Male-Female,
                  Female-Female) and more
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
