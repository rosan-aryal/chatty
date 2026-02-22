"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Check, X, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { usePendingRequests, useAcceptFriend, useRejectFriend } from "@/hooks/use-friends";

export function NavPendingRequests() {
  const { data: pendingRequests = [], isLoading } = usePendingRequests();
  const acceptMutation = useAcceptFriend();
  const rejectMutation = useRejectFriend();

  if (isLoading || pendingRequests.length === 0) return null;

  return (
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
  );
}
