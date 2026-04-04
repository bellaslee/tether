"use client";

import { useState } from "react";
import { ContactMethodAddForm } from "@/components/people/contact-method-add-form";

type ContactMethodAddDisclosureProps = {
  personId: string;
};

export function ContactMethodAddDisclosure({ personId }: ContactMethodAddDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border-soft bg-white/80 px-5 py-2.5 text-sm font-semibold transition hover:bg-white"
      >
        Add contact method
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <ContactMethodAddForm personId={personId} />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm font-semibold text-muted underline-offset-4 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
