import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Book from "@/models/Book"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    switch (type) {
      case "subjects":
        // Get unique subjects from books
        const subjects = await Book.distinct("subject")
        return NextResponse.json({ subjects: subjects.sort() })

      case "conditions":
        return NextResponse.json({ 
          conditions: ["excellent", "good", "fair", "poor"] 
        })

      case "book-stats":
        // Get book statistics
        const stats = await Book.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ])
        
        const statusCounts = {
          pending: 0,
          verified: 0,
          rejected: 0,
          sold: 0
        }
        
        stats.forEach(stat => {
          if (statusCounts.hasOwnProperty(stat._id)) {
            statusCounts[stat._id as keyof typeof statusCounts] = stat.count
          }
        })
        
        return NextResponse.json({ stats: statusCounts })

      default:
        return NextResponse.json({ 
          subjects: await Book.distinct("subject").then(subjects => subjects.sort()),
          conditions: ["excellent", "good", "fair", "poor"]
        })
    }
  } catch (error: any) {
    console.error("Get options error:", error)
    return NextResponse.json({ error: error.message || "Failed to get options" }, { status: 500 })
  }
}
