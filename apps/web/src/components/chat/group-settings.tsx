"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User, Shield, Crown, UserX, Ban, RefreshCw, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useRouter } from "next/navigation";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

interface GroupSettingsProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function GroupSettings({ groupId, open, onClose }: GroupSettingsProps) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"members" | "banned">("members");

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/${groupId}`, { credentials: "include" });
      return res.json();
    },
    enabled: open,
  });

  const { data: bans = [] } = useQuery({
    queryKey: ["group-bans", groupId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/${groupId}/bans`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && tab === "banned",
  });

  const currentMember = group?.members?.find((m: any) => m.userId === profile?.id);
  const isHostOrAdmin = currentMember?.role === "host" || currentMember?.role === "admin";
  const isHost = currentMember?.role === "host";

  const kickMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API}/api/groups/${groupId}/kick`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group", groupId] }),
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API}/api/groups/${groupId}/ban`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-bans", groupId] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API}/api/groups/${groupId}/unban`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-bans", groupId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/groups/${groupId}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      onClose();
      router.push("/chat/groups");
    },
  });

  const regenCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/groups/${groupId}/regenerate-code`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group", groupId] }),
  });

  if (!open) return null;

  const roleIcon = (role: string) => {
    if (role === "host") return <Crown className="h-3 w-3 text-yellow-500" />;
    if (role === "admin") return <Shield className="h-3 w-3 text-blue-500" />;
    return null;
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      host: "bg-yellow-500/10 text-yellow-500",
      admin: "bg-blue-500/10 text-blue-500",
      member: "bg-muted text-muted-foreground",
    };
    return (
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[role] || colors.member}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-md border-l bg-background shadow-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Group Settings</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Group Info */}
        <div className="border-b px-4 py-3 space-y-2">
          <h4 className="font-medium">{group?.name}</h4>
          <p className="text-xs text-muted-foreground">
            {group?.type === "private" ? "Private" : "Public"} group · {group?.members?.length || 0}/{group?.maxMembers} members
          </p>
          {group?.type === "private" && group?.inviteCode && isHost && (
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-xs">{group.inviteCode}</code>
              <button
                onClick={() => regenCodeMutation.mutate()}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Regenerate code"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setTab("members")}
            className={`flex-1 py-2 text-xs font-medium ${tab === "members" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            Members
          </button>
          {isHostOrAdmin && (
            <button
              onClick={() => setTab("banned")}
              className={`flex-1 py-2 text-xs font-medium ${tab === "banned" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            >
              Banned
            </button>
          )}
        </div>

        {/* Members Tab */}
        {tab === "members" && (
          <div className="divide-y">
            {group?.members?.map((member: any) => (
              <div key={member.userId} className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {member.user?.image ? (
                    <img src={member.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : member.user?.isAnonymous ? (
                    <User className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <span className="text-xs font-medium">
                      {(member.user?.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {roleIcon(member.role)}
                    <span className="truncate text-sm">
                      {member.userId === profile?.id ? "You" : (member.user?.name || "Unknown")}
                    </span>
                    {roleBadge(member.role)}
                  </div>
                </div>
                {isHostOrAdmin && member.role !== "host" && member.userId !== profile?.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => kickMutation.mutate(member.userId)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-orange-500"
                      title="Kick"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => banMutation.mutate(member.userId)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-500"
                      title="Ban"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banned Tab */}
        {tab === "banned" && (
          <div className="divide-y">
            {bans.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No banned users</p>
            )}
            {bans.map((ban: any) => (
              <div key={ban.userId} className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {ban.user?.image ? (
                    <img src={ban.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="truncate text-sm">{ban.user?.name || "Unknown"}</span>
                </div>
                <button
                  onClick={() => unbanMutation.mutate(ban.userId)}
                  className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Unban
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Danger Zone */}
        {isHost && (
          <div className="border-t px-4 py-4">
            <h4 className="mb-2 text-xs font-medium text-red-500">Danger Zone</h4>
            <button
              onClick={() => {
                if (confirm("Delete this group permanently?")) {
                  deleteMutation.mutate();
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
