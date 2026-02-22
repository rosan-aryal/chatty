"use client";

import {
  useFriends,
  usePendingRequests,
  useAcceptFriend,
  useRejectFriend,
} from "@/hooks/use-friends";
import { MessageCircle, UserPlus, Check, X, User } from "lucide-react";
import Link from "next/link";

export default function FriendsPage() {
  const { data: friends = [], isLoading } = useFriends();
  const { data: pending = [] } = usePendingRequests();
  const acceptMutation = useAcceptFriend();
  const rejectMutation = useRejectFriend();

  return (
    <div className="mx-auto w-full max-w-2xl py-6 space-y-6">
      <h2 className="text-lg font-semibold">Friends</h2>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            Pending Requests ({pending.length})
          </h3>
          <div className="divide-y rounded-xl border">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {req.requester.image ? (
                    <img
                      src={req.requester.image}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {req.requester.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {req.requester.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent you a friend request
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => acceptMutation.mutate(req.id)}
                    className="rounded-lg p-2 text-green-500 hover:bg-green-500/10"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          All Friends ({friends.length})
        </h3>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <User className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No friends yet. Start chatting to make some!
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/chat/friends/${friend.friendshipId}` as any}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {friend.image ? (
                      <img
                        src={friend.image}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {friend.online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {friend.online ? "Online" : "Offline"}
                  </p>
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
