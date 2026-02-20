import type { Agent } from "../types";

export const agents: Agent[] = [
  { id: 1, name: "Aung Min Khant", phone: "+95 9 123 456 789", email: "aungmin@yangonrealty.mm", avatar: "AM", rating: 4.9, listings: 24 },
  { id: 2, name: "Thiri Soe", phone: "+95 9 234 567 890", email: "thiri@yangonrealty.mm", avatar: "TS", rating: 4.8, listings: 18 },
  { id: 3, name: "Zaw Win Htet", phone: "+95 9 345 678 901", email: "zawwin@yangonrealty.mm", avatar: "ZW", rating: 4.7, listings: 31 },
  { id: 4, name: "May Thu Aung", phone: "+95 9 456 789 012", email: "maythu@yangonrealty.mm", avatar: "MT", rating: 5.0, listings: 15 },
  { id: 5, name: "Kyaw Zin Oo", phone: "+95 9 567 890 123", email: "kyawzin@yangonrealty.mm", avatar: "KZ", rating: 4.6, listings: 22 },
  { id: 6, name: "Nang Ei Phyu", phone: "+95 9 678 901 234", email: "nangei@yangonrealty.mm", avatar: "NE", rating: 4.9, listings: 19 },
  { id: 7, name: "Htet Aung Lin", phone: "+95 9 789 012 345", email: "htet@yangonrealty.mm", avatar: "HL", rating: 4.8, listings: 27 },
  { id: 8, name: "Su Mon Aye", phone: "+95 9 890 123 456", email: "sumon@yangonrealty.mm", avatar: "SM", rating: 4.7, listings: 12 },
];

export function getAgentById(id: number | string): Agent {
  return agents.find((a) => a.id === Number(id)) ?? agents[0];
}
