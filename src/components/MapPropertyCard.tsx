import type { Property } from "../types";

interface MapPropertyCardProps {
  property: Property;
  expanded: boolean;
  onToggleExpand: () => void;
  routeDistance?: number | null;
  className?: string;
}

export default function MapPropertyCard({
  property,
  expanded,
  onToggleExpand,
  routeDistance,
  className = "",
}: MapPropertyCardProps) {
  const { title, address, priceLabel, type, township, beds, baths, sqft, features, agent, image } = property;
  return (
    <div
      className={
        "rounded-xl sm:rounded-2xl border border-white/20 overflow-hidden shadow-xl " +
        "bg-white/10 backdrop-blur-xl max-w-[260px] sm:max-w-none " +
        className
      }
    >
      <div className="relative h-20 sm:h-28 md:h-32 w-full bg-white/10 shrink-0">
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x160/1a1f26/6e7681?text=${encodeURIComponent(title)}`;
          }}
        />
      </div>
      <div className="p-2.5 sm:p-3 md:p-4">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <span className={`text-[10px] sm:text-xs font-medium text-white/70 uppercase tracking-wide ${!expanded ? "hidden sm:inline" : ""}`}>
              {type} · {township}
            </span>
            <h3 className="font-semibold text-white mt-0.5 truncate text-sm sm:text-base">{title}</h3>
            <p className={`text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2 ${!expanded ? "hidden sm:block" : ""}`}>{address}</p>
            <p className={`text-amber-300 font-semibold mt-1 sm:mt-2 text-sm sm:text-base ${!expanded ? "hidden sm:block" : ""}`}>{priceLabel}</p>
            {routeDistance != null && (
              <p className={`text-[10px] sm:text-xs text-white/60 mt-0.5 ${!expanded ? "hidden sm:block" : ""}`}>~{routeDistance} km by road</p>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleExpand}
            className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors text-xs"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <span className={`transform transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
        </div>
        {expanded && (
          <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-white/15 space-y-2 sm:space-y-3">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/80">
              <span>{beds} beds</span>
              <span>·</span>
              <span>{baths} baths</span>
              <span>·</span>
              <span>{sqft} sqft</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {features.slice(0, 5).map((f) => (
                <span
                  key={f}
                  className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg bg-white/15 text-white/90"
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="pt-1 sm:pt-2">
              <p className="text-[10px] sm:text-xs text-white/60">Listing agent</p>
              <p className="text-xs sm:text-sm font-medium text-white">{agent.name}</p>
              <a href={`tel:${agent.phone}`} className="text-[10px] sm:text-xs text-emerald-400 block mt-0.5">
                {agent.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
