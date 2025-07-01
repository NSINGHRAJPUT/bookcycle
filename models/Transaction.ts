import mongoose, { type Document, Schema } from "mongoose"

export interface ITransaction extends Document {
  type: "donation" | "purchase" | "points_purchase"
  user: mongoose.Types.ObjectId  // Changed from user_id for consistency
  book?: mongoose.Types.ObjectId  // Made optional for points_purchase
  amount: number  // Changed from points_amount for flexibility
  status: "pending" | "completed" | "failed"
  stripeSessionId?: string
  stripePaymentIntentId?: string
  description?: string
  metadata?: any
  created_at: Date
  updated_at: Date
}

const TransactionSchema = new Schema<ITransaction>({
  type: {
    type: String,
    enum: ["donation", "purchase", "points_purchase"],
    required: [true, "Transaction type is required"],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  book: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: function(this: ITransaction) {
      return this.type !== "points_purchase"
    },
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [1, "Amount must be at least 1"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  stripeSessionId: {
    type: String,
    sparse: true,
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true,
  },
  description: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
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

// Create indexes
TransactionSchema.index({ user: 1 })
TransactionSchema.index({ book: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ stripeSessionId: 1 })
TransactionSchema.index({ created_at: -1 })

// Update the updated_at field before saving
TransactionSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
