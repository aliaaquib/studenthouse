export type Property = {
  id: string;
  slug: string;
  title: string;
  name: string;
  price: string;
  priceMonthly: number;
  location: string;
  city: string;
  region: "Jalal-Abad" | "Manas";
  university: string;
  distance: string;
  roommates: number;
  roomType: "Studio" | "Private room" | "Shared room" | "Apartment";
  furnished: boolean;
  utilitiesIncluded: boolean;
  badges: string[];
  amenities: string[];
  availabilityDate: string;
  image: string;
  images: string[];
  popular?: boolean;
  verified?: boolean;
  genderPreference: "Female only" | "Male only" | "Mixed";
  type: "Apartment" | "Shared Room" | "Studio";
  agent: string;
  landlordPhone: string;
  description: string;
};

export type PropertyFilters = {
  query: string;
  budget: "Any" | "Under 15,000 KGS" | "15,000 - 22,000 KGS" | "22,000+ KGS";
  roomType: "Any" | "Studio" | "Private room" | "Shared room" | "Apartment";
  furnished: "Any" | "Furnished" | "Unfurnished";
  utilities: "Any" | "Included" | "Separate";
  genderPreference: "Any" | "Female only" | "Male only" | "Mixed";
  university: "Any" | string;
  region: "Any" | "Jalal-Abad" | "Manas";
};

export type Agent = {
  slug: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  deals: number;
};

export type University = {
  slug: string;
  name: string;
  city: string;
  apartmentCount: number;
  averageRent: string;
  nearbyListings: number;
};

export type City = {
  slug: string;
  name: string;
  count: number;
  averageRent: string;
  status: "active" | "coming-soon";
};

export type Region = {
  slug: string;
  name: string;
  status: "active" | "coming-soon";
};
