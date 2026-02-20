import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPropertyById } from "../data/properties";
import RouteMap from "../components/RouteMap";
import MapPropertyCard from "../components/MapPropertyCard";

const IMG_FALLBACK = "https://placehold.co/800x500/1a3a32/e8d5b7?text=Property";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const property = id ? getPropertyById(id) : undefined;
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    if (!showMap) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [showMap]);

  if (!property) {
    return (
      <div className="pb-12">
        <p>Property not found.</p>
        <Link to="/listings" className="text-accent">Back to listings</Link>
      </div>
    );
  }

  const { agent, features, address, lat, lng } = property;

  return (
    <div className="pb-8 md:pb-12">
      <Link to="/listings" className="inline-block mb-4 text-accent no-underline hover:underline">
        ← Back to listings
      </Link>

      <div className="relative rounded-xl overflow-hidden mb-6 md:mb-8 aspect-[21/9] max-h-[280px] sm:max-h-[320px] md:max-h-[360px]">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = IMG_FALLBACK;
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-t from-black/85 to-transparent text-white">
          <span className="inline-block bg-accent px-2 py-1 rounded-md text-xs font-semibold">
            {property.status}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">{property.title}</h1>
          <p className="text-white/90 text-sm sm:text-base mt-1">{address}</p>
          <p className="text-gold text-lg sm:text-xl font-bold mt-1">{property.priceLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
        <div className="min-w-0">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Details</h2>
            <ul className="list-none p-0 m-0">
              <li><strong>Type:</strong> {property.type}</li>
              <li><strong>Township:</strong> {property.township}</li>
              <li><strong>Bedrooms:</strong> {property.beds}</li>
              <li><strong>Bathrooms:</strong> {property.baths}</li>
              <li><strong>Area:</strong> {property.sqft} sqft</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Features</h2>
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <span
                  key={f}
                  className="bg-surface px-2.5 py-1.5 rounded-lg text-sm border border-[#30363d]"
                >
                  {f}
                </span>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-text-muted leading-relaxed">{property.description}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Location & directions</h2>
            <p className="text-text-muted leading-relaxed">
              {address}. Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}.
            </p>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="mt-2 px-4 py-2.5 bg-accent text-white border-0 rounded-lg font-semibold cursor-pointer"
            >
              Go to destination — show map & route
            </button>
            {showMap && (
              <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117] h-screen w-screen overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="absolute top-4 left-4 z-[1000] w-10 h-10 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-lg leading-none"
                  aria-label="Close map"
                >
                  ×
                </button>
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] w-full max-w-[260px] sm:max-w-sm px-1 sm:px-2">
                  <MapPropertyCard
                    property={property}
                    expanded={detailsExpanded}
                    onToggleExpand={() => setDetailsExpanded((e) => !e)}
                    routeDistance={routeDistance}
                  />
                </div>
                <div className="flex-1 min-h-0 flex flex-col pt-2">
                  <RouteMap
                    destination={{ ...property, lat, lng }}
                    destinationImage={property.image}
                    fullScreen
                    onRouteDistance={setRouteDistance}
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="bg-surface rounded-xl p-6 border border-[#30363d]">
            <h3 className="text-sm text-text-muted mb-3">Listing agent</h3>
            <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xl mb-3">
              {agent.avatar}
            </div>
            <p className="font-semibold mb-1">{agent.name}</p>
            <p className="text-gold text-sm mb-2">★ {agent.rating}</p>
            <a href={`tel:${agent.phone}`} className="block text-sm mb-1 text-accent">
              {agent.phone}
            </a>
            <a href={`mailto:${agent.email}`} className="block text-sm text-accent">
              {agent.email}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
