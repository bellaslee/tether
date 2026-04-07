"use client";

import { useActionState, useState } from "react";
import type { Tables } from "@/lib/db/database.types";
import type { ActionResult } from "@/lib/actions/contact-methods";
import {
  deleteContactMethod,
  setPrimaryContactMethodForm,
  updateContactMethod,
} from "@/lib/actions/contact-methods";
import { CONTACT_METHOD_TYPES } from "@/lib/domain/constants";
import { formatContactType } from "@/lib/domain/labels";
import { Button } from "@/components/ui/button";
import { ConfirmLightbox } from "@/components/ui/confirm-lightbox";
import { FieldError } from "@/components/ui/field-error";
import { Picklist } from "@/components/ui/picklist";
import { FormInput } from "@/components/ui/form-input";
import { listRowCardClassName } from "@/components/ui/list-row-card";

const initial: ActionResult = {};

type ContactMethodRowProps = {
  personId: string;
  method: Tables<"contact_methods">;
};

export function ContactMethodRow({ personId, method }: ContactMethodRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    updateContactMethod.bind(null, personId, method.id),
    initial,
  );

  if (editing) {
    return (
      <li className={listRowCardClassName('text-sm')}>
        <form action={formAction} className="space-y-3">
          {state.error ? (
            <FieldError size="inline">{state.error}</FieldError>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted" htmlFor={`edit-type-${method.id}`}>
                Type
              </label>
              <Picklist
                id={`edit-type-${method.id}`}
                name="type"
                required
                defaultValue={method.type}
                fieldSize="compact"
              >
                {CONTACT_METHOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatContactType(t)}
                  </option>
                ))}
              </Picklist>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-muted" htmlFor={`edit-value-${method.id}`}>
                Value
              </label>
              <FormInput
                id={`edit-value-${method.id}`}
                name="value"
                required
                defaultValue={method.value}
                fieldSize="compact"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-muted" htmlFor={`edit-notes-${method.id}`}>
                Notes
              </label>
              <FormInput
                id={`edit-notes-${method.id}`}
                name="notes"
                defaultValue={method.notes ?? ""}
                fieldSize="compact"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={pending}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={listRowCardClassName('text-sm')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {formatContactType(method.type)}
            {method.is_primary ? (
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent">
                Primary
              </span>
            ) : null}
          </p>
          <p className="mt-1 font-medium">{method.value}</p>
          {method.notes ? <p className="mt-1 text-xs text-muted">{method.notes}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          {!method.is_primary ? (
            <form action={setPrimaryContactMethodForm}>
              <input type="hidden" name="person_id" value={personId} />
              <input type="hidden" name="method_id" value={method.id} />
              <Button type="submit" variant="link" size="sm">
                Make primary
              </Button>
            </form>
          ) : null}
          <Button
            type="button"
            variant="dangerLink"
            size="sm"
            onClick={() => {
              setRemoveError(null);
              setConfirmRemoveOpen(true);
            }}
          >
            Remove
          </Button>
        </div>
      </div>
      <ConfirmLightbox
        open={confirmRemoveOpen}
        onClose={() => {
          setConfirmRemoveOpen(false);
          setRemoveError(null);
        }}
        title="Remove this contact method?"
        description="It will disappear from this profile. You can add it again anytime."
        confirmLabel="Remove"
        error={removeError}
        onConfirm={async () => {
          const result = await deleteContactMethod(personId, method.id);
          if (result.error) {
            setRemoveError(result.error);
            return false;
          }
        }}
      />
    </li>
  );
}
