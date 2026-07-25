import Link from "next/link";
import { Radar } from "lucide-react";
import { Corners } from "@/components/ui/kit";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-card/60 p-10 text-center backdrop-blur-lg">
        <Corners />
        <Radar className="mx-auto mb-6 h-14 w-14 text-primary/60" />
        <div className="font-mono text-6xl font-bold text-primary text-glow">404</div>
        <h1 className="mt-3 font-grotesk text-xl font-semibold">Signal Lost</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested module does not exist on this console.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Return to SOC Dashboard
        </Link>
      </div>
    </div>
  );
}
