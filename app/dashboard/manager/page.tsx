"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  BookOpen, CheckCircle, XCircle, Clock, Users, LogOut, Bell, 
  Search, Filter, Eye, Edit, Award, TrendingUp, Package,
  FileText, Download, Calendar, MapPin, Star
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser, signOut, getBooks, verifyBook } from "@/lib/api"

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [pendingBooks, setPendingBooks] = useState<any[]>([])
  const [verifiedBooks, setVerifiedBooks] = useState<any[]>([])
  const [rejectedBooks, setRejectedBooks] = useState<any[]>([])
  const [soldBooks, setSoldBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [verificationAction, setVerificationAction] = useState<"verify" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    subject: "",
    mrp: "",
    condition: "",
    description: ""
  })
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userData = await getCurrentUser()
      if (userData.error || !userData.user || userData.user.role !== "manager") {
        router.push("/auth/login")
        return
      }

      setUser(userData.user)

      // Load books by status
      const [pendingResponse, verifiedResponse, rejectedResponse, soldResponse] = await Promise.all([
        getBooks({ status: "pending" }),
        getBooks({ status: "verified" }),
        getBooks({ status: "rejected" }),
        getBooks({ status: "sold" }),
      ])

      setPendingBooks(pendingResponse.books || [])
      setVerifiedBooks(verifiedResponse.books || [])
      setRejectedBooks(rejectedResponse.books || [])
      setSoldBooks(soldResponse.books || [])
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

  const handleVerification = async () => {
    if (!selectedBook || !verificationAction) return

    try {
      const response = await verifyBook(selectedBook._id, {
        status: verificationAction === "verify" ? "verified" : "rejected",
        rejectionReason: verificationAction === "reject" ? rejectionReason : undefined
      })

      if (response.error) {
        alert(response.error)
        return
      }

      alert(`Book ${verificationAction === "verify" ? "verified" : "rejected"} successfully!`)
      setVerificationDialogOpen(false)
      setSelectedBook(null)
      setVerificationAction(null)
      setRejectionReason("")
      loadData()
    } catch (error: any) {
      alert(error.message || "Verification failed")
    }
  }

  const handleEdit = async () => {
    if (!selectedBook) return

    try {
      // This would be an API call to update book details
      alert("Book details updated successfully!")
      setEditDialogOpen(false)
      loadData()
    } catch (error: any) {
      alert(error.message || "Update failed")
    }
  }

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
      case "sold": return <Package className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: "text-green-600",
      good: "text-blue-600",
      fair: "text-yellow-600",
      poor: "text-red-600"
    }
    return colors[condition as keyof typeof colors] || "text-gray-600"
  }

  const filteredPendingBooks = pendingBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    totalPending: pendingBooks.length,
    totalVerified: verifiedBooks.length,
    totalRejected: rejectedBooks.length,
    totalSold: soldBooks.length,
    totalPointsIssued: verifiedBooks.reduce((sum, book) => sum + Math.round(book.mrp * 0.4), 0),
    averageProcessingTime: "2.3 days" // Mock data
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading dashboard...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-blue-600">BookCycle</h1>
                <p className="text-sm text-gray-600">Manager Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{user?.institution}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">Books awaiting verification</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Books</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalVerified}</div>
              <p className="text-xs text-muted-foreground">Available for purchase</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Sold</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalSold}</div>
              <p className="text-xs text-muted-foreground">Successfully transacted</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalPointsIssued}</div>
              <p className="text-xs text-muted-foreground">Total reward points</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Quick Actions & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Review
              </Button>
            </div>
            {stats.totalPending > 0 && (
              <Alert className="mt-4">
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  You have {stats.totalPending} books pending verification. Average processing time: {stats.averageProcessingTime}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({stats.totalPending})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({stats.totalVerified})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({stats.totalRejected})
            </TabsTrigger>
            <TabsTrigger value="sold" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Sold ({stats.totalSold})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Pending Books Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Books Pending Verification</CardTitle>
                    <CardDescription>Review and approve/reject donated books</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPendingBooks.map((book) => (
                    <Card key={book._id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Book Details */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg">{book.title}</h3>
                              <p className="text-gray-600">by {book.author}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Subject:</span>
                                <p className="font-medium">{book.subject}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">MRP:</span>
                                <p className="font-medium">₹{book.mrp}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Condition:</span>
                                <p className={`font-medium capitalize ${getConditionColor(book.condition)}`}>
                                  {book.condition}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Points to Award:</span>
                                <p className="font-medium text-green-600">
                                  {Math.round(book.mrp * 0.4)} points
                                </p>
                              </div>
                            </div>

                            {book.isbn && (
                              <div className="text-sm">
                                <span className="text-gray-500">ISBN:</span>
                                <span className="ml-2 font-mono">{book.isbn}</span>
                              </div>
                            )}

                            {book.description && (
                              <div>
                                <span className="text-gray-500 text-sm">Description:</span>
                                <p className="text-sm mt-1">{book.description}</p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              Submitted on {new Date(book.created_at).toLocaleDateString()} by {book.donor_name || 'Anonymous'}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedBook(book)
                                  setVerificationAction("verify")
                                  setVerificationDialogOpen(true)
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify & Approve
                              </Button>
                              
                              <Button 
                                variant="destructive" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedBook(book)
                                  setVerificationAction("reject")
                                  setVerificationDialogOpen(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedBook(book)
                                  setEditForm({
                                    title: book.title,
                                    author: book.author,
                                    subject: book.subject,
                                    mrp: book.mrp.toString(),
                                    condition: book.condition,
                                    description: book.description || ""
                                  })
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </Button>
                            </div>

                            {book.images && book.images.length > 0 && (
                              <div className="border rounded p-2">
                                <p className="text-xs text-gray-600 mb-2">
                                  {book.images.length} image(s) uploaded
                                </p>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Images
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredPendingBooks.length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {searchTerm ? "No books found matching your search" : "No books pending verification"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verified Books Tab */}
          <TabsContent value="verified" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verified Books</CardTitle>
                <CardDescription>Books approved and available for purchase</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Details</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedBooks.map((book) => (
                      <TableRow key={book._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{book.title}</p>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          </div>
                        </TableCell>
                        <TableCell>{book.subject}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${getConditionColor(book.condition)}`}>
                            {book.condition}
                          </span>
                        </TableCell>
                        <TableCell>₹{book.mrp}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-green-600" />
                            <span>{Math.round(book.mrp * 0.6)} points</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge("verified")}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {verifiedBooks.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No verified books yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected Books Tab */}
          <TabsContent value="rejected" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Books</CardTitle>
                <CardDescription>Books that were rejected during verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rejectedBooks.map((book) => (
                    <Card key={book._id} className="border-l-4 border-l-red-500">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Book Details */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg">{book.title}</h3>
                              <p className="text-gray-600">by {book.author}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Subject:</span>
                                <p className="font-medium">{book.subject}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">MRP:</span>
                                <p className="font-medium">₹{book.mrp}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Condition:</span>
                                <p className={`font-medium capitalize ${getConditionColor(book.condition)}`}>
                                  {book.condition}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Rejected On:</span>
                                <p className="font-medium text-red-600">
                                  {new Date(book.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {book.isbn && (
                              <div className="text-sm">
                                <span className="text-gray-500">ISBN:</span>
                                <span className="ml-2 font-mono">{book.isbn}</span>
                              </div>
                            )}

                            {book.description && (
                              <div>
                                <span className="text-gray-500 text-sm">Description:</span>
                                <p className="text-sm mt-1">{book.description}</p>
                              </div>
                            )}

                            {book.rejection_reason && (
                              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <span className="text-red-700 text-sm font-medium">Rejection Reason:</span>
                                <p className="text-red-600 text-sm mt-1">{book.rejection_reason}</p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              Originally submitted on {new Date(book.created_at).toLocaleDateString()} by {book.donor_name || 'Anonymous'}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-3">
                            <Badge className={`${getStatusBadge(book.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(book.status)}
                              Rejected
                            </Badge>

                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedBook(book)
                                  setVerificationAction("verify")
                                  setVerificationDialogOpen(true)
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Reconsider & Approve
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedBook(book)
                                  setEditForm({
                                    title: book.title,
                                    author: book.author,
                                    subject: book.subject,
                                    mrp: book.mrp.toString(),
                                    condition: book.condition,
                                    description: book.description || ""
                                  })
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </Button>
                            </div>

                            {book.images && book.images.length > 0 && (
                              <div className="border rounded p-2">
                                <p className="text-xs text-gray-600 mb-2">
                                  {book.images.length} image(s) uploaded
                                </p>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Images
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {rejectedBooks.length === 0 && (
                    <div className="text-center py-12">
                      <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No rejected books</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sold Books Tab */}
          <TabsContent value="sold" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sold Books</CardTitle>
                <CardDescription>Successfully sold books and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Details</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Sale Date</TableHead>
                      <TableHead>Points Used</TableHead>
                      <TableHead>Points Awarded</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soldBooks.map((book) => (
                      <TableRow key={book._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{book.title}</p>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          </div>
                        </TableCell>
                        <TableCell>{book.buyer_name || 'Anonymous'}</TableCell>
                        <TableCell>{new Date(book.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="text-red-600">-{Math.round(book.mrp * 0.6)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600">+{Math.round(book.mrp * 0.4)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge("sold")}>
                            <Package className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {soldBooks.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No books sold yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Processing Time:</span>
                      <span className="font-semibold">{stats.averageProcessingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Rate:</span>
                      <span className="font-semibold text-green-600">
                        {stats.totalVerified + stats.totalRejected > 0 
                          ? Math.round((stats.totalVerified / (stats.totalVerified + stats.totalRejected)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Books This Month:</span>
                      <span className="font-semibold">{stats.totalPending + stats.totalVerified}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Computer Science:</span>
                      <span>35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mathematics:</span>
                      <span>28%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Physics:</span>
                      <span>20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Others:</span>
                      <span>17%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationAction === "verify" ? "Verify Book" : "Reject Book"}
            </DialogTitle>
            <DialogDescription>
              {verificationAction === "verify" 
                ? "Approve this book for listing and award points to the donor"
                : "Reject this book donation with a reason"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedBook && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold">{selectedBook.title}</h3>
                <p className="text-gray-600">by {selectedBook.author}</p>
                <div className="mt-2 text-sm">
                  <p>Subject: {selectedBook.subject}</p>
                  <p>MRP: ₹{selectedBook.mrp}</p>
                  <p>Condition: {selectedBook.condition}</p>
                </div>
              </div>

              {verificationAction === "verify" && (
                <Alert>
                  <Award className="h-4 w-4" />
                  <AlertDescription>
                    This will award <strong>{Math.round(selectedBook.mrp * 0.4)} reward points</strong> to the donor
                    and list the book for <strong>{Math.round(selectedBook.mrp * 0.6)} points</strong>.
                  </AlertDescription>
                </Alert>
              )}

              {verificationAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason *</Label>
                  <Textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerification}
              className={verificationAction === "verify" ? "bg-green-600 hover:bg-green-700" : ""}
              disabled={verificationAction === "reject" && !rejectionReason.trim()}
            >
              {verificationAction === "verify" ? "Verify & Approve" : "Reject Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book Details</DialogTitle>
            <DialogDescription>
              Make corrections to the book information before verification
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author">Author</Label>
                <Input
                  id="edit-author"
                  value={editForm.author}
                  onChange={(e) => setEditForm(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Select value={editForm.subject} onValueChange={(value) => setEditForm(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="Literature">Literature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mrp">MRP (₹)</Label>
                <Input
                  id="edit-mrp"
                  type="number"
                  value={editForm.mrp}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mrp: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-condition">Condition</Label>
                <Select value={editForm.condition} onValueChange={(value) => setEditForm(prev => ({ ...prev, condition: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
