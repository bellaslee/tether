/**
 * Submits the owning form from a text control when the user presses ⌘/Ctrl+Enter.
 * Prefers an explicit Save intent button when present, otherwise the first enabled submit.
 */
export function submitFormFromTextControl(
  el: HTMLInputElement | HTMLTextAreaElement,
): void {
  const form = el.form;
  if (!form) return;

  const save = form.querySelector<HTMLButtonElement>(
    'button[type="submit"][name="intent"][value="save"]:not(:disabled)',
  );
  const submitter =
    save ??
    form.querySelector<HTMLButtonElement>(
      'button[type="submit"]:not(:disabled)',
    );
  if (submitter) {
    form.requestSubmit(submitter);
  }
}
