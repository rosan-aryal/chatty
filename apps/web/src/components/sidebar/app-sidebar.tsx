"use client";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { SupportDialog } from "@/components/sidebar/support-dialog";
import { FeedbackDialog } from "@/components/sidebar/feedback-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavPlatform } from "./nav-platform";
import { useProfile } from "@/hooks/use-profile";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useProfile();

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      {...props}
      suppressHydrationWarning
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/chat" />}>
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary via-secondary to-primary/55 shadow-lg">
                  C
                </div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Chatty</span>
                <span className="truncate text-xs">Anonymous Chatting</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavPlatform isPremium={profile?.isPremium ?? false} />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SupportDialog />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <FeedbackDialog />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: profile?.name ?? "",
            email: profile?.email ?? "",
            avatar: profile?.image ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
