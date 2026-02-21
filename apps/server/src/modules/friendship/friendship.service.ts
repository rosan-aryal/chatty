import type { FriendshipRepository } from "./friendship.repository";
import type { NotificationService } from "../notification/notification.service";

export class FriendshipService {
  constructor(
    private friendshipRepo: FriendshipRepository,
    private notificationService: NotificationService
  ) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) throw new Error("Cannot send friend request to yourself");
    const existing = await this.friendshipRepo.findByUsers(requesterId, addresseeId);
    if (existing) throw new Error("Friend request already exists");
    const [created] = await this.friendshipRepo.create(requesterId, addresseeId);
    await this.notificationService.create({
      userId: addresseeId,
      type: "friend_request",
      data: { friendshipId: created.id, fromUserId: requesterId },
    });
    return created;
  }

  async acceptRequest(friendshipId: string, userId: string) {
    const request = await this.friendshipRepo.findById(friendshipId);
    if (!request || request.addresseeId !== userId) throw new Error("Friend request not found");
    if (request.status !== "pending") throw new Error("Friend request is not pending");
    const [updated] = await this.friendshipRepo.updateStatus(friendshipId, "accepted");
    await this.notificationService.create({
      userId: request.requesterId,
      type: "friend_accepted",
      data: { friendshipId, fromUserId: userId },
    });
    return updated;
  }

  async rejectRequest(friendshipId: string, userId: string) {
    const request = await this.friendshipRepo.findById(friendshipId);
    if (!request || request.addresseeId !== userId) throw new Error("Friend request not found");
    return this.friendshipRepo.updateStatus(friendshipId, "rejected");
  }

  async removeFriend(friendshipId: string, userId: string) {
    const request = await this.friendshipRepo.findById(friendshipId);
    if (!request) throw new Error("Friendship not found");
    if (request.requesterId !== userId && request.addresseeId !== userId) throw new Error("Not authorized");
    return this.friendshipRepo.delete(friendshipId);
  }

  async listFriends(userId: string) {
    return this.friendshipRepo.listFriends(userId);
  }

  async listPendingRequests(userId: string) {
    return this.friendshipRepo.listPendingReceived(userId);
  }
}
