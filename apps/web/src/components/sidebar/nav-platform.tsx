"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Shuffle,
  Crown,
  Users,
  Venus,
  type LucideIcon,
  Mars,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function NavPlatform({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();

  const genderOptions = [
    { label: "F → F Matching", pref: "female", icon: Venus, free: false },
    { label: "F → M Matching", pref: "male", icon: Mars, free: false },
    { label: "M → F Matching", pref: "female", icon: Venus, free: false },
    { label: "M → M Matching", pref: "male", icon: Mars, free: true },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Random Chat"
            render={<a href={"/chat/anonymously"} />}
          >
            <Shuffle className="h-4 w-4" />
            <span>Random Chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {genderOptions.map((opt) => (
          <SidebarMenuItem key={opt.label}>
            <SidebarMenuButton
              tooltip={opt.label}
              onClick={() => {
                if (opt.free || isPremium) {
                  router.push(
                    `/chat/anonymously?genderPref=${opt.pref}` as any,
                  );
                } else {
                  router.push("/pricing" as any);
                }
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center text-[10px] font-bold leading-none">
                {typeof opt.icon === "string" ? (
                  opt.icon
                ) : (
                  <opt.icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span>{opt.label}</span>
              {!opt.free && !isPremium && (
                <Crown className="ml-auto h-3 w-3 text-muted-foreground" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Group Chats"
            render={<a href={"/chat/groups"} />}
          >
            <Users className="h-4 w-4" />
            <span>Group Chats</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
