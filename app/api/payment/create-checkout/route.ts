import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { verifyToken } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

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

    await connectDB()
    
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Only students can add reward points" }, { status: 403 })
    }

    // Check if user has address information (required for Indian export regulations)
    if (!user.address?.line1 || !user.address?.city || !user.address?.state || !user.address?.postal_code || !user.phone) {
      return NextResponse.json({ 
        error: "Address information is required for payment processing. Please update your profile first.",
        requiresAddress: true
      }, { status: 400 })
    }

    const { points } = await request.json()
    
    if (!points || points <= 0 || points > 10000) {
      return NextResponse.json({ 
        error: "Invalid points amount. Must be between 1 and 10000." 
      }, { status: 400 })
    }

    // Convert points to INR (1 point = 1 INR)
    const amountInRupees = points
    const amountInPaise = amountInRupees * 100 // Stripe uses smallest currency unit

    try {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `BookCycle Reward Points`,
                description: `Add ${points} reward points to your account`,
              },
              unit_amount: amountInPaise,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/student?payment=cancelled`,
        metadata: {
          userId: user._id.toString(),
          points: points.toString(),
          type: 'reward_points'
        },
        customer_email: user.email,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['IN']
        },
        customer_creation: 'always',
        phone_number_collection: {
          enabled: true
        },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `BookCycle Reward Points Purchase - ${points} points`,
            custom_fields: [
              {
                name: "Customer Address",
                value: `${user.address.line1}, ${user.address.line2 ? user.address.line2 + ', ' : ''}${user.address.city}, ${user.address.state} - ${user.address.postal_code}`
              },
              {
                name: "Customer Phone",
                value: user.phone
              }
            ],
            metadata: {
              customer_name: user.name,
              customer_email: user.email,
              customer_phone: user.phone,
              customer_address: JSON.stringify(user.address),
              points_purchased: points.toString(),
              transaction_type: 'reward_points_purchase'
            }
          }
        }
      })

      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url 
      })
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError)
      return NextResponse.json({ 
        error: "Failed to create payment session" 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Create payment session error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to create payment session" 
    }, { status: 500 })
  }
}
