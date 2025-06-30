import mongoose, { type Document, Schema } from "mongoose"

export interface ITransaction extends Document {
  type: "donation" | "purchase"
  user_id: mongoose.Types.ObjectId
  book_id: mongoose.Types.ObjectId
  points_amount: number
  status: "pending" | "completed" | "failed"
  created_at: Date
}

const TransactionSchema = new Schema<ITransaction>({
  type: {
    type: String,
    enum: ["donation", "purchase"],
    required: [true, "Transaction type is required"],
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  book_id: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: [true, "Book ID is required"],
  },
  points_amount: {
    type: Number,
    required: [true, "Points amount is required"],
    min: [1, "Points amount must be at least 1"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

// Create indexes
TransactionSchema.index({ user_id: 1 })
TransactionSchema.index({ book_id: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ created_at: -1 })

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
