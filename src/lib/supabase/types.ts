export type UserRole =
  | "adherent"
  | "partenaire"
  | "gestionnaire_membres"
  | "gestionnaire_evenements"
  | "associe"
  | "admin";

export type MemberStatus = "actif" | "inactif" | "en_attente";
export type PartnerStatus = "brouillon" | "soumis" | "valide" | "refuse";
export type EventStatus = "brouillon" | "publie" | "annule" | "archive";
export type EventVisibility = "public" | "adherents" | "partenaires" | "tous_membres";
export type InscriptionStatus = "inscrit" | "liste_attente" | "annule";
export type PropertyStatus = "disponible" | "sous_offre" | "vendu" | "retire";
export type SearchStatus = "active" | "en_pause" | "terminee";
export type IdeaStatus = "a_etudier" | "retenue" | "en_cours" | "realisee" | "non_retenue";
export type ArticleStatus = "brouillon" | "soumis" | "publie" | "archive";
export type PaymentStatus = "en_attente" | "paye" | "en_retard" | "annule";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  photo_url: string | null;
  iad_slug: string | null;
  city: string | null;
  bio: string | null;
  specialties: string[] | null;
  roles: UserRole[];
  member_status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  contact_reason: string | null;
  coverage_area: string | null;
  website: string | null;
  social_links: Record<string, string>;
  logo_url: string | null;
  photos: string[] | null;
  remuneration: boolean;
  internal_conditions: string | null;
  status: PartnerStatus;
  published_version_id: string | null;
  created_by: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerContact {
  id: string;
  partner_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  sort_order: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  program: unknown;
  image_url: string | null;
  location: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  category: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  max_attendees: number | null;
  registration_deadline: string | null;
  external_link: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_company: string | null;
  status: InscriptionStatus;
  registered_at: string;
  cancelled_at: string | null;
}

export interface SharedProperty {
  id: string;
  owner_id: string;
  iad_url: string | null;
  iad_reference: string | null;
  transaction_type: string | null;
  property_type: string | null;
  city: string | null;
  postal_code: string | null;
  neighborhood: string | null;
  price: number | null;
  living_area: number | null;
  land_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  has_garden: boolean | null;
  has_terrace: boolean | null;
  has_balcony: boolean | null;
  has_parking: boolean | null;
  has_garage: boolean | null;
  extra_features: Record<string, unknown>;
  photo_url: string | null;
  description: string | null;
  status: PropertyStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerSearch {
  id: string;
  owner_id: string;
  cities: string[] | null;
  property_types: string[] | null;
  transaction_type: string;
  max_budget: number | null;
  min_area: number | null;
  min_bedrooms: number | null;
  required_features: string[] | null;
  preferred_features: string[] | null;
  tolerances: string | null;
  status: SearchStatus;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  property_id: string;
  search_id: string;
  compatible_criteria: string[] | null;
  gaps: string[] | null;
  missing_info: string[] | null;
  dismissed: boolean;
  dismissed_reason: string | null;
  contacted: boolean;
  created_at: string;
}

export interface Idea {
  id: string;
  author_id: string;
  title: string;
  category: string | null;
  description: string;
  status: IdeaStatus;
  response: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  file_url: string | null;
  visibility: EventVisibility;
  uploaded_by: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  image_url: string | null;
  sources: string | null;
  status: ArticleStatus;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface FinancialEntry {
  id: string;
  label: string;
  category: string;
  amount: number;
  type: "recette" | "depense";
  due_date: string | null;
  paid_at: string | null;
  payment_status: PaymentStatus;
  related_profile_id: string | null;
  related_partner_id: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile>; Relationships: [] };
      partners: { Row: Partner; Insert: Partial<Partner>; Update: Partial<Partner>; Relationships: [] };
      partner_contacts: { Row: PartnerContact; Insert: Partial<PartnerContact> & { partner_id: string; name: string }; Update: Partial<PartnerContact>; Relationships: [] };
      partner_members: { Row: { partner_id: string; user_id: string }; Insert: { partner_id: string; user_id: string }; Update: never; Relationships: [] };
      events: { Row: Event; Insert: Partial<Event> & { title: string; slug: string; starts_at: string }; Update: Partial<Event>; Relationships: [] };
      event_registrations: { Row: EventRegistration; Insert: Partial<EventRegistration> & { event_id: string }; Update: Partial<EventRegistration>; Relationships: [] };
      shared_properties: { Row: SharedProperty; Insert: Partial<SharedProperty> & { owner_id: string }; Update: Partial<SharedProperty>; Relationships: [] };
      buyer_searches: { Row: BuyerSearch; Insert: Partial<BuyerSearch> & { owner_id: string }; Update: Partial<BuyerSearch>; Relationships: [] };
      matches: { Row: Match; Insert: Partial<Match> & { property_id: string; search_id: string }; Update: Partial<Match>; Relationships: [] };
      ideas: { Row: Idea; Insert: Partial<Idea> & { author_id: string; title: string; description: string }; Update: Partial<Idea>; Relationships: [] };
      idea_supports: { Row: { idea_id: string; user_id: string; created_at: string }; Insert: { idea_id: string; user_id: string }; Update: never; Relationships: [] };
      resources: { Row: Resource; Insert: Partial<Resource> & { title: string }; Update: Partial<Resource>; Relationships: [] };
      articles: { Row: Article; Insert: Partial<Article> & { author_id: string; title: string; slug: string }; Update: Partial<Article>; Relationships: [] };
      financial_entries: { Row: FinancialEntry; Insert: Partial<FinancialEntry> & { label: string; category: string; amount: number; type: "recette" | "depense" }; Update: Partial<FinancialEntry>; Relationships: [] };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: UserRole;
      member_status: MemberStatus;
      partner_status: PartnerStatus;
      event_status: EventStatus;
      event_visibility: EventVisibility;
      inscription_status: InscriptionStatus;
      property_status: PropertyStatus;
      search_status: SearchStatus;
      idea_status: IdeaStatus;
      article_status: ArticleStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: {};
  };
}
