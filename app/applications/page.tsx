import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { ApplicationsFilter } from "@/components/ApplicationsFilter";
import { LandingPage } from "@/components/landing/LandingPage";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationWithJob } from "@/types/database";

export default async function ApplicationsPage() {
  const configured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!configured) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <SetupNotice />
      </main>
    );
  }

  if (!user || !supabase) {
    return <LandingPage />;
  }

  const { data } = await supabase
    .from("applications")
    .select("*, jobs(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const applications = (data ?? []) as ApplicationWithJob[];

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 py-5 pb-36 md:px-8 md:py-10 md:pb-10 xl:px-10">
      <div className="mx-auto max-w-[1520px] overflow-x-clip">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0f8f83]">
              <Briefcase className="h-3.5 w-3.5" />
              Applications
            </p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#14213d] md:text-4xl">
              Your applications
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Keep track of the roles you&apos;ve started, tailored, and sent.
            </p>
          </div>
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-2 rounded-full bg-[#0f9f92] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_42px_rgba(15,159,146,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#0b8f83] md:inline-flex"
          >
            Find fresh matches <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ApplicationsFilter applications={applications} />
      </div>
    </main>
  );
}
