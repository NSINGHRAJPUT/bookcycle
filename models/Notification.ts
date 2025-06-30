import mongoose, { type Document, Schema } from "mongoose"

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId
  title: string
  message: string
  type: string
  read: boolean
  created_at: Date
}

const NotificationSchema = new Schema<INotification>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: [1000, "Message cannot exceed 1000 characters"],
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

// Create indexes
NotificationSchema.index({ user_id: 1 })
NotificationSchema.index({ read: 1 })
NotificationSchema.index({ created_at: -1 })

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)
