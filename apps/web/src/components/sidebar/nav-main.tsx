"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { UserPlus, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { env } from "@chat-application/env/web";
import { toast } from "sonner";

const API = env.NEXT_PUBLIC_SERVER_URL;

interface Friend {
  id: string;
  friendshipId: string;
  name: string;
  image?: string;
  online?: boolean;
}

interface PendingRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

export function NavMain() {
  const queryClient = useQueryClient();

  // Fetch accepted friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/friends`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch pending friend requests
  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery<
    PendingRequest[]
  >({
    queryKey: ["friends", "pending"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/friends/pending`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Accept friend request
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`${API}/api/friends/${requestId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to accept request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: () => {
      toast.error("Failed to accept friend request");
    },
  });

  // Reject friend request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`${API}/api/friends/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request rejected");
    },
    onError: () => {
      toast.error("Failed to reject friend request");
    },
  });

  const onlineFriends = friends.filter((f) => f.online);
  const offlineFriends = friends.filter((f) => !f.online);
  const sortedFriends = [...onlineFriends, ...offlineFriends];

  return (
    <>
      {/* Friends list */}
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
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
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
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No friends yet. Start a chat to connect!
            </div>
          ) : (
            sortedFriends.map((friend) => (
              <SidebarMenuItem key={friend.friendshipId}>
                <SidebarMenuButton
                  tooltip={friend.name}
                  render={
                    <a href={`/chat/friends/${friend.friendshipId}`} />
                  }
                >
                  <div className="relative">
                    <Avatar size="sm">
                      {friend.image && (
                        <AvatarImage
                          src={friend.image}
                          alt={friend.name}
                        />
                      )}
                      <AvatarFallback>
                        {friend.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
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

      {/* Pending requests */}
      {!pendingLoading && pendingRequests.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Pending Requests
            </span>
            <SidebarMenuBadge className="static">
              {pendingRequests.length}
            </SidebarMenuBadge>
          </SidebarGroupLabel>

          <SidebarMenu>
            {pendingRequests.map((req) => (
              <SidebarMenuItem key={req.id}>
                <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5">
                  <Avatar size="sm">
                    {req.requester.image && (
                      <AvatarImage
                        src={req.requester.image}
                        alt={req.requester.name}
                      />
                    )}
                    <AvatarFallback>
                      {req.requester.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span className="min-w-0 flex-1 truncate text-sm">
                    {req.requester.name}
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-green-600 hover:bg-green-500/10 hover:text-green-600"
                      onClick={() => acceptMutation.mutate(req.id)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="sr-only">Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => rejectMutation.mutate(req.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </div>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
}
