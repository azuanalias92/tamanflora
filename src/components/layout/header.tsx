import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);
  const [installEvent, setInstallEvent] = useState<
    | (Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
      })
    | null
  >(null);
  const [installed, setInstalled] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(
        e as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
        }
      );
    };
    window.addEventListener("beforeinstallprompt", handler);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <header className={cn("z-50 h-16", fixed && "header-fixed peer/header sticky top-0 w-[inherit]", offset > 10 && fixed ? "shadow" : "shadow-none", className)} {...props}>
      <div
        className={cn(
          "relative flex h-full items-center gap-3 p-4 sm:gap-4",
          offset > 10 && fixed && "after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg"
        )}
      >
        <SidebarTrigger variant="outline" className="max-md:scale-125" />
        <Separator orientation="vertical" className="h-6" />
        {children}
        {!installed && installEvent && !isIOS && (
          <div className="ms-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await installEvent.prompt();
                const result = await installEvent.userChoice;
                setInstallEvent(null);
                if (result.outcome === "accepted") setInstalled(true);
              }}
            >
              Install App
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
