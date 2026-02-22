import { useQuery } from "@tanstack/react-query";
import type { UserProfile } from "@/types/user";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/profile`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });
}
