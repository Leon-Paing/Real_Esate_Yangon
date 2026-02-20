import type { Agent, Property } from "../types";
import { agents } from "./agents";

const townships = [
  "Bahan", "Kamayut", "Dagon", "Hlaing", "Mayangon", "Insein", "Sanchaung",
  "Botahtaung", "Pazundaung", "Mingaladon", "Thingangyun", "South Okkalapa", "North Okkalapa",
  "Tamwe", "Yankin", "Dagon Seikkan", "Hlegu", "Dala",
];

const featuresPool = [
  "Parking", "Security", "Generator", "Elevator", "Garden", "Balcony", "Pool",
  "Gym", "Playground", "CCTV", "Water Supply", "Near Market", "Near School",
  "Near Hospital", "Quiet Area", "Furnished", "Semi-Furnished", "Air Conditioning",
];

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function yangonCoords(): [number, number] {
  return [randomInRange(16.72, 16.98), randomInRange(96.11, 96.22)];
}

const types = ["House", "Apartment", "Condominium", "Villa", "Townhouse"];
const statuses = ["Sale", "Rent"];

const PROPERTY_IMAGES = [
  "1564013799919-ab600027ffc6", "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c",
  "1502672260266-1c1ef2d93688", "1600566753190-17f0baa2a6c3", "1600047705251-874a76a4655e",
  "1600585154524-24d290a63fdc", "1600607687939-ce8a6c25118c", "1512917774080-9991f1c4c750",
  "1600566753086-00f18fb6b3ea", "1600210964590-fcb82c2e8b", "1600573472550-8098d2cbb2e",
  "1560448204-e269-4e96-9a2c-2c2b0a81a8a9", "1600566752351-8b2c2e8b", "1759355787113-c9ea513a4a47",
  "1605149918034-df606263d98b", "1600585152360-c3f2e6e4b",
];
const UNSPLASH_BASE = "https://images.unsplash.com/photo-";
function propertyImageUrl(id: number): string {
  const imgId = PROPERTY_IMAGES[(id - 1) % PROPERTY_IMAGES.length];
  return `${UNSPLASH_BASE}${imgId}?w=800&h=500&auto=format&fit=crop`;
}

function genProperty(id: number): Property {
  const [lat, lng] = yangonCoords();
  const township = townships[id % townships.length];
  const type = types[id % types.length];
  const status = statuses[id % 2];
  const beds = (id % 5) + 1;
  const baths = Math.max(1, beds - (id % 2));
  const sqft = 600 + (id % 25) * 120;
  const priceSale = (80000 + (id % 80) * 10000) * 1000;
  const priceRent = 300 + (id % 40) * 50;
  const agent: Agent = agents[id % agents.length];
  return {
    id,
    title: `${type} for ${status} in ${township}`,
    type,
    status,
    township,
    address: `${50 + (id % 80)} ${["Main Rd", "Street", "Lane", "Road", "Ave"][id % 5]}, ${township}, Yangon`,
    lat,
    lng,
    beds,
    baths,
    sqft,
    price: status === "Sale" ? priceSale : priceRent,
    priceLabel: status === "Sale" ? `${(priceSale / 1000).toFixed(0)}K MMK` : `${priceRent}K MMK/mo`,
    features: pick(featuresPool, 4 + (id % 5)),
    agentId: agent.id,
    agent,
    image: propertyImageUrl(id),
    description: `Spacious ${type.toLowerCase()} in peaceful ${township}. ${beds} bedroom${beds > 1 ? "s" : ""}, ${baths} bathroom${baths > 1 ? "s" : ""}, ${sqft} sqft. ${pick(featuresPool, 2).join(" & ")}. Ideal for families.`,
  };
}

export const properties: Property[] = Array.from({ length: 48 }, (_, i) => genProperty(i + 1));

export function getPropertyById(id: number | string): Property | undefined {
  return properties.find((p) => p.id === Number(id));
}

export function getPropertiesByTownship(township: string): Property[] {
  return properties.filter((p) => p.township === township);
}

export function getPropertiesByType(type: string): Property[] {
  return properties.filter((p) => p.type === type);
}

export function getPropertiesByStatus(status: string): Property[] {
  return properties.filter((p) => p.status === status);
}
