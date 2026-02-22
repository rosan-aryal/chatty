export interface Friend {
  id: string;
  friendshipId: string;
  name: string;
  image?: string;
  online?: boolean;
}

export interface PendingRequest {
  id: string;
  requester: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

export interface FriendshipDetails {
  id: string;
  partner: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface FriendMessage {
  id: string;
  content: string;
  sender: { id: string; name: string; image?: string };
  createdAt: string;
}
