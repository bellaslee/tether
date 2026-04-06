/** Visual only; the control should still use the `required` attribute for validation and AT. */
export function RequiredMark() {
  return (
    <span className="text-red-600" aria-hidden="true">
      {' *'}
    </span>
  );
}
