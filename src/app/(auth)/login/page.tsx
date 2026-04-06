import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/app/site-footer";
import { LoginForm } from "@/components/auth/login-form";
import { getPrmSupabaseContext } from "@/lib/prm/context";

export default async function LoginPage() {
  const ctx = await getPrmSupabaseContext();
  if (ctx) {
    redirect("/people");
  }

  return (
    <>
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="card-surface rounded-[2rem] border border-border-soft border-t-2 border-t-accent-sky/50 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Welcome back</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Access your people and timeline. Everything stays in your workspace.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
