import { Search, Bell, ShieldAlert } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 glass sticky top-0 z-40 border-b border-white/5 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, IP addresses, hashes..."
            className="w-full bg-background/50 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
        <div className="h-8 w-px bg-white/10 mx-1" />
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-1.5 rounded-full text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Defcon 4</span>
        </div>
      </div>
    </header>
  );
}
