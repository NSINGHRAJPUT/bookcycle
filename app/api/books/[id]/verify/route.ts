import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Book from "@/models/Book"
import User from "@/models/User"
import Transaction from "@/models/Transaction"
import Notification from "@/models/Notification"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { approved, reason } = body

    // Get the book
    const book = await Book.findById(params.id).populate("donor_id")
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const newStatus = approved ? "verified" : "rejected"

    // Update book status
    book.status = newStatus
    book.verifier_id = decoded.userId
    if (!approved && reason) {
      book.rejection_reason = reason
    }
    await book.save()

    if (approved) {
      // Award points to donor (40% of MRP)
      const pointsToAward = Math.floor(book.mrp * 0.4)

      await User.findByIdAndUpdate(book.donor_id, { $inc: { reward_points: pointsToAward } })

      // Create transaction record
      const transaction = new Transaction({
        type: "donation",
        user_id: book.donor_id,
        book_id: params.id,
        points_amount: pointsToAward,
        status: "completed",
      })
      await transaction.save()

      // Create notification for donor
      const notification = new Notification({
        user_id: book.donor_id,
        title: "Book Approved!",
        message: `Your book "${book.title}" has been approved! You earned ${pointsToAward} reward points.`,
        type: "book_approved",
        read: false,
      })
      await notification.save()
    } else {
      // Create notification for donor
      const rejectionMessage = reason 
        ? `Your book "${book.title}" was not approved for listing. Reason: ${reason}. Please check the quality guidelines and try again.`
        : `Your book "${book.title}" was not approved for listing. Please check the quality guidelines and try again.`
      
      const notification = new Notification({
        user_id: book.donor_id,
        title: "Book Rejected",
        message: rejectionMessage,
        type: "book_rejected",
        read: false,
      })
      await notification.save()
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Verify book error:", error)
    return NextResponse.json({ error: error.message || "Failed to verify book" }, { status: 500 })
  }
}
