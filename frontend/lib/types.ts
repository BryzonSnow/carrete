export type RSVP = "pending" | "going" | "not_going" | "late";

export type BankDetails = {
  holder: string;
  rut: string;
  bank_name: string;
  account_type: string;
  account_number: string;
};

export type Guest = {
  id: string;
  event_id: string;
  display_name: string;
  rsvp: RSVP;
  created_at: string;
  marked_at?: string | null;
  validated_at?: string | null;
  is_host?: boolean;
};

export type ItemClaim = {
  guest_id: string;
  guest_name: string;
  qty: number;
};

export type Item = {
  id: string;
  event_id: string;
  category: string;
  name: string;
  unit: string;
  required_qty: number;
  committed_qty: number;
  is_open: boolean;
  created_by_guest_id?: string | null;
  sort_order: number;
  claims: ItemClaim[];
};

export type PublicEvent = {
  id: string;
  slug: string;
  name: string;
  host_name: string;
  starts_at: string;
  address: string | null;
  address_locked: boolean;
  fee_amount: number;
  bank: BankDetails | null;
};

export type Stats = {
  going: number;
  late: number;
  not_going: number;
  pending: number;
  payers: number;
  fee_goal: number;
  fee_marked: number;
  fee_validated: number;
};

export type EventPayload = {
  event: PublicEvent;
  me: Guest | null;
  is_admin: boolean;
  guests: Guest[];
  items: Item[];
  stats: Stats;
};

export type CreateItemInput = {
  category: string;
  name: string;
  unit: string;
  required_qty: number;
  is_open?: boolean;
};

export type CreateEventInput = {
  name: string;
  host_name: string;
  starts_at: string;
  address: string;
  fee_amount: number;
  bank_holder: string;
  bank_rut: string;
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  items: CreateItemInput[];
};
