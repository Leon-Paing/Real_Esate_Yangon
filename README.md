# Yangon Real Estate

A React (Vite) property listing site for Yangon with dummy data: homes and apartments, agents, locations, features, prices, and contact info.

## Run the project

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173).

## Features

- **Home** — Hero and featured properties
- **Listings** — Filter by type (House, Apartment, etc.), status (Sale/Rent), township, and search
- **Property detail** — Full details, agent card, contact (phone/email), and **Go to destination**
- **Go to destination** — Leaflet map with:
  - Simulated **your location** (blue “U” marker)
  - **Property** marker (green “B”)
  - **Route** line between them (fake curved path)
  - **“Start fake trip to property”** — animates a yellow marker from your location to the building over ~8 seconds (fake movement)
- **Agents** — List of agents with phone, email, rating, and listing count

## Tech

- React 18, Vite, React Router
- Leaflet (no react-leaflet) for the map and animation
- Dummy data: 48 properties across Yangon townships, 8 agents

All map movement and route are **simulated** (fake) for demo.
