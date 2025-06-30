import mongoose, { type Document, Schema } from "mongoose"

export interface IBook extends Document {
  title: string
  author: string
  isbn?: string 
  subject: string
  mrp: number
  condition: "excellent" | "good" | "fair" | "poor"
  description?: string
  status: "pending" | "verified" | "rejected" | "sold"
  points_price: number
  donor_id: mongoose.Types.ObjectId
  verifier_id?: mongoose.Types.ObjectId
  buyer_id?: mongoose.Types.ObjectId
  rejection_reason?: string
  images: string[]
  created_at: Date
  updated_at: Date
}

const BookSchema = new Schema<IBook>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  author: {
    type: String,
    required: [true, "Author is required"],
    trim: true,
    maxlength: [100, "Author name cannot exceed 100 characters"],
  },
  isbn: {
    type: String,
    trim: true,
    match: [/^(?:\d{9}[\dX]|\d{13})$/, "Please enter a valid ISBN"],
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [100, "Subject cannot exceed 100 characters"],
  },
  mrp: {
    type: Number,
    required: [true, "MRP is required"],
    min: [1, "MRP must be at least 1"],
  },
  condition: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    required: [true, "Condition is required"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected", "sold"],
    default: "pending",
  },
  points_price: {
    type: Number,
    min: [1, "Points price must be at least 1"],
  },
  donor_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Donor ID is required"],
  },
  verifier_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  buyer_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  rejection_reason: {
    type: String,
    trim: true,
    maxlength: [500, "Rejection reason cannot exceed 500 characters"],
  },
  images: [
    {
      type: String,
      trim: true,
    },
  ],
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
BookSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

// Calculate points_price based on MRP before saving
BookSchema.pre("save", function (next) {
  // Always calculate points_price if not explicitly set or if MRP changed
  if (!this.points_price || this.isModified("mrp")) {
    this.points_price = Math.floor(this.mrp * 0.6) // 60% of MRP
  }
  next()
})

// Create indexes
BookSchema.index({ status: 1 })
BookSchema.index({ donor_id: 1 })
BookSchema.index({ subject: 1 })
BookSchema.index({ created_at: -1 })

export default mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema)
