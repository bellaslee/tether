import type {
  ContactMethodType,
  InteractionDirection,
  InteractionType,
  PersonCategory,
  PersonStatus,
} from "@/lib/db/database.types";

export const PERSON_CATEGORIES: PersonCategory[] = [
  "friend",
  "close_friend",
  "acquaintance",
  "networking",
  "mentor",
  "family",
];

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

export const INTERACTION_TYPES: InteractionType[] = [
  "hangout",
  "text",
  "call",
  "dinner",
  "party",
  "coffee_chat",
  "meeting",
  "other",
];

export const INTERACTION_DIRECTIONS: InteractionDirection[] = ["inbound", "outbound", "mutual"];
