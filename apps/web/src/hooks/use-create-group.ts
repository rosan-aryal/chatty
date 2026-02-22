import { useState } from "react";
import { toast } from "sonner";
import type { Group } from "@/types/groups";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useCreateGroup() {
  const [isPending, setIsPending] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  const createGroup = async (data: {
    name: string;
    type: "public" | "private";
    maxMembers: number;
  }) => {
    if (!data.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const group = await res.json();
        setCreatedGroup(group);
        toast.success("Group created!");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to create group");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return { createGroup, isPending, createdGroup };
}
