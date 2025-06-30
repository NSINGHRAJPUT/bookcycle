import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Book from "@/models/Book"
import User from "@/models/User"
import Notification from "@/models/Notification"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const buyerId = searchParams.get("buyerId")
    const subject = searchParams.get("subject")
    const condition = searchParams.get("condition")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const query: any = {}

    if (status) {
      query.status = status
    }

    if (userId) {
      query.donor_id = userId
    }

    if (buyerId) {
      query.buyer_id = buyerId
    }

    if (subject) {
      query.subject = subject
    }

    if (condition) {
      query.condition = condition
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } }
      ]
    }

    const skip = (page - 1) * limit
    const books = await Book.find(query)
      .populate("donor_id", "name email")
      .populate("verifier_id", "name email")
      .populate("buyer_id", "name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
 
    const total = await Book.countDocuments(query)

    return NextResponse.json({ 
      books, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Get books error:", error)
    return NextResponse.json({ error: error.message || "Failed to get books" }, { status: 500 })
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
    const { title, author, isbn, subject, mrp, condition, description, images } = body

    // Validate required fields
    if (!title || !author || !subject || !mrp || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const book = new Book({
      title,
      author,
      isbn,
      subject,
      mrp: Number(mrp),
      condition,
      description,
      images: images || [],
      donor_id: decoded.userId,
    })

    const savedBook = await book.save()

    // Create notifications for managers
    await createNotificationForManagers(
      "New Book Donation",
      `A new book "${title}" has been submitted for verification.`,
      "book_donation",
    )

    return NextResponse.json({ book: savedBook })
  } catch (error: any) {
    console.error("Create book error:", error)
    return NextResponse.json({ error: error.message || "Failed to create book" }, { status: 500 })
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    // Get current user to check permissions
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const book = await Book.findById(id)
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Check permissions: only manager/admin can update, or donor for their own pending books
    if (user.role === "student" && (book.donor_id.toString() !== decoded.userId || book.status !== "pending")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { title, author, isbn, subject, mrp, condition, description, images } = updateData

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(author && { author }),
        ...(isbn && { isbn }),
        ...(subject && { subject }),
        ...(mrp && { mrp: Number(mrp) }),
        ...(condition && { condition }),
        ...(description && { description }),
        ...(images && { images }),
        updated_at: new Date()
      },
      { new: true }
    ).populate("donor_id", "name email")
     .populate("verifier_id", "name email")
     .populate("buyer_id", "name email")

    return NextResponse.json({ book: updatedBook })
  } catch (error: any) {
    console.error("Update book error:", error)
    return NextResponse.json({ error: error.message || "Failed to update book" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    // Get current user to check permissions
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const book = await Book.findById(id)
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Check permissions: only admin can delete, or donor for their own pending books
    if (user.role !== "admin" && (user.role === "student" && (book.donor_id.toString() !== decoded.userId || book.status !== "pending"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await Book.findByIdAndDelete(id)

    return NextResponse.json({ message: "Book deleted successfully" })
  } catch (error: any) {
    console.error("Delete book error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete book" }, { status: 500 })
  }
}

async function createNotificationForManagers(title: string, message: string, type: string) {
  try {
    await connectDB()

    // Get all managers
    const managers = await User.find({ role: "manager" })

    if (managers.length > 0) {
      const notifications = managers.map((manager) => ({
        user_id: manager._id,
        title,
        message,
        type,
        read: false,
      }))

      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error("Error creating notifications:", error)
  }
}
