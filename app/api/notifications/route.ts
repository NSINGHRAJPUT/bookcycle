import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Notification from "@/models/Notification"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const query: any = { user_id: decoded.userId }
    if (unreadOnly) {
      query.read = false
    }

    const skip = (page - 1) * limit
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Notification.countDocuments(query)
    const unreadCount = await Notification.countDocuments({ user_id: decoded.userId, read: false })

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: error.message || "Failed to get notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { title, message, type, userIds } = body

    // Check if user is admin or manager to send notifications to others
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "manager" && userIds)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const notifications = []

    if (userIds && Array.isArray(userIds)) {
      // Send to specific users
      for (const userId of userIds) {
        notifications.push({
          user_id: userId,
          title,
          message,
          type: type || "info",
          read: false
        })
      }
    } else {
      // Send to self
      notifications.push({
        user_id: decoded.userId,
        title,
        message,
        type: type || "info",
        read: false
      })
    }

    const savedNotifications = await Notification.insertMany(notifications)

    return NextResponse.json({ notifications: savedNotifications })
  } catch (error: any) {
    console.error("Create notification error:", error)
    return NextResponse.json({ error: error.message || "Failed to create notification" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { id, read } = body

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    const notification = await Notification.findOne({
      _id: id,
      user_id: decoded.userId
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { read: read !== undefined ? read : true },
      { new: true }
    )

    return NextResponse.json({ notification: updatedNotification })
  } catch (error: any) {
    console.error("Update notification error:", error)
    return NextResponse.json({ error: error.message || "Failed to update notification" }, { status: 500 })
  }
}
