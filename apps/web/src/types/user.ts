export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  gender?: "male" | "female" | "other";
  country?: string;
  onboarded: boolean;
  isPremium: boolean;
  isAnonymous: boolean;
}
