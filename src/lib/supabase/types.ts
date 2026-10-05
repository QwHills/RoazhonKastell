export type UserRole =
  | "adherent"
  | "partenaire"
  | "gestionnaire_membres"
  | "gestionnaire_evenements"
  | "membre_executif"
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
export type TuesdaySessionStatus = "preparation" | "active" | "completed";
export type TuesdayPropertyStatus = "a_presenter" | "en_cours" | "mis_de_cote" | "presente";

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
  cotisation_mensuelle: number | null;
  date_adhesion: string | null;
  jour_prelevement: number | null;
  iad_id: string | null;
  rsac_number: string | null;
  rsac_city: string | null;
  formule_adhesion: string | null;
  rib_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSituation {
  title: string;
  description: string;
  icon: string;
}

export interface Partner {
  id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  contact_reason: string | null;
  coverage_area: string | null;
  website: string | null;
  social_links: Record<string, string>;
  logo_url: string | null;
  cover_photo: string | null;
  photos: string[] | null;
  why_choose_us: string | null;
  why_choose_us_points: string[];
  contact_situations: ContactSituation[];
  remuneration: boolean;
  internal_conditions: string | null;
  cotisation_montant: number | null;
  cotisation_frequence: "mensuel" | "annuel" | null;
  cotisation_debut: string | null;
  jour_prelevement: number | null;
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
  photo_url: string | null;
  is_primary: boolean;
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
  photos: string[];
  dpe_energy_class: string | null;
  dpe_energy_value: number | null;
  dpe_ges_class: string | null;
  dpe_ges_value: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
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
  recurrence: "mensuel" | "ponctuel";
  receipt_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus = "brouillon" | "planifie" | "en_cours" | "termine" | "archive";
export type SubjectStatus = "propose" | "a_traiter" | "en_cours" | "traite" | "reporte" | "mis_de_cote";
export type AttendeeResponse = "present" | "absent" | "en_attente";
export type TodoStatus = "a_faire" | "en_cours" | "bloquee" | "terminee";

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  summary: string | null;
  agenda: string | null;
  location: string | null;
  video_link: string | null;
  referent_id: string | null;
  starts_time: string | null;
  ends_time: string | null;
  status: MeetingStatus;
  raw_notes: string | null;
  audio_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingSubject {
  id: string;
  meeting_id: string | null;
  proposed_by: string | null;
  title: string;
  description: string | null;
  referent_id: string | null;
  duration_minutes: number | null;
  sort_order: number;
  status: SubjectStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string;
  response: AttendeeResponse;
  created_at: string;
  updated_at: string;
}

export interface MeetingTodo {
  id: string;
  meeting_id: string | null;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  subject_id: string | null;
  todo_status: TodoStatus;
  progress_note: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimerState {
  status: "ready" | "running" | "paused" | "finished";
  remaining_ms: number;
  started_at: string | null;
}

export interface TuesdaySession {
  id: string;
  session_date: string;
  status: TuesdaySessionStatus;
  current_property_id: string | null;
  timer_state: TimerState;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TuesdaySessionProperty {
  id: string;
  session_id: string;
  property_id: string;
  owner_id: string;
  status: TuesdayPropertyStatus;
  draw_order: number | null;
  presented_at: string | null;
  created_at: string;
}

// Réussites
export type SuccessType = "vente_partage" | "dossier_partenaire" | "coup_de_pouce";
export type SuccessOrigin = "mardi_presentation" | "mardi_recherche" | "mardi_conseil" | "rencontre_chateau" | "autre";
export type SuccessStage = "en_cours" | "compromis" | "vente_definitive" | "finalise" | "annule";
export type SuccessStatus = "brouillon" | "soumis" | "confirme" | "publie" | "refuse" | "retire";
export type ParticipantRole = "declarant" | "binome" | "partenaire" | "contributeur";
export type ConfirmationStatus = "en_attente" | "confirme" | "correction_demandee" | "refuse";

export interface Success {
  id: string;
  type: SuccessType;
  title: string;
  story: string | null;
  origin: SuccessOrigin;
  property_id: string | null;
  stage: SuccessStage;
  stage_date: string | null;
  photo_url: string | null;
  status: SuccessStatus;
  featured: boolean;
  admin_note: string | null;
  declared_by: string;
  created_at: string;
  updated_at: string;
}

export interface SuccessParticipant {
  id: string;
  success_id: string;
  user_id: string | null;
  partner_id: string | null;
  role: ParticipantRole;
  confirmation_status: ConfirmationStatus;
  confirmation_note: string | null;
  publish_consent: boolean;
  anonymized_consent: boolean;
  confirmed_at: string | null;
  created_at: string;
}

export interface SuccessFinancial {
  id: string;
  success_id: string;
  user_id: string;
  total_fees: number | null;
  share_percent: number;
  calculated_amount: number | null;
  actual_amount: number | null;
  encashment_date: string | null;
  created_at: string;
  updated_at: string;
}

export type AtelierActionStatus = "brouillon" | "valide" | "archive";
export type UserActionStatus = "a_faire" | "realisee" | "declinee";
export type MeetSuggestionStatus = "proposee" | "acceptee" | "echangee" | "declinee";
export type PartnerDiscoveryResponse = "proposee" | "connue" | "vue" | "reportee";

export interface AtelierAction {
  id: string;
  event_id: string;
  title: string;
  instruction: string;
  duration_minutes: number;
  resource_url: string | null;
  resource_title: string | null;
  ai_suggestions: AiSuggestion[];
  status: AtelierActionStatus;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  title: string;
  instruction: string;
  duration_minutes: number;
}

export interface UserActionTracking {
  id: string;
  action_id: string;
  user_id: string;
  status: UserActionStatus;
  created_at: string;
  updated_at: string;
}

export interface MeetSuggestion {
  id: string;
  event_id: string;
  user_id: string;
  suggested_user_id: string;
  status: MeetSuggestionStatus;
  created_at: string;
  updated_at: string;
}

export interface KnownContact {
  user_id: string;
  known_user_id: string;
  source: "self_declared" | "met_at_event";
  event_id: string | null;
  created_at: string;
}

export interface PartnerDiscovery {
  id: string;
  user_id: string;
  partner_id: string;
  period_start: string;
  is_current: boolean;
  response: PartnerDiscoveryResponse;
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
      tuesday_sessions: { Row: TuesdaySession; Insert: Partial<TuesdaySession> & { session_date: string }; Update: Partial<TuesdaySession>; Relationships: [] };
      tuesday_session_properties: { Row: TuesdaySessionProperty; Insert: Partial<TuesdaySessionProperty> & { session_id: string; property_id: string; owner_id: string }; Update: Partial<TuesdaySessionProperty>; Relationships: [] };
      atelier_actions: { Row: AtelierAction; Insert: Partial<AtelierAction> & { event_id: string; title: string; instruction: string }; Update: Partial<AtelierAction>; Relationships: [] };
      user_action_tracking: { Row: UserActionTracking; Insert: Partial<UserActionTracking> & { action_id: string; user_id: string }; Update: Partial<UserActionTracking>; Relationships: [] };
      meet_suggestions: { Row: MeetSuggestion; Insert: Partial<MeetSuggestion> & { event_id: string; user_id: string; suggested_user_id: string }; Update: Partial<MeetSuggestion>; Relationships: [] };
      known_contacts: { Row: KnownContact; Insert: { user_id: string; known_user_id: string; source?: string; event_id?: string }; Update: never; Relationships: [] };
      partner_discoveries: { Row: PartnerDiscovery; Insert: Partial<PartnerDiscovery> & { user_id: string; partner_id: string; period_start: string }; Update: Partial<PartnerDiscovery>; Relationships: [] };
      successes: { Row: Success; Insert: Partial<Success> & { type: SuccessType; title: string; declared_by: string }; Update: Partial<Success>; Relationships: [] };
      success_participants: { Row: SuccessParticipant; Insert: Partial<SuccessParticipant> & { success_id: string }; Update: Partial<SuccessParticipant>; Relationships: [] };
      success_financials: { Row: SuccessFinancial; Insert: Partial<SuccessFinancial> & { success_id: string; user_id: string }; Update: Partial<SuccessFinancial>; Relationships: [] };
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
      success_type: SuccessType;
      success_origin: SuccessOrigin;
      success_stage: SuccessStage;
      success_status: SuccessStatus;
      participant_role: ParticipantRole;
      confirmation_status: ConfirmationStatus;
    };
    CompositeTypes: {};
  };
}
