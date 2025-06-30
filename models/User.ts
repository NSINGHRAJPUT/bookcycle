import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "student" | "manager" | "admin"
  institution?: string
  reward_points: number
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
