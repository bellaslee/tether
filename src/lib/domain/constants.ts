import type {
  ContactMethodType,
  InteractionDirection,
  PersonStatus,
} from "@/lib/db/database.types";

export const PERSON_STATUSES: PersonStatus[] = ["active", "dormant", "archived"];

export const CONTACT_METHOD_TYPES: ContactMethodType[] = [
  "phone",
  "email",
  "instagram",
  "linkedin",
  "discord",
  "address",
  "other",
];

export const INTERACTION_DIRECTIONS: InteractionDirection[] = ["inbound", "outbound", "mutual"];
