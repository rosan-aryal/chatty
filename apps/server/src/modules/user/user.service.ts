import type { UserRepository } from "./user.repository";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(userId: string) {
    return this.userRepo.findById(userId);
  }

  async onboard(userId: string, data: { gender: string; country: string }) {
    return this.userRepo.updateProfile(userId, {
      ...data,
      onboarded: true,
    });
  }

  async updateVisibility(userId: string, isAnonymous: boolean) {
    return this.userRepo.updateProfile(userId, { isAnonymous });
  }
}
