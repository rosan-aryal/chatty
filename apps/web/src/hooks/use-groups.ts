import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Group, GroupMembership } from "@/types/groups";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function usePublicGroups(enabled: boolean) {
  return useQuery<Group[]>({
    queryKey: ["groups", "public"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/public`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled,
  });
}

export function useMyGroups(enabled: boolean) {
  return useQuery<GroupMembership[]>({
    queryKey: ["groups", "mine"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/groups/mine`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled,
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

export function useJoinByCode() {
  const queryClient = useQueryClient();

  return useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
