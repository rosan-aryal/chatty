import type { SupportRepository } from "./support.repository";

export class SupportService {
  constructor(private repo: SupportRepository) {}

  async submitTicket(data: { name: string; email: string; subject: string; message: string }) {
    return this.repo.createTicket(data);
  }

  async submitFeedback(data: { name: string; email: string; rating: number; message: string }) {
    return this.repo.createFeedback(data);
  }
}
