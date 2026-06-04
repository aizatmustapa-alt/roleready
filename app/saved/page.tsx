import { Bookmark } from "lucide-react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SetupNotice } from "@/components/SetupNotice";
import { SavedJobList } from "@/components/SavedJobList";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationWithJob } from "@/types/database";

export default async function SavedPage() {
  const configured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

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
    .eq("status", "Saved")
    .order("created_at", { ascending: false });

  const saved = (data ?? []) as ApplicationWithJob[];

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-36 pt-6 md:px-8 md:py-10 xl:px-10">
      <div className="mx-auto max-w-[920px] overflow-x-clip">
        <div className="mb-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ece8ff] px-3 py-1.5 text-sm font-semibold text-[#2200ff]">
            <Bookmark className="h-4 w-4" />
            Saved jobs
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Keep roles you like close by.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
            Bookmark jobs from your matches. When you&apos;re ready, hit Prepare application to start tailoring.
          </p>
        </div>

        <SavedJobList initial={saved} />
      </div>
    </main>
  );
}
