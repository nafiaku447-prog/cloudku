
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

export interface Database {
    id: number;
    database_name: string;
    database_type: string;
    database_user: string;
    current_size_mb: number;
    max_size_mb: number;
    status: string;
    created_at: string;
}

export interface DatabaseStatsType {
    totalDatabases: number;
    mysqlCount: number;
    postgresCount: number;
    totalSizeMB: number;
}
