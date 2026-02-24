"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useFriends } from "@/hooks/use-friends";
import { NavPendingRequests } from "./nav-pending-requests";

export function NavMain() {
  const { data: friends = [], isLoading: friendsLoading } = useFriends();

  const onlineFriends = friends.filter((f) => f.online);
  const offlineFriends = friends.filter((f) => !f.online);
  const sortedFriends = [...onlineFriends, ...offlineFriends];

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            Friends
            {onlineFriends.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {onlineFriends.length}
              </span>
            )}
          </span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 group-data-[collapsible=icon]:hidden">
            <span className="sr-only">Add Friend</span>
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        </SidebarGroupLabel>

        <SidebarMenu>
          {friendsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : sortedFriends.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              No friends yet. Start a chat to connect!
            </div>
          ) : (
            sortedFriends.map((friend) => (
              <SidebarMenuItem key={friend.friendshipId}>
                <SidebarMenuButton
                  tooltip={friend.name}
                  render={<a href={`/chat/friends/${friend.friendshipId}`} />}
                >
                  <div className="relative">
                    <Avatar size="sm">
                      {friend.image && (
                        <AvatarImage src={friend.image} alt={friend.name} />
                      )}
                      <AvatarFallback>
                        {friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar",
                        friend.online
                          ? "bg-green-500"
                          : "bg-muted-foreground/30",
                      )}
                    />
                  </div>
                  <span className="truncate">{friend.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroup>

      <NavPendingRequests />
    </>
  );
}
