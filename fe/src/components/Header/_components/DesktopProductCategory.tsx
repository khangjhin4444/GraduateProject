import { SUBTYPES } from "@/shared/ProductSubtype";
import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router";

export default function DesktopProductCategory({
  type,
  isOpen,
  onOpen,
  onClose,
  onNavigate,
}: {
  type: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className="group/sub relative w-full"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <NavLink
        to={`/collection/${type}`}
        className="header-link mx-4 flex items-center justify-between text-lg"
        onClick={onNavigate}
      >
        {formatSubtype(type)} <ChevronRight />
      </NavLink>
      <div
        className={clsx(
          "absolute right-[-80%] top-0 z-10 flex w-36 flex-col items-start gap-1 bg-background pb-1 shadow-lg transition-all duration-200",
          isOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        {SUBTYPES[type].map((subtype) => (
          <NavLink
            key={subtype}
            to={`/collection/${type}/${subtype}`}
            className="header-link mx-4 text-lg"
            onClick={onNavigate}
          >
            {formatSubtype(subtype)}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

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
