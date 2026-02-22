import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";
import { authClient } from "@/lib/auth-client";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { gender: string; country: string }) => {
      const res = await fetch(`${API}/api/user/onboard`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });
}

export function useToggleVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean) => {
      const res = await fetch(`${API}/api/user/visibility`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnonymous: value }),
      });
      if (!res.ok) throw new Error("Failed to toggle visibility");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update visibility"),
  });
}

export function useBillingPortal() {
  return async () => {
    try {
      const result = await (authClient as any).subscription.billingPortal({
        returnUrl: window.location.href,
      });
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      toast.error("Could not open billing portal");
    }
  };
}
