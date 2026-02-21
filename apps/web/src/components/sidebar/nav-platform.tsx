"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Settings } from "lucide-react";

export function NavPlatform() {
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
            <span>Chat Anonymously</span>
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
        <SidebarMenuItem>
          <SidebarMenuButton
            variant={"outline"}
            render={<a href={"/chat/settings"} />}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
