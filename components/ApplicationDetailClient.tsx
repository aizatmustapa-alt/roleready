"use client";

import { useState } from "react";
import { KeywordStrengthSection } from "@/components/KeywordStrengthSection";
import { ApplicationDetailTabs } from "@/components/ApplicationDetailTabs";
import type { Tab } from "@/components/ApplicationDetailTabs";

type Props = {
  applicationId: string;
  missingKeywords: string[];
  matchScore: number | null;
  tailoredResume: string | null;
  coverLetter: string | null;
  jobDescription: string;
  initialSalary: string;
  matchExplanation: string | null;
  initialRoleSummary: string | null;
  initialHiringManager: string | null;
  initialLocationType: string | null;
  initialOtherNotes: string | null;
  initialNotes: string | null;
};

export function ApplicationDetailClient({
  applicationId,
  missingKeywords,
  matchScore,
  tailoredResume,
  coverLetter,
  jobDescription,
  initialSalary,
  matchExplanation,
  initialRoleSummary,
  initialHiringManager,
  initialLocationType,
  initialOtherNotes,
  initialNotes
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [openAccordion, setOpenAccordion] = useState<Tab | null>("notes");

  return (
    <>
      <KeywordStrengthSection
        missingKeywords={missingKeywords}
        matchScore={matchScore}
      />
      <ApplicationDetailTabs
        applicationId={applicationId}
        jobDescription={jobDescription}
        initialSalary={initialSalary}
        matchExplanation={matchExplanation}
        missingKeywords={missingKeywords}
        tailoredResume={tailoredResume}
        coverLetter={coverLetter}
        initialRoleSummary={initialRoleSummary}
        initialHiringManager={initialHiringManager}
        initialLocationType={initialLocationType}
        initialOtherNotes={initialOtherNotes}
        initialNotes={initialNotes}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openAccordion={openAccordion}
        onAccordionChange={setOpenAccordion}
      />
    </>
  );
}
