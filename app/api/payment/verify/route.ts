import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Transaction from "@/models/Transaction"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
})

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

    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    await connectDB()
    
    try {
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (!session) {
        return NextResponse.json({ error: "Invalid session" }, { status: 400 })
      }

      // Check if payment was successful
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ 
          error: "Payment not completed", 
          status: session.payment_status 
        }, { status: 400 })
      }

      // Verify that the session belongs to the authenticated user
      if (session.metadata?.userId !== decoded.userId) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
      }

      const user = await User.findById(decoded.userId)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const pointsToAdd = parseInt(session.metadata?.points || '0')
      if (pointsToAdd <= 0) {
        return NextResponse.json({ error: "Invalid points amount" }, { status: 400 })
      }

      // Check if this payment has already been processed
      const existingTransaction = await Transaction.findOne({
        stripeSessionId: sessionId,
        type: 'points_purchase'
      })

      if (existingTransaction) {
        return NextResponse.json({ 
          message: "Payment already processed",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            reward_points: user.reward_points
          }
        })
      }

      // Add points to user account
      user.reward_points = (user.reward_points || 0) + pointsToAdd
      await user.save()

      // Create transaction record
      const transaction = new Transaction({
        user: user._id,
        type: 'points_purchase',
        amount: pointsToAdd,
        status: 'completed',
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent,
        description: `Added ${pointsToAdd} reward points via Stripe payment`,
        metadata: {
          pointsAdded: pointsToAdd,
          amountPaid: session.amount_total / 100, // Convert from paise to rupees
          currency: session.currency
        }
      })
      
      await transaction.save()

      return NextResponse.json({
        message: "Points added successfully",
        pointsAdded: pointsToAdd,
        newBalance: user.reward_points,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          reward_points: user.reward_points
        }
      })

    } catch (stripeError: any) {
      console.error("Stripe verification error:", stripeError)
      return NextResponse.json({ 
        error: "Failed to verify payment" 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to verify payment" 
    }, { status: 500 })
  }
}
