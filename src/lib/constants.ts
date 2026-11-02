export const CATEGORIES = ["BLOOD", "OXYGEN", "ICU_BED", "VENTILATOR"] as const;
export type CategoryT = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<CategoryT, string> = {
  BLOOD: "Blood",
  OXYGEN: "Oxygen cylinder",
  ICU_BED: "ICU bed",
  VENTILATOR: "Ventilator",
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const SUBTYPES: Record<CategoryT, string[]> = {
  BLOOD: BLOOD_GROUPS,
  OXYGEN: ["Cylinder"],
  ICU_BED: ["ICU"],
  VENTILATOR: ["Standard"],
};

export const FACILITY_TYPES = ["HOSPITAL", "BLOOD_BANK", "PHARMACY", "NGO"] as const;
export const FACILITY_TYPE_LABEL: Record<string, string> = {
  HOSPITAL: "Hospital", BLOOD_BANK: "Blood bank", PHARMACY: "Pharmacy", NGO: "NGO",
};

// Preset localities so a requester or facility can pick a place without GPS.
export const AREAS: { name: string; lat: number; lng: number }[] = [
  { name: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167 },
  { name: "Karol Bagh, Delhi", lat: 28.6519, lng: 77.1909 },
  { name: "Rohini, Delhi", lat: 28.7383, lng: 77.0822 },
  { name: "Dwarka, Delhi", lat: 28.5921, lng: 77.046 },
  { name: "Janakpuri, Delhi", lat: 28.6219, lng: 77.0878 },
  { name: "Saket, Delhi", lat: 28.5245, lng: 77.2066 },
  { name: "Vasant Kunj, Delhi", lat: 28.52, lng: 77.159 },
  { name: "Lajpat Nagar, Delhi", lat: 28.5677, lng: 77.2437 },
  { name: "Noida Sector 62", lat: 28.627, lng: 77.3649 },
  { name: "Greater Noida, Knowledge Park", lat: 28.4744, lng: 77.504 },
  { name: "Indirapuram, Ghaziabad", lat: 28.646, lng: 77.3715 },
  { name: "Sector 29, Gurugram", lat: 28.4595, lng: 77.0266 },
];

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Searching for a facility",
  OFFERED: "Offer sent, waiting for the facility",
  CONFIRMED: "Matched",
  ESCALATED: "Escalated, search widened",
  CANCELLED: "Cancelled",
};
