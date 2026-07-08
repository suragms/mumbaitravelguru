export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India' },
  { code: 'GOI', name: 'Dabolim International Airport', city: 'Goa', country: 'India' },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India' },
  { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', country: 'India' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States' },
];

export function searchAirports(query: string): Airport[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return AIRPORTS.filter(a =>
    a.code.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getAirport(code: string): Airport | undefined {
  return AIRPORTS.find(a => a.code === code.toUpperCase());
}
