import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  Shield,
  Users,
  Zap,
  Globe,
  Lock,
  UserPlus,
  Heart,
  Languages,
  ArrowRight,
  Star,
  Sparkles,
  MousePointerClick,
  Shuffle,
  MessagesSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chatty - Free Anonymous Chat Platform | Meet New People Online",
  description:
    "Start chatting with strangers instantly on Chatty. Anonymous chat rooms, random matching, group chats, and friend system. No sign-up needed to start. Meet new people online for free.",
};

const features = [
  {
    icon: MessageCircle,
    title: "Anonymous Chat",
    description:
      "Connect with random people instantly through our anonymous chat platform. No sign-up is needed to start a conversation — just click and chat with strangers from around the world. Your identity stays hidden until you decide otherwise, making every random chat online feel safe and spontaneous.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Stay anonymous or reveal your identity on your own terms. Chatty puts you in full control of your personal information with anonymous messaging features built into every conversation. Chat without registration pressure and share only what you are comfortable with.",
  },
  {
    icon: Users,
    title: "Group Chat Rooms",
    description:
      "Create or join public and private online chat rooms with like-minded people. Our group chat platform supports real-time conversations for communities, study groups, gaming squads, and more. Build lasting connections beyond one-on-one random chats.",
  },
  {
    icon: Globe,
    title: "Country Matching",
    description:
      "Match with people from your country or explore conversations with strangers worldwide. Our random chat online system lets you filter by region so you can meet new people who share your culture, timezone, or language — or broaden your horizons globally.",
  },
  {
    icon: Zap,
    title: "Gender Preferences",
    description:
      "Choose who you match with using our smart preference system. Free users enjoy same-gender matching, while premium members unlock full gender preference controls. Chat with strangers the way you want, with the matching that matters to you.",
  },
  {
    icon: Lock,
    title: "Secure & Fast",
    description:
      "Experience real-time WebSocket messaging with end-to-end reliability. Every anonymous chat session is delivered instantly with no lag, no dropped messages, and no compromises on speed. Our free chat infrastructure keeps conversations flowing smoothly at all times.",
  },
];

const stats = [
  { value: "10,000+", label: "Conversations started" },
  { value: "150+", label: "Countries connected" },
  { value: "24/7", label: "Always online" },
  { value: "100%", label: "Free to start" },
];

const steps = [
  {
    number: "01",
    icon: MousePointerClick,
    title: "Sign Up (or Skip)",
    description:
      "Create a free account in seconds, or skip registration entirely and start chatting anonymously right away. No email required, no forms to fill — just jump straight into a random chat online.",
  },
  {
    number: "02",
    icon: Shuffle,
    title: "Get Matched",
    description:
      "Our matching system pairs you with a stranger instantly. Match randomly, filter by gender preference, or connect with people from specific countries. You are always one click away from meeting someone new.",
  },
  {
    number: "03",
    icon: MessagesSquare,
    title: "Start Chatting",
    description:
      "Chat in real time with lightning-fast WebSocket messaging. Add people you connect with as friends, or create and join group chat rooms to build your own community.",
  },
];

const useCases = [
  {
    icon: Globe,
    title: "Making International Friends",
    description:
      "Connect with people from over 150 countries and make friends online across borders. Chatty breaks down geographic barriers so you can build genuine friendships with strangers who share your interests, no matter where they live.",
  },
  {
    icon: Languages,
    title: "Practicing Languages",
    description:
      "Looking for a conversation partner to practice a new language? Our random chat matching connects you with native speakers worldwide. It is the most natural way to improve fluency — real conversations with real people, not textbook exercises.",
  },
  {
    icon: Users,
    title: "Finding Communities",
    description:
      "Join group chat rooms built around topics you care about. Whether it is gaming, music, tech, or anything in between, our group chat platform helps you discover communities where you belong and make friends who get you.",
  },
  {
    icon: Heart,
    title: "Anonymous Venting & Support",
    description:
      "Sometimes you just need someone to listen. Chatty provides a safe space for anonymous messaging where you can share what is on your mind without judgment. Connect with empathetic strangers who are here to support you.",
  },
];

const differentiators = [
  {
    icon: MousePointerClick,
    title: "No Downloads Required",
    description:
      "Chatty runs entirely in your browser. No app to install, no storage to sacrifice. Open the site and start your random chat online in seconds from any device.",
  },
  {
    icon: Shield,
    title: "Truly Anonymous",
    description:
      "We do not require personal information to start chatting. Your anonymous chat sessions are private by default, and you control what you share and when.",
  },
  {
    icon: Sparkles,
    title: "Free to Start, Premium for More",
    description:
      "Every core feature is available on our free chat plan — random matching, group chats, friend system, and more. Upgrade to premium only if you want advanced gender matching and priority queues.",
  },
  {
    icon: Zap,
    title: "Real-Time WebSocket Messaging",
    description:
      "Messages arrive instantly. Our WebSocket infrastructure ensures zero-lag conversations so your chat with strangers feels as natural as talking face to face.",
  },
  {
    icon: Globe,
    title: "Gender & Country Matching",
    description:
      "Go beyond random. Filter your matches by country to meet new people in specific regions, or use gender preferences to chat with strangers the way you want.",
  },
];

const testimonials = [
  {
    quote:
      "I moved to a new country and did not know anyone. Chatty helped me meet new people and make friends online who actually live nearby. The anonymous chat feature let me be myself without pressure.",
    name: "Alex K.",
    detail: "Expat in Germany",
    rating: 5,
  },
  {
    quote:
      "I use Chatty to practice my Japanese with native speakers. The random chat matching is addictive — every conversation is different and I have improved more in three months than a year of textbook study.",
    name: "Maria S.",
    detail: "Language learner",
    rating: 5,
  },
  {
    quote:
      "The group chat rooms are what keep me coming back. I found a gaming community on Chatty that feels like home. No sign-up hassle, no ads — just good conversations with people who share my interests.",
    name: "Jordan T.",
    detail: "Community member",
    rating: 5,
  },
];

const faqs = [
  {
    question: "What is anonymous chatting?",
    answer:
      "Anonymous chatting means you can have real-time conversations with other people without revealing your personal identity. On Chatty, you do not need to provide your real name, email, or any personal details to start an anonymous chat. You are assigned a random display identity and can share as much or as little about yourself as you choose during the conversation.",
  },
  {
    question: "Is Chatty free to use?",
    answer:
      "Yes, Chatty is a free chat platform. You can start random chats, join group chat rooms, add friends, and send messages without paying anything. We offer an optional premium plan ($4.99/month) that unlocks advanced features like cross-gender matching preferences and priority queue placement, but all core features of the anonymous chat experience are completely free.",
  },
  {
    question: "How does random chat matching work?",
    answer:
      "When you click 'Start Chatting,' our matching algorithm instantly pairs you with another user who is also looking for a random chat online. The match is made in real time using our WebSocket infrastructure. You can set preferences for country or gender (some gender options require premium) to influence who you are matched with, or leave it fully random to meet new people from anywhere in the world.",
  },
  {
    question: "Can I choose who I chat with?",
    answer:
      "Chatty offers several ways to influence your matches. Free users can filter by country and use same-gender matching. Premium users unlock full gender preference controls, letting you choose exactly who you want to chat with strangers of any demographic. You can also add people as friends after a conversation to chat with them again directly.",
  },
  {
    question: "Is it safe to chat with strangers online?",
    answer:
      "Safety is a top priority at Chatty. Our anonymous messaging system means you do not have to share personal information. You can report or block users at any time, and our moderation tools help keep conversations respectful. We recommend never sharing private details like your address, phone number, or financial information in any online chat rooms.",
  },
  {
    question: "What are group chat rooms?",
    answer:
      "Group chat rooms on Chatty are shared conversation spaces where multiple people can talk at the same time. You can create your own group chat room (public or private), invite friends, or browse and join existing communities. It is a great way to meet new people who share your interests through our group chat platform, beyond just one-on-one random chats.",
  },
  {
    question: "Do I need to create an account to start chatting?",
    answer:
      "No. Chatty lets you chat without registration — you can jump into an anonymous chat session immediately as a guest. However, creating a free account gives you access to features like adding friends, managing your chat history, and joining group chat rooms. Account creation is quick and does not require personal information.",
  },
  {
    question: "What is premium and what do I get?",
    answer:
      "Chatty Premium is our optional paid plan at $4.99 per month. It unlocks advanced gender matching preferences (including cross-gender matching like male-to-female and female-to-male), priority placement in the matching queue so you get connected faster, and custom profile themes. All core features of the free chat experience remain available on the free plan.",
  },
  {
    question: "How do I add friends on Chatty?",
    answer:
      "After a conversation with someone you connect with, you can send them a friend request directly from the chat. Once they accept, you can message each other anytime through direct messages without going through random matching again. It is the easiest way to make friends online and keep the conversations going.",
  },
  {
    question: "Can I use Chatty on my phone?",
    answer:
      "Absolutely. Chatty is fully responsive and works in any modern mobile browser — no app download needed. Whether you are on iOS, Android, a tablet, or a desktop computer, you get the same full-featured anonymous chat experience. Just open Chatty in your browser and start chatting with strangers from anywhere.",
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
          Meet new people through anonymous chat — instantly. Get matched with
          strangers randomly, join online chat rooms, build group conversations,
          and make friends online. No downloads, no hassle, completely free to
          start.
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

      {/* Stats Bar */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start a random chat online in three simple steps. No registration
            required.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-xl border p-6 space-y-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold text-primary/60">
                  Step {step.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 border-y">
        <div className="mx-auto max-w-5xl px-4 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to connect
            </h2>
            <p className="mt-3 text-muted-foreground">
              A full-featured anonymous chat platform built for meaningful
              conversations with strangers and friends alike.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-background p-6 space-y-3 hover:bg-muted/50 transition-colors"
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
        </div>
      </section>

      {/* Use Cases */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">
            Why People Love Chatty
          </h2>
          <p className="mt-3 text-muted-foreground">
            From making international friends to finding support, here is how
            people use our free chat platform every day.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="rounded-xl border p-6 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <useCase.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{useCase.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="bg-muted/30 border-y">
        <div className="mx-auto max-w-5xl px-4 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">
              What Makes Chatty Different
            </h2>
            <p className="mt-3 text-muted-foreground">
              Not all chat platforms are created equal. Here is why thousands
              choose Chatty for their random chat online experience.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl border bg-background p-5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">
            What Our Users Say
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real stories from people who use Chatty to meet new people and make
            friends online.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-xl border p-6 space-y-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="border-t pt-4">
                <div className="text-sm font-semibold">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">
                  {testimonial.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 border-y">
        <div className="mx-auto max-w-3xl px-4 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about anonymous chatting on Chatty.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border bg-background"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-muted/50 rounded-xl transition-colors [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="rounded-2xl border bg-muted/30 px-6 py-14 sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Meet New People?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of users who chat with strangers every day on Chatty.
            Start an anonymous chat right now — it is free, instant, and no
            sign-up is required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Chatting Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border px-8 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              Create Free Account
              <UserPlus className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required. Free forever for core features.
          </p>
        </div>
      </section>
    </div>
  );
}
