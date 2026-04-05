import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/app/site-footer";
import { SignupForm } from "@/components/auth/signup-form";
import { getPrmSupabaseContext } from "@/lib/prm/context";

export default async function SignupPage() {
  const ctx = await getPrmSupabaseContext();
  if (ctx) {
    redirect("/people");
  }

  return (
    <>
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="card-surface rounded-[2rem] border border-border-soft p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Start quietly</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          This is Tether for friends first. Your notes and history belong only to you.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
