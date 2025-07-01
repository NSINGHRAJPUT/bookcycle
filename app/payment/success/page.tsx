"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/api"

function PaymentSuccessContent() {
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      setError("No payment session found")
      setLoading(false)
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please login to continue")
        setLoading(false)
        return
      }

      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setPaymentDetails(data)
        setUser(data.user)
      } else {
        setError(data.error || "Payment verification failed")
      }
    } catch (err: any) {
      setError("Failed to verify payment")
      console.error("Payment verification error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToDashboard = () => {
    router.push("/dashboard/student")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-gray-600 text-center">
                Please wait while we confirm your payment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className={`text-2xl ${success ? 'text-green-600' : 'text-red-600'}`}>
            {success ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
          <CardDescription>
            {success 
              ? 'Your reward points have been added successfully' 
              : 'There was an issue processing your payment'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {success && paymentDetails && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Payment Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Points Added:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +{paymentDetails.pointsAdded} points
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>New Balance:</span>
                    <span className="font-semibold">{paymentDetails.newBalance} points</span>
                  </div>
                </div>
              </div>

              {user && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <p><strong>Account:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full"
              variant={success ? "default" : "outline"}
            >
              Go to Dashboard
            </Button>
            
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
