import { redirect } from 'next/navigation';

export default function ManageInteractionTypesRedirectPage() {
  redirect('/settings#timeline-types');
}
