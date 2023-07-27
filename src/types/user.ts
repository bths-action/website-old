import { User } from "@prisma/client";

export interface UserPOSTBody {
  name: string;
  pronouns: string;
  gradYear: number;
  osis: string;
  preferredName?: string;
  prefect: string;
  birthday: string;
  referredBy?: string;
}

type UserPatchBody = Partial<UserPOSTBody>;

export interface UserFull extends User {
  referrals: string[];
}