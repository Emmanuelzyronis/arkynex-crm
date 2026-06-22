import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <SearchX className="h-7 w-7" />
      </div>

      <h1 className="mt-5 text-xl font-semibold text-ink">
        We couldn&apos;t find that
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        This record may have been deleted, or the link might be incorrect.
      </p>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
