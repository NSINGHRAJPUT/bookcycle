import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// This would typically be stored in a database table, but for simplicity we'll use a simple config
const defaultRewardSettings = {
  donationRewardPercentage: 40, // 40% of MRP
  purchasePricePercentage: 60,  // 60% of MRP
  minimumPointsForPurchase: 10,
  pointsExpiryDays: 365,
  bonusPointsForNewUser: 50
}

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

    // Check if user is admin
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    // In a real app, you'd fetch from a settings table
    // For now, return default settings
    return NextResponse.json({ settings: defaultRewardSettings })
  } catch (error: any) {
    console.error("Get reward settings error:", error)
    return NextResponse.json({ error: error.message || "Failed to get reward settings" }, { status: 500 })
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { 
      donationRewardPercentage, 
      purchasePricePercentage, 
      minimumPointsForPurchase, 
      pointsExpiryDays, 
      bonusPointsForNewUser 
    } = body

    // Validate the settings
    if (donationRewardPercentage && (donationRewardPercentage < 0 || donationRewardPercentage > 100)) {
      return NextResponse.json({ error: "Donation reward percentage must be between 0 and 100" }, { status: 400 })
    }

    if (purchasePricePercentage && (purchasePricePercentage < 0 || purchasePricePercentage > 100)) {
      return NextResponse.json({ error: "Purchase price percentage must be between 0 and 100" }, { status: 400 })
    }

    // In a real app, you'd update a settings table
    // For now, just return the updated settings
    const updatedSettings = {
      ...defaultRewardSettings,
      ...(donationRewardPercentage !== undefined && { donationRewardPercentage }),
      ...(purchasePricePercentage !== undefined && { purchasePricePercentage }),
      ...(minimumPointsForPurchase !== undefined && { minimumPointsForPurchase }),
      ...(pointsExpiryDays !== undefined && { pointsExpiryDays }),
      ...(bonusPointsForNewUser !== undefined && { bonusPointsForNewUser })
    }

    return NextResponse.json({ settings: updatedSettings })
  } catch (error: any) {
    console.error("Update reward settings error:", error)
    return NextResponse.json({ error: error.message || "Failed to update reward settings" }, { status: 500 })
  }
}
