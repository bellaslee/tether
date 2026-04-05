import { redirect } from 'next/navigation';

export default function ManageCategoriesRedirectPage() {
  redirect('/settings#categories');
}
