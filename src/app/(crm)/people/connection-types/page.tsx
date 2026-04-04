import { redirect } from 'next/navigation';

export default function ConnectionTypesRedirectPage() {
  redirect('/settings#connection-types');
}
