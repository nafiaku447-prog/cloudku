
export interface Feature {
  name: string;
  included: boolean | string;
}

export interface HostingTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isPopular?: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: number;
  comment: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
