export interface City {
  name: string;
  state: string;
}

export const INDIAN_CITIES: City[] = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Aurangabad', state: 'Maharashtra' },
  { name: 'Solapur', state: 'Maharashtra' },
  { name: 'Kolhapur', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Udaipur', state: 'Rajasthan' },
  { name: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Goa', state: 'Goa' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Agra', state: 'Uttar Pradesh' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Amritsar', state: 'Punjab' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Ranchi', state: 'Jharkhand' },
  { name: 'Bhubaneswar', state: 'Odisha' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Kochi', state: 'Kerala' },
  { name: 'Thiruvananthapuram', state: 'Kerala' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Madurai', state: 'Tamil Nadu' },
  { name: 'Mangalore', state: 'Karnataka' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { name: 'Vijayawada', state: 'Andhra Pradesh' },
  { name: 'Raipur', state: 'Chhattisgarh' },
  { name: 'Dehradun', state: 'Uttarakhand' },
  { name: 'Srinagar', state: 'Jammu & Kashmir' },
  { name: 'Jammu', state: 'Jammu & Kashmir' },
  { name: 'Shimla', state: 'Himachal Pradesh' },
  { name: 'Manali', state: 'Himachal Pradesh' },
  { name: 'Haridwar', state: 'Uttarakhand' },
  { name: 'Rishikesh', state: 'Uttarakhand' },
];

export function searchCities(query: string): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return INDIAN_CITIES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.state.toLowerCase().includes(q)
  ).slice(0, 8);
}
