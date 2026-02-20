export interface Agent {
  id: number;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  listings: number;
}

export interface Property {
  id: number;
  title: string;
  type: string;
  status: string;
  township: string;
  address: string;
  lat: number;
  lng: number;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  priceLabel: string;
  features: string[];
  agentId: number;
  agent: Agent;
  image: string;
  description: string;
}

export type LatLng = [number, number];

export interface PropertyMapDestination {
  id: number;
  title: string;
  address: string;
  lat: number;
  lng: number;
}
