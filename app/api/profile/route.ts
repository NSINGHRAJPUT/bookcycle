import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData = await request.json()
    
    // Allow only specific fields to be updated by the user themselves
    const allowedFields = ['address', 'phone', 'institution']
    const filteredUpdate: any = { updated_at: new Date() }
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field]
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      filteredUpdate,
      { new: true, select: "-password" }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    })

  } catch (error: any) {
    console.error("Update profile error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to update profile" 
    }, { status: 500 })
  }
}
