import Link from "next/link";
import { MessageSquareOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <MessageSquareOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          This page doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/chat"
          className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Open Chat
        </Link>
      </div>
    </div>
  );
}
