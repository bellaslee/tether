import type {
  ContactMethodType,
  InteractionType,
  PersonCategory,
  PersonStatus,
} from "@/lib/db/database.types";

const categoryLabels: Record<PersonCategory, string> = {
  friend: "Friend",
  close_friend: "Close friend",
  acquaintance: "Acquaintance",
  networking: "Networking",
  mentor: "Mentor",
  family: "Family",
};

const statusLabels: Record<PersonStatus, string> = {
  active: "Active",
  dormant: "Dormant",
  archived: "Archived",
};

const contactTypeLabels: Record<ContactMethodType, string> = {
  phone: "Phone",
  email: "Email",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  discord: "Discord",
  address: "Address",
  other: "Other",
};

const interactionTypeLabels: Record<InteractionType, string> = {
  hangout: "Hangout",
  text: "Text",
  call: "Call",
  dinner: "Dinner",
  party: "Party",
  coffee_chat: "Coffee chat",
  meeting: "Meeting",
  other: "Other",
};

export function formatCategory(category: PersonCategory) {
  return categoryLabels[category];
}

export function formatStatus(status: PersonStatus) {
  return statusLabels[status];
}

export function formatContactType(type: ContactMethodType) {
  return contactTypeLabels[type];
}

export function formatInteractionType(type: InteractionType) {
  return interactionTypeLabels[type];
}
