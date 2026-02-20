import { agents } from "../data/agents";

export default function AgentsPage() {
  return (
    <div className="pb-8 md:pb-12">
      <h1 className="font-display text-2xl sm:text-3xl mb-2">Our Agents</h1>
      <p className="text-text-muted mb-6">Contact an agent for viewings and inquiries.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {agents.map((a) => (
          <div
            key={a.id}
            className="bg-surface rounded-xl p-6 border border-[#30363d] text-center"
          >
            <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center mx-auto mb-3 font-semibold text-lg">
              {a.avatar}
            </div>
            <h3 className="font-semibold text-lg mb-1">{a.name}</h3>
            <p className="text-gold text-sm mb-2">★ {a.rating} · {a.listings} listings</p>
            <p className="text-sm mb-1">{a.phone}</p>
            <a href={`mailto:${a.email}`} className="text-sm text-accent block">
              {a.email}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
