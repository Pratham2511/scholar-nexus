"use client";

import { useAppStore } from "@/store/app-store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HomeView } from "@/components/papers/home-view";
import { ResultsView } from "@/components/papers/results-view";
import { DetailsView } from "@/components/papers/details-view";
import { CompareView } from "@/components/papers/compare-view";
import { LibraryView } from "@/components/papers/library-view";
import { ProfileView } from "@/components/papers/profile-view";
import { NetworkView } from "@/components/papers/network-view";
import { AuthorView } from "@/components/papers/author-view";
import { AlertModal } from "@/components/papers/alert-modal";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { fetchSavedPapers, refreshRecentSearches } from "@/lib/actions";

export default function Page() {
  const view = useAppStore((s) => s.view);

  // On first mount, load saved paper IDs + recent searches into the store
  useEffect(() => {
    void fetchSavedPapers();
    void refreshRecentSearches();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {view === "home" && <HomeView />}
        {view === "results" && <ResultsView />}
        {view === "details" && <DetailsView />}
        {view === "compare" && <CompareView />}
        {view === "library" && <LibraryView />}
        {view === "profile" && <ProfileView />}
        {view === "network" && <NetworkView />}
        {view === "author" && <AuthorView />}
      </main>
      <Footer />
      <AlertModal />
      <SonnerToaster richColors position="bottom-right" />
    </div>
  );
}
