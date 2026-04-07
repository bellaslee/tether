import type { ContactMethodType, PersonStatus } from "@/lib/db/database.types";

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

export function formatStatus(status: PersonStatus) {
  return statusLabels[status];
}

export function formatContactType(type: ContactMethodType) {
  return contactTypeLabels[type];
}

export function formatInteractionTypeName(name: string) {
  return name;
}
