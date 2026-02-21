"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";
import { Copy, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API = env.NEXT_PUBLIC_SERVER_URL;

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [maxMembers, setMaxMembers] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, maxMembers }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedGroup(data);
        toast.success("Group created!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create group");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Success state -- show invite code and link to group
  if (createdGroup) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">Group Created!</h2>
          <p className="text-sm text-muted-foreground">
            {createdGroup.name}
          </p>
        </div>

        {createdGroup.inviteCode && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3">
            <span className="font-mono text-sm font-semibold">
              {createdGroup.inviteCode}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdGroup.inviteCode);
                toast.success("Code copied!");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}

        <Button
          onClick={() => router.push(`/chat/groups/${createdGroup.id}`)}
        >
          Go to Group
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <Link
        href="/chat/groups"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Create a Group</h1>

      <div className="w-full max-w-md space-y-4">
        {/* Group Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My awesome group"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <div className="flex gap-2">
            {(["public", "private"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium capitalize transition-all ${
                  type === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Max Members */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Max Members</label>
          <input
            type="number"
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            min={2}
            max={500}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={submitting}
          className="w-full"
        >
          {submitting ? "Creating..." : "Create Group"}
        </Button>
      </div>
    </div>
  );
}
