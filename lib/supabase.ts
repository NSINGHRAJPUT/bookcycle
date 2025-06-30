import { createClient } from "@supabase/supabase-js"

/**
 * Safely read Supabase env vars.
 * In production you **must** set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (e.g. in Vercel's dashboard). During local preview we fall back to
 * localhost + dummy key so the app doesn't crash.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  (process.env.NODE_ENV === "development"
    ? "https://localhost:54321" // local supabase default
    : "https://placeholder.supabase.co")

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (process.env.NODE_ENV === "development" ? "public-anon-key" : "")

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  /* eslint-disable no-console */
  console.warn(
    "[Supabase] Environment variables missing. Using fallback values. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "to connect to your real project.",
  )
  /* eslint-enable no-console */
}

// Validate that we have a proper Supabase URL (not a PostgreSQL connection string)
if (supabaseUrl.includes("postgresql://") || supabaseUrl.includes("@db.")) {
  throw new Error(
    "Invalid Supabase URL detected. Please use your Supabase project URL (https://your-project.supabase.co), " +
      "not the database connection string. Check your NEXT_PUBLIC_SUPABASE_URL environment variable.",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types - Updated to match new schema
export interface User {
  id: string
  name: string
  email: string
  role: "student" | "manager" | "admin"
  institution?: string
  reward_points: number
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  subject: string
  mrp: number
  condition: "excellent" | "good" | "fair" | "poor"
  description?: string
  status: "pending" | "verified" | "rejected" | "sold"
  points_price?: number
  donor_id: string
  verifier_id?: string
  buyer_id?: string
  images?: string[]
  created_at: string
  updated_at: string
  // Joined data
  donor?: User
  verifier?: User
  buyer?: User
}

export interface Transaction {
  id: string
  type: "donation" | "purchase"
  user_id: string
  book_id: string
  points_amount: number
  status: "pending" | "completed" | "failed"
  created_at: string
  // Joined data
  user?: User
  book?: Book
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}
