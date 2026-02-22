import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Friend, PendingRequest } from "@/types/friends";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useFriends() {
  return useQuery<Friend[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/friends`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function usePendingRequests() {
  return useQuery<PendingRequest[]>({
    queryKey: ["friends", "pending"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/friends/pending`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useAcceptFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`${API}/api/friends/${requestId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to accept request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: () => {
      toast.error("Failed to accept friend request");
    },
  });
}

export function useRejectFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`${API}/api/friends/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request rejected");
    },
    onError: () => {
      toast.error("Failed to reject friend request");
    },
  });
}
