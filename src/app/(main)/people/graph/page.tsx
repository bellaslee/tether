import { redirect } from 'next/navigation';

/** Old standalone URL → People list graph view */
export default function PeopleGraphLegacyRedirect(): never {
  redirect('/people?view=graph');
}
