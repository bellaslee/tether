import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/app/site-footer";
import { SignupForm } from "@/components/auth/signup-form";
import { getPrmSupabaseContext } from "@/lib/prm/context";

const PAGE_COPY = {
  hero: {
    eyebrow: "Start quietly",
    title: "Create your account",
    description:
      "This is Tether for friends first. Your notes and history belong only to you.",
  },
  footer: {
    lead: "Already have an account?",
    signIn: "Sign in",
  },
} as const;

export default async function SignupPage() {
  const ctx = await getPrmSupabaseContext();
  if (ctx) {
    redirect("/people");
  }

  return (
    <>
    <main className="prm-shell-gutter-x mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
      <div className="card-surface rounded-[2rem] border border-border-soft border-t-2 border-t-accent-sun/50 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          {PAGE_COPY.hero.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
          {PAGE_COPY.hero.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          {PAGE_COPY.hero.description}
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          {PAGE_COPY.footer.lead}{" "}
          <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
            {PAGE_COPY.footer.signIn}
          </Link>
        </p>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
