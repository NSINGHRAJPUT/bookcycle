"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen, Upload, ArrowLeft, Gift, Info, CheckCircle,
  Camera, Award, Coins
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser, createBook } from "@/lib/api"

export default function DonatePage() {
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    subject: "",
    mrp: "",
    condition: "",
    description: "",
    images: [] as File[]
  })
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser()
      if (response.error || !response.user || response.user.role !== "student") {
        router.push("/auth/login")
        return
      }
      setUser(response.user)
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 images total
    const remainingSlots = 5 - formData.images.length
    const filesToAdd = files.slice(0, remainingSlots)

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...filesToAdd]
    }))

    // Upload images to server
    setUploadingImages(true)
    try {
      const uploadFormData = new FormData()
      filesToAdd.forEach(file => {
        uploadFormData.append("files", file)
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: uploadFormData
      })

      if (!response.ok) {
        throw new Error("Failed to upload images")
      }

      const result = await response.json()
      setUploadedImageUrls(prev => [...prev, ...result.files])
    } catch (error) {
      console.error("Image upload failed:", error)
      alert("Failed to upload some images. Please try again.")
      // Remove the files that failed to upload
      setFormData(prev => ({
        ...prev,
        images: prev.images.slice(0, prev.images.length - filesToAdd.length)
      }))
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.author || !formData.subject || !formData.mrp || !formData.condition) {
        alert("Please fill in all required fields")
        return
      }

      // Create book donation
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        subject: formData.subject,
        mrp: parseFloat(formData.mrp),
        condition: formData.condition as "excellent" | "good" | "fair" | "poor",
        description: formData.description.trim() || undefined,
        images: uploadedImageUrls
      }

      const response = await createBook(bookData)

      if (response.error) {
        throw new Error(response.error)
      }

      // Show success message
      alert(`Book donation submitted successfully! 
      
Your book "${formData.title}" has been sent to our book managers for review. You'll receive a notification once it's verified.

If approved, you'll earn ${calculateRewardPoints()} reward points!`)

      // Redirect to dashboard
      router.push("/dashboard/student")
    } catch (error: any) {
      console.error("Donation submission failed:", error)
      alert(error.message || "Failed to submit donation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateRewardPoints = () => {
    const mrp = parseFloat(formData.mrp) || 0
    return Math.round(mrp * 0.4)
  }

  const progressPercentage = (step / 3) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span>Loading...</span>
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
              <BookOpen className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-600">BookCycle</h1>
                <p className="text-sm text-gray-600">Donate a Book</p>
              </div>
            </div>
            <Link href="/dashboard/student">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Step {step} of 3</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs">
                <span className={step >= 1 ? "text-green-600 font-medium" : "text-gray-400"}>
                  Book Details
                </span>
                <span className={step >= 2 ? "text-green-600 font-medium" : "text-gray-400"}>
                  Condition & Images
                </span>
                <span className={step >= 3 ? "text-green-600 font-medium" : "text-gray-400"}>
                  Review & Submit
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Book Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Information
              </CardTitle>
              <CardDescription>
                Enter the basic details of the book you want to donate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Data Structures and Algorithms"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    placeholder="e.g., Thomas H. Cormen"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN (Optional)</Label>
                  <Input
                    id="isbn"
                    placeholder="978-XXXXXXXXX"
                    value={formData.isbn}
                    onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                  />
                  <p className="text-xs text-gray-600">
                    Usually found on the back cover or copyright page
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="Psychology">Psychology</SelectItem>
                      <SelectItem value="Philosophy">Philosophy</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP (₹) *</Label>
                  <Input
                    id="mrp"
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.mrp}
                    onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
                    required
                    min="1"
                  />
                  <p className="text-xs text-gray-600">
                    Original price printed on the book
                  </p>
                </div>
              </div>

              {formData.mrp && (
                <Alert>
                  <Gift className="h-4 w-4" />
                  <AlertDescription>
                    You will earn <strong>{calculateRewardPoints()} reward points</strong>
                    {' '}(40% of MRP) if this book is verified and approved by a manager.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.title || !formData.author || !formData.subject || !formData.mrp}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Condition & Images */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Book Condition & Photos
              </CardTitle>
              <CardDescription>
                Help us assess your book's condition with accurate information and photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="condition">Book Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <div>
                          <div className="font-medium">Excellent</div>
                          <div className="text-xs text-gray-600">Like new, no visible wear</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="good">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <div>
                          <div className="font-medium">Good</div>
                          <div className="text-xs text-gray-600">Minor wear, pages intact</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="fair">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <div>
                          <div className="font-medium">Fair</div>
                          <div className="text-xs text-gray-600">Noticeable wear but usable</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="poor">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <div>
                          <div className="font-medium">Poor</div>
                          <div className="text-xs text-gray-600">Significant wear, some damage</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe any specific details about the book's condition, missing pages, highlighting, etc."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="images">Book Photos</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <Button variant="outline" asChild disabled={uploadingImages || formData.images.length >= 5}>
                        <label htmlFor="images" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingImages ? "Uploading..." : "Upload Photos"}
                        </label>
                      </Button>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImages || formData.images.length >= 5}
                      />
                      <p className="text-sm text-gray-600">
                        Upload up to 5 clear photos of your book ({formData.images.length}/5)
                      </p>
                      <p className="text-xs text-gray-500">
                        Include front cover, back cover, and any damage/wear
                      </p>
                      {uploadingImages && (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                          <span className="text-sm">Uploading images...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div>
                    <Label>Uploaded Photos ({formData.images.length}/5)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative border rounded-lg p-2 bg-white">
                          <div className="aspect-square bg-gray-100 rounded flex items-center justify-center relative overflow-hidden">
                            {uploadedImageUrls[index] ? (
                              <img
                                src={uploadedImageUrls[index]}
                                alt={`Book photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center">
                                <Camera className="h-8 w-8 text-gray-400" />
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mt-2" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs mt-1 truncate">{image.name}</p>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Clear, well-lit photos help managers verify your book faster.
                  Be honest about the condition to ensure smooth approval.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.condition}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review Your Donation
              </CardTitle>
              <CardDescription>
                Please review all details before submitting your book for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Book Summary */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="font-semibold text-lg mb-4">{formData.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Author:</span>
                    <p className="font-medium">{formData.author}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Subject:</span>
                    <p className="font-medium">{formData.subject}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">MRP:</span>
                    <p className="font-medium">₹{formData.mrp}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Condition:</span>
                    <p className="font-medium capitalize">{formData.condition}</p>
                  </div>
                  {formData.isbn && (
                    <div>
                      <span className="text-gray-600">ISBN:</span>
                      <p className="font-medium font-mono">{formData.isbn}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Photos:</span>
                    <p className="font-medium">{formData.images.length} uploaded</p>
                  </div>
                </div>
                {formData.description && (
                  <div className="mt-4">
                    <span className="text-gray-600">Description:</span>
                    <p className="text-sm mt-1">{formData.description}</p>
                  </div>
                )}
              </div>

              {/* Reward Information */}
              <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Reward Points</h3>
                    <p className="text-sm text-green-600">Earn points when your book is verified</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700">You will earn:</span>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {calculateRewardPoints()} points
                    </span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Points will be credited after manager verification (usually within 2-3 days)
                </p>
              </div>

              {/* Next Steps */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>What happens next:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Your book will be reviewed by a qualified book manager</li>
                    <li>You'll receive a notification about the verification status</li>
                    <li>If approved, reward points will be added to your account</li>
                    <li>Your book will be listed for other students to purchase</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit}>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Donation
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
