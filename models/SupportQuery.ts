import mongoose from "mongoose"

const SupportQuerySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Allow anonymous queries
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["technical", "account", "book_issues", "payments", "general", "complaint"],
    default: "general"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open"
  },
  admin_response: {
    type: String,
    default: ""
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  attachments: [{
    type: String // URLs to uploaded files
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  resolved_at: {
    type: Date
  }
})

SupportQuerySchema.pre('save', function(next) {
  this.updated_at = new Date()
  if (this.status === 'resolved' && !this.resolved_at) {
    this.resolved_at = new Date()
  }
  next()
})

export default mongoose.models.SupportQuery || mongoose.model("SupportQuery", SupportQuerySchema)
