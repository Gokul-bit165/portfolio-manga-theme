import { ChapterRail } from "@/components/chrome/ChapterRail";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SkipLink } from "@/components/chrome/SkipLink";
import { Identity } from "@/components/identity/Identity";
import { Prologue } from "@/components/prologue/Prologue";

export default function Home() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <ChapterRail />
      <main>
        <Prologue />
        <Identity />
      </main>
    </>
  );
}
