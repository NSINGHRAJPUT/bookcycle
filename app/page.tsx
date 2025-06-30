"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { BookOpen, Users, Award, Recycle, Search, ShoppingCart, Coins, LogIn } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser, getBooks, purchaseBook } from "@/lib/api"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [availableBooks, setAvailableBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  // Auto-refresh user data when coming back to the page
  useEffect(() => {
    const handleFocus = () => {
      loadData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    try {
      // Check if user is logged in (optional)
      try {
        const userData = await getCurrentUser()
        if (userData.user && !userData.error) {
          setUser(userData.user)
        }
      } catch (error) {
        // User not logged in, continue without user data
      }

      // Load available books
      const booksResponse = await getBooks({ status: "verified" })
      setAvailableBooks(booksResponse.books || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseClick = (book: any) => {
    if (!user) {
      setSelectedBook(book)
      setLoginDialogOpen(true)
      return
    }

    if (user.role !== "student") {
      alert("Only students can purchase books!")
      return
    }

    // Prevent users from purchasing their own donated books
    if (book.donor_id === user._id) {
      alert("You cannot purchase your own donated book!")
      return
    }

    setSelectedBook(book)
    setPurchaseDialogOpen(true)
  }

  const handlePurchase = async () => {
    if (!selectedBook || !user) return

    const pointsRequired = Math.round(selectedBook.mrp * 0.6)
    
    if (user.reward_points < pointsRequired) {
      alert("Insufficient reward points!")
      return
    }

    try {
      const response = await purchaseBook(selectedBook._id)
      if (response.error) {
        alert(response.error)
        return
      }

      alert("Book purchased successfully! Your points have been updated.")
      setPurchaseDialogOpen(false)
      setSelectedBook(null)
      
      // Refresh data to show updated points and book availability
      loadData()
    } catch (error) {
      console.error("Purchase error:", error)
      alert("Failed to purchase book")
    }
  }

  const filteredBooks = availableBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || book.subject === subjectFilter
    const matchesCondition = conditionFilter === "all" || book.condition === conditionFilter
    return matchesSearch && matchesSubject && matchesCondition
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Recycle className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">BookCycle</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">{user.reward_points || 0} Points</span>
                </div>
                <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                <Link href="/help">
                  <Button variant="ghost" size="sm">Help</Button>
                </Link>
                <Link href={user.role === 'student' ? '/dashboard/student' : user.role === 'manager' ? '/dashboard/manager' : '/dashboard/admin'}>
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/help">
                  <Button variant="ghost" size="sm">Help</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Smart Book Reuse & Reward Platform</h2>
          <p className="text-xl text-gray-600 mb-8">
            Donate your used books, earn reward points, and purchase verified books from other students. Creating a
            circular economy for academic books.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=student">
              <Button size="lg" className="w-full sm:w-auto">
                Join as Student
              </Button>
            </Link>
            <Link href="/auth/register?role=manager">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Join as Book Manager
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <BookOpen className="h-12 w-12 text-green-600 mb-2" />
              <CardTitle>Donate Books</CardTitle>
              <CardDescription>Upload your used books and earn 40% of MRP as reward points</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>Verified Quality</CardTitle>
              <CardDescription>All books are verified by trusted institutions and book managers</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-12 w-12 text-purple-600 mb-2" />
              <CardTitle>Reward Points</CardTitle>
              <CardDescription>Purchase books using points at 60% of MRP - no cash needed</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Recycle className="h-12 w-12 text-green-600 mb-2" />
              <CardTitle>Circular Economy</CardTitle>
              <CardDescription>Promote sustainability by giving books a second life</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Donate Your Books</h4>
              <p className="text-gray-600">Upload book details and images. Submit for verification.</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Get Verified</h4>
              <p className="text-gray-600">Book managers verify quality and authenticity.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Earn & Shop</h4>
              <p className="text-gray-600">Earn points and use them to buy other verified books.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Books Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Available Books</h3>
          <p className="text-gray-600 mb-8">Browse and purchase verified books from other students</p>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title, author, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="Literature">Literature</SelectItem>
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-600 mb-2">No books found</h4>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book._id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Book Image */}
                {book.images && book.images.length > 0 && (
                  <div className="relative h-48 w-full overflow-hidden">
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
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                  <CardDescription className="line-clamp-1">by {book.author}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{book.subject}</Badge>
                    <Badge variant={
                      book.condition === 'excellent' ? 'default' :
                      book.condition === 'good' ? 'secondary' : 'outline'
                    } className="text-xs capitalize">
                      {book.condition}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-gray-500 line-through">₹{book.mrp}</div>
                      <div className="font-bold text-lg text-green-600 flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {Math.round(book.mrp * 0.6)} Points
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handlePurchaseClick(book)}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase "{selectedBook?.title}" for {selectedBook ? Math.round(selectedBook.mrp * 0.6) : 0} points.
            </DialogDescription>
          </DialogHeader>
          {selectedBook && user && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span>Your Current Points:</span>
                <span className="font-bold text-green-600">{user.reward_points} Points</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span>Points Required:</span>
                <span className="font-bold text-blue-600">{Math.round(selectedBook.mrp * 0.6)} Points</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span>Points After Purchase:</span>
                <span className="font-bold text-green-600">
                  {user.reward_points - Math.round(selectedBook.mrp * 0.6)} Points
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase}>
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to login to purchase books. Please login or sign up to continue.
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Book: {selectedBook.title}</h4>
              <p className="text-sm text-gray-600 mb-2">by {selectedBook.author}</p>
              <div className="font-bold text-green-600 flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {Math.round(selectedBook.mrp * 0.6)} Points Required
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Link href={`/auth/login?redirect=home&bookId=${selectedBook?._id || ''}`}>
              <Button>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline">
                Sign Up
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Recycle className="h-6 w-6" />
            <span className="text-xl font-bold">BookCycle</span>
          </div>
          <p className="text-gray-400">Building a sustainable future for academic books, one donation at a time.</p>
        </div>
      </footer>
    </div>
  )
}
