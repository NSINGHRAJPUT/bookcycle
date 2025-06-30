import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Book from "@/models/Book"
import Transaction from "@/models/Transaction"
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

    // Check if user is admin
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectDB()

    // Get overall statistics
    const [
      totalUsers,
      totalStudents,
      totalManagers,
      totalBooks,
      pendingBooks,
      verifiedBooks,
      soldBooks,
      rejectedBooks,
      totalTransactions,
      totalPointsAwarded,
      totalPointsSpent
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "manager" }),
      Book.countDocuments(),
      Book.countDocuments({ status: "pending" }),
      Book.countDocuments({ status: "verified" }),
      Book.countDocuments({ status: "sold" }),
      Book.countDocuments({ status: "rejected" }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { type: "donation" } },
        { $group: { _id: null, total: { $sum: "$points" } } }
      ]).then(result => result[0]?.total || 0),
      Transaction.aggregate([
        { $match: { type: "purchase" } },
        { $group: { _id: null, total: { $sum: "$points" } } }
      ]).then(result => result[0]?.total || 0)
    ])

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      recentUsers,
      recentBooks,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      Book.countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      Transaction.countDocuments({ created_at: { $gte: sevenDaysAgo } })
    ])

    // Get book statistics by subject
    const booksBySubject = await Book.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Get book statistics by status over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const booksTrend = await Book.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ])

    // Get top students by points
    const topStudents = await User.find({ role: "student" })
      .sort({ reward_points: -1 })
      .limit(10)
      .select("name email reward_points")

    return NextResponse.json({
      overview: {
        totalUsers,
        totalStudents,
        totalManagers,
        totalBooks,
        pendingBooks,
        verifiedBooks,
        soldBooks,
        rejectedBooks,
        totalTransactions,
        totalPointsAwarded,
        totalPointsSpent
      },
      recent: {
        recentUsers,
        recentBooks,
        recentTransactions
      },
      analytics: {
        booksBySubject,
        booksTrend,
        topStudents
      }
    })
  } catch (error: any) {
    console.error("Get admin stats error:", error)
    return NextResponse.json({ error: error.message || "Failed to get admin stats" }, { status: 500 })
  }
}
