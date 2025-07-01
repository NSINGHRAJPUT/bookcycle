"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, MapPin, Phone, Mail, Calendar, Award, 
  Edit, Save, ArrowLeft, CheckCircle, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api"
import AddressForm from "@/components/AddressForm"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser()
      if (userData.error || !userData.user) {
        router.push("/auth/login")
        return
      }
      setUser(userData.user)
    } catch (error) {
      console.error("Failed to load user data:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const handleAddressUpdated = (updatedUser: any) => {
    setUser(updatedUser)
    setAddressFormOpen(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800"
      case "manager": return "bg-blue-100 text-blue-800"
      case "student": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const isAddressComplete = () => {
    return user?.address?.line1 && user?.address?.city && user?.address?.state && user?.address?.postal_code && user?.phone
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span>Loading profile...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please login to view your profile.</p>
            <Link href="/auth/login">
              <Button>Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-600">Profile</h1>
                <p className="text-sm text-gray-600">Manage your account information</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/${user.role}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your account details and role information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <p className="text-lg">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Role</label>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Institution</label>
                <p className="text-lg">{user.institution || "Not specified"}</p>
              </div>
              
              {user.role === "student" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Reward Points</label>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <p className="text-lg font-semibold text-green-600">{user.reward_points || 0}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-lg">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                  {!isAddressComplete() && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  {isAddressComplete() && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Required for payment processing and compliance
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddressFormOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isAddressComplete() ? "Edit" : "Add"} Address
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAddressComplete() ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <div>
                      <p>{user.address.line1}</p>
                      {user.address.line2 && <p>{user.address.line2}</p>}
                      <p>{user.address.city}, {user.address.state}</p>
                      <p>{user.address.postal_code}, {user.address.country}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p>{user.phone}</p>
                    </div>
                  </div>
                </div>
                
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your address information is complete and ready for payment processing.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Address information is required for payment processing. Please add your address to enable purchases and payments.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Address Form Dialog */}
      <AddressForm
        user={user}
        open={addressFormOpen}
        onOpenChange={setAddressFormOpen}
        onAddressUpdated={handleAddressUpdated}
      />
    </div>
  )
}
