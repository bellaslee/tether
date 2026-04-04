"use client";

import { useState } from "react";
import { ContactMethodAddForm } from "@/components/people/contact-method-add-form";
import { Button } from "@/components/ui/button";

type ContactMethodAddDisclosureProps = {
  personId: string;
};

export function ContactMethodAddDisclosure({ personId }: ContactMethodAddDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="md" onClick={() => setOpen(true)}>
        Add contact method
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <ContactMethodAddForm personId={personId} />
      <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
