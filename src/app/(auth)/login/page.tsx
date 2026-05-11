import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/app/site-footer";
import { LoginForm } from "@/components/auth/login-form";
import { getAccountSupabaseContext } from "@/lib/account/context";

const PAGE_COPY = {
  hero: {
    title: "Sign in",
    subtitle: "Use the email and password for your Tether account.",
  },
  footer: {
    lead: "New here?",
    createAccount: "Create an account",
  },
} as const;

export default async function LoginPage() {
  const ctx = await getAccountSupabaseContext();
  if (ctx) {
    redirect("/dashboard");
  }

  return (
    <>
    <main className="shell-gutter-x mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
      <div className="card-surface rounded-[2rem] border border-border-soft border-t-2 border-t-accent-sky/50 p-8 sm:p-10">
        <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
          {PAGE_COPY.hero.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          {PAGE_COPY.hero.subtitle}
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          {PAGE_COPY.footer.lead}{" "}
          <Link href="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">
            {PAGE_COPY.footer.createAccount}
          </Link>
        </p>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
