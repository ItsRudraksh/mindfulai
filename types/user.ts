// User interface for NextAuth session
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string;
  providerId?: string;
}
