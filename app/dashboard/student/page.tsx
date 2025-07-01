"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, Award, Plus, ShoppingCart, Bell, LogOut, 
  Clock, CheckCircle, XCircle, Search, Gift, History, 
  TrendingUp, BookMarked, Coins, CreditCard
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser, signOut, getBooks, purchaseBook } from "@/lib/api"
import AddressForm from "@/components/AddressForm"

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [availableBooks, setAvailableBooks] = useState<any[]>([])
  const [userDonations, setUserDonations] = useState<any[]>([])
  const [userPurchases, setUserPurchases] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [addPointsDialogOpen, setAddPointsDialogOpen] = useState(false)
  const [pointsToAdd, setPointsToAdd] = useState("")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      console.log("User data:", userData)
      if (userData.error || !userData.user || userData.user.role !== "student") {
        router.push("/auth/login")
        return
      }

      setUser(userData.user)

      // Load available books, user donations, and purchases
      const [booksResponse, donationsResponse, purchasesResponse] = await Promise.all([
        getBooks({ status: "verified" }),
        getBooks({ userId: userData.user._id }),
        getBooks({ buyerId: userData.user._id, status: "sold" }),
      ])

      console.log("Student Dashboard - Current User ID:", userData.user._id)
      console.log("Student Dashboard - User Donations Response:", donationsResponse)
      
      setAvailableBooks(booksResponse.books || [])
      setUserDonations(donationsResponse.books || [])
      setUserPurchases(purchasesResponse.books || [])
      
      // Mock notifications
      setNotifications([
        { id: 1, type: "success", message: "Your book 'Data Structures' has been verified and 120 points credited!", time: "2 hours ago" },
        { id: 2, type: "info", message: "New books available in Computer Science category", time: "1 day ago" },
        { id: 3, type: "warning", message: "Your book 'Physics Vol 1' is pending verification", time: "3 days ago" }
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      // router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handlePurchase = async (book: any) => {
    if (!user) return

    if (user.reward_points < Math.round(book.mrp * 0.6)) {
      alert("Insufficient reward points!")
      return
    }

    try {
      const response = await purchaseBook(book._id)
      if (response.error) {
        alert(response.error)
        return
      }
      
      alert("Book purchased successfully!")
      setSelectedBook(null)
      setPurchaseDialogOpen(false)
      loadData()
    } catch (error: any) {
      alert(error.message || "Purchase failed")
    }
  }

  const handleNavigateToDonate = () => {
    router.push("/dashboard/student/donate")
  }

  const handleAddPoints = async () => {
    if (!pointsToAdd || parseInt(pointsToAdd) <= 0 || parseInt(pointsToAdd) > 10000) {
      alert("Please enter a valid amount between 1 and 10000 points")
      return
    }

    // Check if user has address information (required for Indian export regulations)
    if (!user?.address?.line1 || !user?.address?.city || !user?.address?.state || !user?.address?.postal_code || !user?.phone) {
      alert("Address information is required for payment processing. Please update your profile first.")
      setAddPointsDialogOpen(false)
      setAddressFormOpen(true)
      return
    }

    setPaymentLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Please login to continue")
        return
      }

      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ points: parseInt(pointsToAdd) })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        alert(data.error || "Failed to create payment session")
      }
    } catch (error: any) {
      alert("Failed to create payment session")
      console.error("Payment error:", error)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleAddressUpdated = (updatedUser: any) => {
    setUser(updatedUser)
    // After address is updated, show the add points dialog again
    setAddressFormOpen(false)
    setAddPointsDialogOpen(true)
  }

  const filteredBooks = availableBooks.filter(book => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = book.title.toLowerCase().includes(searchLower) ||
                         book.author.toLowerCase().includes(searchLower)
    const matchesSubject = !subjectFilter || subjectFilter === "all" || book.subject === subjectFilter
    const matchesCondition = !conditionFilter || conditionFilter === "all" || book.condition === conditionFilter
    return matchesSearch && matchesSubject && matchesCondition
  })

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      verified: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      sold: "bg-blue-100 text-blue-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "verified": return <CheckCircle className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      case "sold": return <ShoppingCart className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span>Loading dashboard...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-600">BookCycle</h1>
                <p className="text-sm text-gray-600">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">{user?.reward_points || 0} Points</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">Profile</Button>
                </Link>
                <Link href="/help">
                  <Button variant="ghost" size="sm">Help</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{user?.reward_points || 0}</div>
              <p className="text-xs text-muted-foreground mb-3">Available to spend</p>
              <Button 
                size="sm" 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setAddPointsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Points
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Donated</CardTitle>
              <Gift className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{userDonations.length}</div>
              <p className="text-xs text-muted-foreground">
                {userDonations.filter(b => b.status === 'verified').length} verified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Purchased</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{userPurchases.length}</div>
              <p className="text-xs text-muted-foreground">Total acquisitions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {userDonations.filter(b => b.status === 'verified').length * 10}
              </div>
              <p className="text-xs text-muted-foreground">Environmental points</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <Alert key={notification.id}>
                    <AlertDescription className="flex justify-between items-start">
                      <span>{notification.message}</span>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse Books
            </TabsTrigger>
            <TabsTrigger value="donate" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Donate Book
            </TabsTrigger>
            <TabsTrigger value="my-donations" className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              My Donations
            </TabsTrigger>
            <TabsTrigger value="my-purchases" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Purchase History
            </TabsTrigger>
          </TabsList>

          {/* Browse Books Tab */}
          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Books</CardTitle>
                <CardDescription>Browse and purchase books using your reward points</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all-subjects" value="all">All Subjects</SelectItem>
                      <SelectItem key="computer-science" value="Computer Science">Computer Science</SelectItem>
                      <SelectItem key="mathematics" value="Mathematics">Mathematics</SelectItem>
                      <SelectItem key="physics" value="Physics">Physics</SelectItem>
                      <SelectItem key="chemistry" value="Chemistry">Chemistry</SelectItem>
                      <SelectItem key="biology" value="Biology">Biology</SelectItem>
                      <SelectItem key="literature" value="Literature">Literature</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="all-conditions" value="all">All Conditions</SelectItem>
                      <SelectItem key="excellent" value="excellent">Excellent</SelectItem>
                      <SelectItem key="good" value="good">Good</SelectItem>
                      <SelectItem key="fair" value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBooks.map((book) => (
                    <Card key={book._id} className="hover:shadow-lg transition-shadow">
                      {/* Book Image */}
                      {book.images && book.images.length > 0 && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <img
                            src={book.images[0]}
                            alt={`Cover of ${book.title}`}
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.jpg';
                            }}
                          />
                          {book.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              +{book.images.length - 1} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{book.title}</CardTitle>
                            <CardDescription>by {book.author}</CardDescription>
                          </div>
                          <Badge className={`${getStatusBadge(book.condition)} capitalize`}>
                            {book.condition}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subject:</span>
                            <span>{book.subject}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">MRP:</span>
                            <span>₹{book.mrp}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Price:</span>
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                {Math.round(book.mrp * 0.6)} points
                              </span>
                            </div>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              setSelectedBook(book)
                              setPurchaseDialogOpen(true)
                            }}
                            disabled={user?.reward_points < Math.round(book.mrp * 0.6)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {user?.reward_points < Math.round(book.mrp * 0.6) ? 'Insufficient Points' : 'Purchase'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredBooks.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No books found matching your criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Donate Book Tab */}
          <TabsContent value="donate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Donate a Book
                </CardTitle>
                <CardDescription>
                  Share your books with the community and earn reward points (40% of MRP)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to donate a book?</h3>
                  <p className="text-gray-600 mb-6">
                    Use our comprehensive donation form to add your book details, upload images, and submit for approval.
                  </p>
                  <Button onClick={handleNavigateToDonate} className="w-full max-w-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Book Donation
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">How it works:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Fill out book details and upload clear images</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Submit for manager review and verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Once approved, your book will be listed for sale</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Earn 40% of MRP as reward points when sold</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Donations Tab */}
          <TabsContent value="my-donations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Book Donations</CardTitle>
                <CardDescription>Track the status of your donated books</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Debug Information */}
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium">Debug Info:</p>
                  <p className="text-xs">Current User ID: {user?._id}</p>
                  <p className="text-xs">Total Donations Found: {userDonations.length}</p>
                  <p className="text-xs">Donation IDs: {userDonations.map(d => d._id).join(', ')}</p>
                </div>
                
                <div className="space-y-4">
                  {userDonations.map((book) => (
                    <Card key={book._id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          {/* Book Image */}
                          {book.images && book.images.length > 0 && (
                            <div className="flex-shrink-0">
                              <img
                                src={book.images[0]}
                                alt={`Cover of ${book.title}`}
                                className="h-24 w-18 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.jpg';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 flex justify-between items-start">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{book.title}</h3>
                              <p className="text-gray-600">by {book.author}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Subject: {book.subject}</span>
                                <span>MRP: ₹{book.mrp}</span>
                                <span>Condition: {book.condition}</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Submitted on {new Date(book.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`${getStatusBadge(book.status)} flex items-center gap-1`}>
                                {getStatusIcon(book.status)}
                                {book.status}
                              </Badge>
                              {book.status === 'verified' && (
                                <div className="text-sm text-green-600 font-medium">
                                  +{Math.round(book.mrp * 0.4)} points earned
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {userDonations.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">You haven't donated any books yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase History Tab */}
          <TabsContent value="my-purchases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>Books you've purchased with reward points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPurchases.map((book) => (
                    <Card key={book._id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          {/* Book Image */}
                          {book.images && book.images.length > 0 && (
                            <div className="flex-shrink-0">
                              <img
                                src={book.images[0]}
                                alt={`Cover of ${book.title}`}
                                className="h-24 w-18 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.jpg';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 flex justify-between items-start">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{book.title}</h3>
                              <p className="text-gray-600">by {book.author}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Subject: {book.subject}</span>
                                <span>Condition: {book.condition}</span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Purchased on {new Date(book.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                                <Coins className="h-4 w-4" />
                                {Math.round(book.mrp * 0.6)} points spent
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Purchased
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {userPurchases.length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">You haven't purchased any books yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase this book?
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">{selectedBook.title}</h3>
                <p className="text-gray-600">by {selectedBook.author}</p>
                <div className="flex justify-between items-center mt-2">
                  <span>Cost:</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {Math.round(selectedBook.mrp * 0.6)} points
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Balance:</span>
                <span>{user?.reward_points} points</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Balance After Purchase:</span>
                <span>{(user?.reward_points || 0) - Math.round(selectedBook.mrp * 0.6)} points</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handlePurchase(selectedBook)} className="flex-1">
                  Confirm Purchase
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Points Dialog */}
      <Dialog open={addPointsDialogOpen} onOpenChange={setAddPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reward Points</DialogTitle>
            <DialogDescription>
              Purchase reward points using Stripe payment. 1 Point = ₹1 INR
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Points to Add</label>
              <Input
                type="number"
                placeholder="Enter points (1-10000)"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                min="1"
                max="10000"
              />
              <p className="text-xs text-gray-500">
                Minimum: 1 point (₹1), Maximum: 10000 points (₹10,000)
              </p>
            </div>
            
            {pointsToAdd && parseInt(pointsToAdd) > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Points to Add:</span>
                  <span className="font-semibold text-green-600">+{pointsToAdd} points</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Amount to Pay:</span>
                  <span className="font-semibold text-blue-600">₹{pointsToAdd} INR</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Balance:</span>
                  <span className="text-sm font-medium">
                    {(user?.reward_points || 0) + parseInt(pointsToAdd)} points
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddPointsDialogOpen(false)
                  setPointsToAdd("")
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPoints} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={paymentLoading || !pointsToAdd || parseInt(pointsToAdd) <= 0}
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with Stripe
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
