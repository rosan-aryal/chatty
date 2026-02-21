"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Hash, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";
import Link from "next/link";

const API = env.NEXT_PUBLIC_SERVER_URL;

export default function GroupsPage() {
  const [tab, setTab] = useState<"public" | "mine">("public");
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const queryClient = useQueryClient();

  const { data: publicGroups = [] } = useQuery({
    queryKey: ["groups", "public"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/public`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: tab === "public",
  });

  const { data: myGroups = [] } = useQuery({
    queryKey: ["groups", "mine"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/mine`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: tab === "mine",
  });

  const joinPublic = useMutation({
    mutationFn: async (groupId: string) => {
      const res = await fetch(`${API}/api/groups/${groupId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Joined group!");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinByCode = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`${API}/api/groups/join-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Joined group!");
      setShowJoinCode(false);
      setJoinCode("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Groups</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJoinCode(true)}
            className="gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            Join by Code
          </Button>
          <Link href="/chat/groups/create">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create Group
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-muted p-1">
        {(["public", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "public" ? "Public Groups" : "My Groups"}
          </button>
        ))}
      </div>

      {/* Group cards */}
      <div className="grid gap-3">
        {tab === "public" &&
          publicGroups.map((g: any) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{g.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    by {g.host?.name || "Unknown"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => joinPublic.mutate(g.id)}
              >
                Join
              </Button>
            </div>
          ))}

        {tab === "mine" &&
          myGroups.map((gm: any) => (
            <Link
              key={gm.group?.id || gm.groupId}
              href={`/chat/groups/${gm.group?.id || gm.groupId}`}
            >
              <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {gm.group?.type === "private" ? (
                    <Lock className="h-5 w-5 text-primary" />
                  ) : (
                    <Hash className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium">
                    {gm.group?.name || "Group"}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {gm.role} &middot; {gm.group?.type}
                  </p>
                </div>
              </div>
            </Link>
          ))}

        {((tab === "public" && publicGroups.length === 0) ||
          (tab === "mine" && myGroups.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {tab === "public"
                ? "No public groups yet"
                : "You haven't joined any groups"}
            </p>
          </div>
        )}
      </div>

      {/* Join by code modal */}
      {showJoinCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowJoinCode(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold">Join by Invite Code</h3>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter invite code"
              className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinCode(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => joinByCode.mutate(joinCode)}
                disabled={!joinCode.trim()}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
