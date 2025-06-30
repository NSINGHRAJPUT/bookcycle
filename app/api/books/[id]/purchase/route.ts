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

    // Get the book
    const book = await Book.findOne({
      _id: params.id,
      status: "verified",
    })
    if (!book) {
      return NextResponse.json({ error: "Book not found or not available" }, { status: 404 })
    }

    // Get the buyer
    const buyer = await User.findById(decoded.userId)
    if (!buyer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (buyer.reward_points < book.points_price) {
      return NextResponse.json({ error: "Insufficient reward points" }, { status: 400 })
    }

    // Update book status and buyer
    book.status = "sold"
    book.buyer_id = decoded.userId
    await book.save()

    // Deduct points from buyer
    buyer.reward_points -= book.points_price
    await buyer.save()

    // Create transaction record
    const transaction = new Transaction({
      type: "purchase",
      user_id: decoded.userId,
      book_id: params.id,
      points_amount: book.points_price,
      status: "completed",
    })
    await transaction.save()

    // Create notification for buyer
    const notification = new Notification({
      user_id: decoded.userId,
      title: "Purchase Successful!",
      message: `You successfully purchased "${book.title}" for ${book.points_price} points.`,
      type: "book_purchased",
      read: false,
    })
    await notification.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Purchase book error:", error)
    return NextResponse.json({ error: error.message || "Failed to purchase book" }, { status: 500 })
  }
}
