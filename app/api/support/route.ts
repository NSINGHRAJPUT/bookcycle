import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import SupportQuery from "@/models/SupportQuery"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const priority = searchParams.get("priority")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Admin or authenticated user request
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      
      if (decoded) {
        const user = await User.findById(decoded.userId)
        
        if (user?.role === "admin") {
          // Admin can see all queries
          const query: any = {}
          
          if (status) query.status = status
          if (category) query.category = category
          if (priority) query.priority = priority

          const queries = await SupportQuery.find(query)
            .populate('user_id', 'name email role')
            .populate('admin_id', 'name email')
            .sort({ created_at: -1 })

          return NextResponse.json({ queries })
        } else {
          // Regular user can only see their own queries
          const queries = await SupportQuery.find({ user_id: decoded.userId })
            .populate('admin_id', 'name email')
            .sort({ created_at: -1 })

          return NextResponse.json({ queries })
        }
      }
    }

    // No authentication - return empty array
    return NextResponse.json({ queries: [] })
  } catch (error: any) {
    console.error("Get support queries error:", error)
    return NextResponse.json({ error: error.message || "Failed to get support queries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { name, email, subject, message, category, priority } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    let user_id = null

    // Check if user is authenticated
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (decoded) {
        user_id = decoded.userId
      }
    }

    const supportQuery = new SupportQuery({
      user_id,
      name,
      email,
      subject,
      message,
      category: category || "general",
      priority: priority || "medium"
    })

    await supportQuery.save()

    const populatedQuery = await SupportQuery.findById(supportQuery._id)
      .populate('user_id', 'name email role')

    return NextResponse.json({ query: populatedQuery })
  } catch (error: any) {
    console.error("Create support query error:", error)
    return NextResponse.json({ error: error.message || "Failed to create support query" }, { status: 500 })
  }
}
