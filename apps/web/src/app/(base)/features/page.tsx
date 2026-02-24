import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  Shuffle,
  Heart,
  Globe,
  Users,
  UserPlus,
  Zap,
  Shield,
  ArrowRight,
  Crown,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features - Anonymous Chat, Group Rooms & More",
  description:
    "Explore Chatty's features: anonymous chat with strangers, random matching, gender preferences, country-based connections, group chat rooms, friend system, and real-time messaging.",
};

const features = [
  {
    icon: MessageCircle,
    title: "Anonymous Chat",
    description:
      "Chat with strangers without revealing your identity. Chatty gives you full control over your anonymity, letting you toggle anonymous mode on or off at any time during a conversation. Start chatting instantly with no registration required — just jump in and connect with someone new. Whether you want to vent, share stories, or simply have a casual anonymous chat, our platform makes anonymous messaging effortless. Every conversation begins on equal footing, free from the biases of profiles and photos. Enjoy the freedom of chatting anonymously while knowing you can reveal yourself whenever you feel comfortable.",
    bullets: [
      "Toggle anonymity on or off mid-conversation",
      "No sign-up required to start your first anonymous chat",
      "Your identity stays hidden until you choose otherwise",
      "Bias-free conversations without profile photos or real names",
    ],
  },
  {
    icon: Shuffle,
    title: "Random Matching",
    description:
      "Get instantly paired with someone new from around the world. Our intelligent matchmaking system connects you with random strangers for spontaneous, unscripted conversations that can lead anywhere. Every click of the match button opens the door to a completely new interaction — chat with strangers you would never meet in your daily life. The random chat experience is designed to be fast and seamless, pairing you within seconds so there is no waiting around. Whether you are looking for deep discussions or light-hearted banter, random matching delivers fresh perspectives and unexpected connections every single time.",
    bullets: [
      "Instant pairing with strangers worldwide in seconds",
      "Smart matchmaking algorithm for better connections",
      "Skip and rematch anytime with one click",
      "Every conversation is a fresh, unique experience",
    ],
  },
  {
    icon: Heart,
    title: "Gender Preference Matching",
    description:
      "Choose exactly who you want to connect with using gender preference matching. Premium users unlock the ability to filter matches by gender, including female-to-female, female-to-male, and male-to-female chat preferences. Male-to-male matching is completely free for everyone, ensuring inclusive access for all users. Gender matching puts you in control of your chat experience, letting you find conversations that feel more comfortable and relevant to you. Whether you are looking for same-gender friendships or cross-gender conversations, our preference system ensures you connect with the right people every time.",
    bullets: [
      "M\u2192M gender matching free for all users",
      "Premium unlocks F\u2192F, F\u2192M, and M\u2192F preferences",
      "Filter matches to find more relevant conversations",
      "Full control over who you get paired with",
    ],
  },
  {
    icon: Globe,
    title: "Country-Based Matching",
    description:
      "Find people from your own region or explore international chat with users from over 150 countries. Country-based matching lets you narrow your search to local conversations or broaden it to a truly global experience. Connect with people who share your language, culture, and timezone, or step outside your comfort zone and discover how people live on the other side of the world. Our country matching feature is perfect for language practice, cultural exchange, or simply finding someone nearby to chat with. The world is at your fingertips — choose your preferred region and start connecting.",
    bullets: [
      "Match with users from 150+ countries worldwide",
      "Filter by your own country for local connections",
      "Perfect for language practice and cultural exchange",
      "Explore global perspectives or stay close to home",
    ],
  },
  {
    icon: Users,
    title: "Group Chat Rooms",
    description:
      "Create or join public and private group chat rooms to connect with multiple people at once. Set up your own online chat room with custom names, descriptions, and maximum member limits. Use invite codes to bring friends into private groups, or browse public rooms to find communities that match your interests. Group admins get powerful management tools including the ability to kick or ban disruptive members, keeping conversations safe and enjoyable. Whether you want a small private hangout or a large open chat community, our group chat rooms give you everything you need to build and manage thriving conversations.",
    bullets: [
      "Create public or private rooms with invite codes",
      "Set custom member limits and room descriptions",
      "Admin tools for kick, ban, and member management",
      "Browse and join active chat communities",
    ],
  },
  {
    icon: UserPlus,
    title: "Friend System",
    description:
      "Turn great conversations into lasting connections with our built-in friend system. When you meet someone you click with, send them a friend request to make sure you can find them again. Build your personal contact list of online friends and message them directly anytime, without relying on random matching to reconnect. The friend system makes it easy to make friends online and maintain those relationships over time. Accept or decline incoming requests, manage your friends list, and enjoy the convenience of always having your favorite chat partners just one click away.",
    bullets: [
      "Send and receive friend requests during chats",
      "Build a personal contact list of online friends",
      "Direct message friends anytime without matchmaking",
      "Manage your friends list with easy accept and decline controls",
    ],
  },
  {
    icon: Zap,
    title: "Real-Time Messaging",
    description:
      "Experience lightning-fast communication powered by WebSocket technology for instant message delivery with zero perceptible delay. Our real-time chat infrastructure ensures your messages arrive the moment you send them, creating fluid, natural conversations that feel like talking face to face. See live typing indicators so you know when someone is crafting a response, check online status to know who is available, and enjoy a seamless instant messaging experience across all your devices. Real-time messaging on Chatty is built for speed, reliability, and the kind of responsive live chat experience modern users expect.",
    bullets: [
      "WebSocket-powered instant message delivery",
      "Live typing indicators and online status",
      "Zero-lag messaging for fluid conversations",
      "Reliable delivery across all devices and connections",
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description:
      "Your safety is our top priority. Chatty is built from the ground up with privacy and secure messaging in mind. Toggle anonymous mode to control exactly what others can see about you. Use our reporting and blocking tools to deal with unwanted interactions swiftly and effectively. Every conversation is protected, and you maintain full control over your personal information at all times. Our safe chat environment is moderated to prevent abuse, and our privacy controls give you the power to decide who sees your profile, who can message you, and how much of your identity you want to share.",
    bullets: [
      "Toggle anonymous mode for complete privacy control",
      "Report and block users with one click",
      "Profile visibility settings you control",
      "Actively moderated platform for a safe chat experience",
    ],
  },
] as const;

const premiumPerks = [
  "Gender preference matching (F\u2192F, F\u2192M, M\u2192F)",
  "Priority matching queue \u2014 get paired faster",
  "Exclusive premium badge on your profile",
  "Support continued development of Chatty",
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Everything You Need for{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Anonymous Chat
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Chatty is a full-featured anonymous chat platform where you can meet
          strangers, join group chat rooms, add friends, and build real
          connections. With random matching, gender preferences, country-based
          filters, and real-time messaging, every conversation is just a click
          away.
        </p>
        <div className="mt-8">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Chatting Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 space-y-16">
        {features.map((feature, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={feature.title}
              className={`flex flex-col gap-8 lg:flex-row lg:items-center ${
                isEven ? "" : "lg:flex-row-reverse"
              }`}
            >
              {/* Icon & Visual Block */}
              <div className="flex shrink-0 items-center justify-center lg:w-1/3">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/10 sm:h-40 sm:w-40">
                  <feature.icon className="h-16 w-16 text-primary sm:h-20 sm:w-20" />
                </div>
              </div>

              {/* Content Block */}
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {feature.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </section>

      {/* Premium Features Section */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-24">
          <div className="rounded-xl border-2 border-primary bg-card p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Premium Features
                </h2>
                <p className="text-sm text-muted-foreground">
                  Unlock the full Chatty experience for $4.99/month
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Upgrade to Chatty Premium and take your chat experience to the
              next level. Get access to advanced gender preference matching,
              skip the queue with priority matching, and stand out with an
              exclusive premium badge. Premium is designed for users who want
              more control over who they connect with and how fast they get
              matched.
            </p>
            <ul className="space-y-3 mb-8">
              {premiumPerks.map((perk) => (
                <li key={perk} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-medium">{perk}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Pricing Plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to Start Chatting?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Join thousands of users already connecting on Chatty. Anonymous,
          instant, and completely free to get started.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Chatting
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border px-8 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
