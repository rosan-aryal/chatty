import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useAddFriend() {
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const res = await fetch(`${API}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ addresseeId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send request");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Friend request sent!");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}
