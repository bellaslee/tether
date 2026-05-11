import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/app/site-footer";
import { getAccountSupabaseContext } from "@/lib/account/context";

const PAGE_COPY = {
  hero: {
    title: "Check your email",
    descriptionWithEmail:
      "We sent a confirmation link to the address below. Open it to finish setting up your account, then come back to sign in.",
    descriptionGeneric:
      "We sent a confirmation link to your email. Open it to finish setting up your account, then come back to sign in.",
    inboxHint:
      "If you do not see it after a minute or two, peek in spam or promotions.",
  },
  footer: {
    ready: "Already confirmed?",
    signIn: "Sign in",
    wrongEmailLead: "Wrong email?",
    tryAgain: "Start over with signup",
  },
} as const;

type PageProps = {
  searchParams: Promise<{ email?: string | string[] }>;
};

function firstParam(param: string | string[] | undefined): string | undefined {
  if (param === undefined) return undefined;
  return Array.isArray(param) ? param[0] : param;
}

export default async function SignupCheckEmailPage(props: PageProps) {
  const ctx = await getAccountSupabaseContext();
  if (ctx) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const email = firstParam(searchParams.email)?.trim();
  const description = email
    ? PAGE_COPY.hero.descriptionWithEmail
    : PAGE_COPY.hero.descriptionGeneric;

  return (
    <>
      <main className="shell-gutter-x mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
        <div className="card-surface rounded-[2rem] border border-border-soft border-t-2 border-t-accent-sun/50 p-8 sm:p-10">
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
            {PAGE_COPY.hero.title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
          {email ? (
            <p className="mt-4 rounded-2xl border border-border-soft bg-white/60 px-4 py-3 text-sm font-medium text-foreground">
              {email}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-muted">
            {PAGE_COPY.hero.inboxHint}
          </p>
          <p className="mt-8 text-center text-sm text-muted">
            {PAGE_COPY.footer.ready}{" "}
            <Link
              href="/login"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              {PAGE_COPY.footer.signIn}
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-muted">
            {PAGE_COPY.footer.wrongEmailLead}{" "}
            <Link
              href="/signup"
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              {PAGE_COPY.footer.tryAgain}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
