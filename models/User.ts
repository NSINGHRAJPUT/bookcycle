import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "student" | "manager" | "admin"
  institution?: string
  reward_points: number
  // Address fields for Indian export compliance
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  phone?: string
  created_at: Date
  updated_at: Date
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  role: {
    type: String,
    enum: ["student", "manager", "admin"],
    required: [true, "Role is required"],
  },
  institution: {
    type: String,
    trim: true,
    maxlength: [200, "Institution name cannot exceed 200 characters"],
  },
  reward_points: {
    type: Number,
    default: 0,
    min: [0, "Reward points cannot be negative"],
  },
  // Address fields for Indian export compliance
  address: {
    line1: {
      type: String,
      trim: true,
      maxlength: [200, "Address line 1 cannot exceed 200 characters"],
    },
    line2: {
      type: String,
      trim: true,
      maxlength: [200, "Address line 2 cannot exceed 200 characters"],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    postal_code: {
      type: String,
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },
    country: {
      type: String,
      trim: true,
      default: "IN",
      maxlength: [2, "Country code must be 2 characters"],
    }
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
})

// Update the updated_at field before saving
UserSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

// Create indexes (email index is automatically created by unique: true)
UserSchema.index({ role: 1 })

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
