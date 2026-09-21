import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSidebar } from "@/components/ui/sidebar";
import { SUBTYPES } from "@/shared/ProductSubtype";
import { clsx } from "clsx";
import { Link } from "react-router";

function formatSubtype(value: string) {
  const labels: Record<string, string> = {
    keyboardkit: "Keyboard Kit",
    prebuild: "Prebuild",
    keycap: "Keycap",
    switch: "Switch",
    fullsize: "Full Size",
    "75": "75% or less",
    tkl: "TKL",
    alice: "Alice",
    cherry: "Cherry",
    mda: "MDA",
    sa: "SA",
    artisan: "Artisan",
    linear: "Linear",
    tactile: "Tactile",
    clicky: "Clicky",
    silent: "Silent",
  };

  return labels[value] ?? value;
}

export function MobileNavigationLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <Link
      to={href}
      className={clsx(
        "px-4 py-3 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className,
      )}
      onClick={() => setOpenMobile(false)}
    >
      {children}
    </Link>
  );
}

export default function MobileProductCategory({ type }: { type: string }) {
  return (
    <Accordion>
      <AccordionItem>
        <div className="flex items-center">
          <MobileNavigationLink href={`/collection/${type}`} className="flex-1">
            {formatSubtype(type)}
          </MobileNavigationLink>
          <AccordionTrigger
            aria-label={`Toggle ${formatSubtype(type)} subtypes`}
            className="w-10 justify-center px-2 text-sidebar-foreground hover:text-sidebar-accent-foreground"
          />
        </div>
        <AccordionContent className="flex flex-col bg-sidebar-accent/30">
          {SUBTYPES[type].map((subtype) => (
            <MobileNavigationLink
              key={subtype}
              href={`/collection/${type}/${subtype}`}
              className="px-8 py-2 text-sm"
            >
              {formatSubtype(subtype)}
            </MobileNavigationLink>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
