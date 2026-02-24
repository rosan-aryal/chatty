import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Group } from "@/types/groups";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useCreateGroup() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: "public" | "private";
      maxMembers: number;
    }): Promise<Group> => {
      if (!data.name.trim()) {
        throw new Error("Group name is required");
      }
      const res = await fetch(`${API}/api/groups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create group");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Group created!");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Something went wrong");
    },
  });
}
