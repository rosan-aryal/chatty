"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Hash, Lock, Users } from "lucide-react";
import Link from "next/link";
import { usePublicGroups, useMyGroups, useJoinGroup, useJoinByCode } from "@/hooks/use-groups";
import { useCreateGroup } from "@/hooks/use-create-group";

export default function GroupsPage() {
  const [tab, setTab] = useState<"public" | "mine">("public");
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"public" | "private">("public");
  const [newMaxMembers, setNewMaxMembers] = useState(50);

  const { data: publicGroups = [] } = usePublicGroups(tab === "public");
  const { data: myGroups = [] } = useMyGroups(tab === "mine");
  const joinPublic = useJoinGroup();
  const joinByCode = useJoinByCode();
  const { createGroup, isPending, createdGroup } = useCreateGroup();
  const router = useRouter();

  useEffect(() => {
    if (createdGroup) {
      router.push(`/chat/groups/${createdGroup.id}` as any);
    }
  }, [createdGroup, router]);

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
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create Group
          </Button>
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
              href={`/chat/groups/${gm.group?.id || gm.groupId}` as any}
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
                onClick={() => {
                  joinByCode.mutate(joinCode, {
                    onSuccess: () => {
                      setShowJoinCode(false);
                      setJoinCode("");
                    },
                  });
                }}
                disabled={!joinCode.trim()}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Create a Group</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My awesome group"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2">
                {(["public", "private"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium capitalize transition-all ${
                      newType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Members</label>
              <input
                type="number"
                value={newMaxMembers}
                onChange={(e) => setNewMaxMembers(Number(e.target.value))}
                min={2}
                max={500}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createGroup({ name: newName, type: newType, maxMembers: newMaxMembers })}
                disabled={isPending || !newName.trim()}
              >
                {isPending ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
