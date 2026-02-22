"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Crown } from "lucide-react";
import { useRouter } from "next/navigation";

export function NavPlatform({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="space-y-3">
        <SidebarMenuItem>
          <SidebarMenuButton
            className="border-primary border"
            variant={"outline"}
            render={<a href={"/chat/anonymously"} />}
          >
            <span>Random Chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="border-primary border"
            variant={"outline"}
            onClick={() => {
              if (isPremium) {
                router.push("/chat/anonymously?genderPref=true" as any);
              } else {
                router.push("/pricing" as any);
              }
            }}
          >
            <Crown className="h-4 w-4" />
            <span>Gender Chat</span>
            {!isPremium && (
              <span className="ml-auto text-[10px] font-medium text-muted-foreground">PRO</span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="border-primary border"
            variant={"outline"}
            render={<a href={"/chat/groups"} />}
          >
            <span>Group Chats</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
