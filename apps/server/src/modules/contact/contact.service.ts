import type { ContactRepository } from "./contact.repository";

export class ContactService {
  constructor(private contactRepo: ContactRepository) {}

  async list() {
    return this.contactRepo.findAll();
  }

  async submit(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.contactRepo.create(data);
  }

  async markAsRead(id: string) {
    return this.contactRepo.markAsRead(id);
  }

  async delete(id: string) {
    return this.contactRepo.delete(id);
  }
}
