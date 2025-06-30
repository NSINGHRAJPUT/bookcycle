"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  HelpCircle, Mail, Phone, Clock, CheckCircle, 
  MessageSquare, BookOpen, CreditCard, Settings,
  AlertTriangle, Info, ArrowLeft, Send
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser, createSupportQuery, getSupportQueries } from "@/lib/api"

export default function HelpSupportPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [myQueries, setMyQueries] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
    priority: "medium"
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser()
      if (response.user && !response.error) {
        setUser(response.user)
        setFormData(prev => ({
          ...prev,
          name: response.user.name || "",
          email: response.user.email || ""
        }))
        
        // Load user's support queries
        const queriesResponse = await getSupportQueries()
        setMyQueries(queriesResponse.queries || [])
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await createSupportQuery({
        ...formData,
        category: formData.category as "technical" | "account" | "book_issues" | "payments" | "general" | "complaint",
        priority: formData.priority as "low" | "medium" | "high" | "urgent"
      })
      if (response.query) {
        setShowSuccess(true)
        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          subject: "",
          message: "",
          category: "general",
          priority: "medium"
        })
        
        // Refresh queries if user is logged in
        if (user) {
          const queriesResponse = await getSupportQueries()
          setMyQueries(queriesResponse.queries || [])
        }
        
        setTimeout(() => setShowSuccess(false), 5000)
      }
    } catch (error: any) {
      alert(error.message || "Failed to submit query")
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive"
      case "high": return "destructive"
      case "medium": return "secondary"
      case "low": return "outline"
      default: return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "default"
      case "in_progress": return "secondary"
      case "open": return "outline"
      case "closed": return "destructive"
      default: return "outline"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <HelpCircle className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-blue-600">Help & Support</h1>
                <p className="text-sm text-gray-600">We're here to help you</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                <Link href={user.role === 'student' ? '/dashboard/student' : user.role === 'manager' ? '/dashboard/manager' : '/dashboard/admin'}>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {showSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your support query has been submitted successfully! We'll get back to you within 24-48 hours.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="contact" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            {user && <TabsTrigger value="my-queries">My Queries</TabsTrigger>}
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Contact Form */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Send us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="account">Account Problem</SelectItem>
                            <SelectItem value="book_issues">Book Issues</SelectItem>
                            <SelectItem value="payments">Points & Payments</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={formData.priority} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Please provide detailed information about your issue or question..."
                        className="min-h-32"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-green-600" />
                      Other Ways to Reach Us
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Support</h4>
                      <p className="text-sm text-gray-600">support@bookcycle.com</p>
                      <p className="text-xs text-gray-500">We respond within 24 hours</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Business Hours</h4>
                      <p className="text-sm text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-sm text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-xs text-gray-500">Response times may be longer on weekends</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Response Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">General Inquiries</span>
                      <Badge variant="outline">24-48 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Technical Issues</span>
                      <Badge variant="secondary">4-8 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Urgent Issues</span>
                      <Badge variant="destructive">2-4 hours</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FAQ Section */}
          <TabsContent value="faq" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Book Related
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">How do I donate a book?</h4>
                    <p className="text-sm text-gray-600">Go to your student dashboard and click on "Donate Book". Fill in the book details, upload photos, and submit for verification.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">How long does verification take?</h4>
                    <p className="text-sm text-gray-600">Book verification typically takes 2-5 business days. You'll be notified once your book is approved or if any issues arise.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Can I edit my book listing?</h4>
                    <p className="text-sm text-gray-600">You can edit book details before verification. After verification, contact support for any changes.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Points & Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">How do reward points work?</h4>
                    <p className="text-sm text-gray-600">You earn 40% of a book's MRP in points when you donate. You can spend points to buy other books at 60% of their MRP.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Do points expire?</h4>
                    <p className="text-sm text-gray-600">No, your reward points never expire. You can use them anytime to purchase verified books.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Can I convert points to cash?</h4>
                    <p className="text-sm text-gray-600">Points cannot be converted to cash. They can only be used to purchase books on the platform.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Account & Technical
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">How do I reset my password?</h4>
                    <p className="text-sm text-gray-600">Click "Forgot Password" on the login page and follow the instructions sent to your email.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Can I change my email address?</h4>
                    <p className="text-sm text-gray-600">Contact support to change your email address. We'll verify your identity before making changes.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">The website is slow or not loading</h4>
                    <p className="text-sm text-gray-600">Try clearing your browser cache, check your internet connection, or try a different browser. Contact us if issues persist.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Safety & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Is my personal information safe?</h4>
                    <p className="text-sm text-gray-600">Yes, we use industry-standard security measures to protect your data. We never share personal information with third parties.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What if I receive a damaged book?</h4>
                    <p className="text-sm text-gray-600">Contact us immediately with photos of the damage. We'll investigate and provide a refund or replacement if appropriate.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">How do I report inappropriate content?</h4>
                    <p className="text-sm text-gray-600">Use the "Report" feature on any listing or contact support directly. We take all reports seriously.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Queries Tab */}
          {user && (
            <TabsContent value="my-queries" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Support Queries</CardTitle>
                  <CardDescription>
                    Track the status of your support requests and see responses from our team.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myQueries.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
                      <p className="text-gray-600">You haven't submitted any support queries yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myQueries.map((query) => (
                        <Card key={query._id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{query.subject}</CardTitle>
                                <CardDescription>
                                  {query.category.replace('_', ' ')} • {new Date(query.created_at).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={getPriorityColor(query.priority)}>
                                  {query.priority}
                                </Badge>
                                <Badge variant={getStatusColor(query.status)}>
                                  {query.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-sm text-gray-900 mb-1">Your Message:</h4>
                                <p className="text-sm text-gray-600">{query.message}</p>
                              </div>
                              {query.admin_response && (
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <h4 className="font-medium text-sm text-green-900 mb-1">Admin Response:</h4>
                                  <p className="text-sm text-green-800">{query.admin_response}</p>
                                  {query.resolved_at && (
                                    <p className="text-xs text-green-600 mt-2">
                                      Resolved on {new Date(query.resolved_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    User Guides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Getting Started with BookCycle
                  </Link>
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    How to Donate Books Effectively
                  </Link>
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Understanding the Points System
                  </Link>
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Tips for Better Book Photos
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Terms of Service
                  </Link>
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Book Quality Guidelines
                  </Link>
                  <Link href="#" className="block text-sm text-blue-600 hover:underline">
                    Community Guidelines
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium mb-1">📚 Book Condition</p>
                    <p className="text-gray-600">Be honest about book condition to avoid rejections</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium mb-1">📸 Photo Quality</p>
                    <p className="text-gray-600">Use good lighting and show all sides of the book</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium mb-1">💰 Pricing</p>
                    <p className="text-gray-600">Check original MRP before listing your book</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
