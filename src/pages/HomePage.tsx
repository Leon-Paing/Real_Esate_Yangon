import { Link } from "react-router-dom";
import { properties } from "../data/properties";

const IMG_FALLBACK = "https://placehold.co/800x500/1a3a32/e8d5b7?text=Property";

export default function HomePage() {
  const featured = properties.slice(0, 6);
  return (
    <div className="pb-8 md:pb-12">
      <section className="text-center px-4 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-surface to-[#0d1117] rounded-2xl border border-[#30363d] mb-8 md:mb-12">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-[#e6edf3]">
          Find Your Home in Yangon
        </h1>
        <p className="text-text-muted text-base sm:text-lg mb-6 max-w-xl mx-auto">
          Houses and apartments for sale and rent across Yangon townships.
        </p>
        <Link
          to="/listings"
          className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-semibold no-underline hover:underline"
        >
          Browse Listings
        </Link>
      </section>
      <section className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Featured Properties</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featured.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className="bg-surface rounded-xl overflow-hidden border border-[#30363d] text-inherit no-underline transition transform hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.onerror = null;
                    t.src = IMG_FALLBACK;
                  }}
                />
                <span className="absolute top-3 left-3 bg-accent text-white px-2 py-1 rounded-md text-xs font-semibold">
                  {p.status}
                </span>
              </div>
              <div className="p-4">
                <span className="text-xs text-text-muted uppercase">{p.type} · {p.township}</span>
                <h3 className="text-base font-semibold mt-1">{p.title}</h3>
                <p className="text-sm text-text-muted my-1">{p.beds} beds · {p.baths} baths · {p.sqft} sqft</p>
                <p className="text-base font-semibold text-gold">{p.priceLabel}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/listings" className="text-accent font-semibold no-underline hover:underline">
            View all listings →
          </Link>
        </div>
      </section>
    </div>
  );
}
