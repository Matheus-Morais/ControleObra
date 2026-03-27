export type ItemStatus = 'researching' | 'decided' | 'purchased' | 'installed';
export type MemberRole = 'owner' | 'member';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code: string;
  total_budget: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Room {
  id: string;
  project_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  room_id: string;
  project_id: string;
  category: string;
  name: string;
  status: ItemStatus;
  quantity: number;
  budget: number;
  actual_price: number | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface ItemOption {
  id: string;
  item_id: string;
  model_name: string;
  brand: string | null;
  price: number | null;
  store: string | null;
  url: string | null;
  notes: string | null;
  rating: number | null;
  is_chosen: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ItemOptionPhoto {
  id: string;
  item_option_id: string;
  storage_url: string;
  sort_order: number;
  created_at: string;
}

export interface ItemComment {
  id: string;
  item_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  project_id: string;
  item_id: string | null;
  amount: number;
  description: string | null;
  paid_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Extended types with relations
export interface ItemWithOptions extends Item {
  item_options: (ItemOption & { item_option_photos: ItemOptionPhoto[] })[];
}

export interface RoomWithProgress extends Room {
  total_items: number;
  decided_items: number;
  purchased_items: number;
  installed_items: number;
  total_budget: number;
  total_spent: number;
}

export interface ProjectWithMembers extends Project {
  project_members: (ProjectMember & { profiles: Profile })[];
}
