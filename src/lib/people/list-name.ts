/** Row fields needed to resolve how a person is labeled in the UI. */
export type PersonForDisplay = {
  full_name: string;
  display_name: string | null;
};

/**
 * Label for lists, pickers, and timeline chips. Person profile main heading
 * (`/people/[id]`) should use `full_name` only.
 */
export function personShownName(person: PersonForDisplay): string {
  const d = person.display_name?.trim();
  return d && d.length > 0 ? d : person.full_name;
}
