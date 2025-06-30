import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
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
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const query: any = {}

    // Check permissions
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userId) {
      // Admin can see all users' transactions, users can see their own
      if (currentUser.role !== "admin" && decoded.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      query.user_id = userId
    } else if (currentUser.role !== "admin") {
      // Non-admin users can only see their own transactions
      query.user_id = decoded.userId
    }

    if (type) {
      query.type = type
    }

    const skip = (page - 1) * limit
    const transactions = await Transaction.find(query)
      .populate("user_id", "name email")
      .populate("book_id", "title author")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Transaction.countDocuments(query)

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: error.message || "Failed to get transactions" }, { status: 500 })
  }
}
