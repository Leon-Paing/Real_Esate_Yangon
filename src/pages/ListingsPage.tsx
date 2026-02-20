import { useState } from "react";
import { Link } from "react-router-dom";
import { properties } from "../data/properties";

const IMG_FALLBACK = "https://placehold.co/800x500/1a3a32/e8d5b7?text=Property";

const types = ["All", ...new Set(properties.map((p) => p.type))];
const statuses = ["All", "Sale", "Rent"];
const townships = ["All", ...new Set(properties.map((p) => p.township).sort())];

export default function ListingsPage() {
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [township, setTownship] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = properties.filter((p) => {
    if (type !== "All" && p.type !== type) return false;
    if (status !== "All" && p.status !== status) return false;
    if (township !== "All" && p.township !== township) return false;
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.township.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="pb-8 md:pb-12">
      <h1 className="font-display text-2xl sm:text-3xl mb-4">Listings</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by title or township..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 bg-surface border border-[#30363d] rounded-lg text-[#e6edf3] placeholder:text-text-muted"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 bg-surface border border-[#30363d] rounded-lg text-[#e6edf3]"
        >
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-surface border border-[#30363d] rounded-lg text-[#e6edf3]"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={township}
          onChange={(e) => setTownship(e.target.value)}
          className="px-3 py-2 bg-surface border border-[#30363d] rounded-lg text-[#e6edf3]"
        >
          {townships.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <p className="text-text-muted mb-6">{filtered.length} properties</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((p) => (
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
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = IMG_FALLBACK;
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
              <div className="flex flex-wrap gap-1 my-2">
                {p.features.slice(0, 3).map((f) => (
                  <span key={f} className="text-[11px] bg-[#30363d] px-1.5 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-base font-semibold text-gold">{p.priceLabel}</p>
              <p className="text-sm text-text-muted mt-1">Agent: {p.agent.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
