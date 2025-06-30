import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import SupportQuery from "@/models/SupportQuery"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    const { status, admin_response, priority } = await request.json()

    const update: any = {
      updated_at: new Date(),
      admin_id: decoded.userId
    }

    if (status) update.status = status
    if (admin_response) update.admin_response = admin_response
    if (priority) update.priority = priority

    if (status === "resolved") {
      update.resolved_at = new Date()
    }

    const query = await SupportQuery.findByIdAndUpdate(
      params.id,
      update,
      { new: true }
    )
    .populate('user_id', 'name email role')
    .populate('admin_id', 'name email')

    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 })
    }

    return NextResponse.json({ query })
  } catch (error: any) {
    console.error("Update support query error:", error)
    return NextResponse.json({ error: error.message || "Failed to update support query" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    const query = await SupportQuery.findByIdAndDelete(params.id)

    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Query deleted successfully" })
  } catch (error: any) {
    console.error("Delete support query error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete support query" }, { status: 500 })
  }
}
