  import {toast} from 'sonner';

// API client for BookCycle platform
class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "An error occurred")
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Auth methods
  async signUp(userData: {
    name: string
    email: string
    password: string
    role: "student" | "manager" | "admin"
    institution?: string
  }) {
    const data = await this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
    console.log("SignUp response:::::", data)
    if (data.token) {
      this.token = data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token)
      }
            toast.success('Registration successful!');
      
    }
    if (data) {
        // Store token
        localStorage.setItem("token", data.token)

        // Redirect based on role
        if (data.user.role === "student") {
          window.location.href = "/dashboard/student"
        } else if (data.user.role === "manager") {
          window.location.href = "/dashboard/manager"
        } else {
          window.location.href = "/dashboard/admin"
        }
      }

    return data
  }

  async signIn(email: string, password: string) {
    const credentials = { email, password }
    
    console.log("SignIn request:", credentials)
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
    console.log("SignIn response:::::", data)
    
    if (data.token) {
      this.token = data.token
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token)
      }
    }

    return data
  }

  async getCurrentUser() {
    return this.request("/api/auth/me")
  }

  signOut() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
  }

  // Legacy user methods - redirecting to admin endpoints
  async getUsersLegacy(role?: string) {
    const params = role ? `?role=${role}` : ""
    return this.request(`/api/users${params}`)
  }

  // Book methods
  async getBooks(filters?: {
    status?: string
    userId?: string
    buyerId?: string
    subject?: string
    condition?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    const queryString = params.toString()
    return this.request(`/api/books${queryString ? `?${queryString}` : ""}`)
  }

  async createBook(bookData: {
    title: string 
    author: string
    isbn?: string
    condition: "excellent" | "good" | "fair" | "poor"
    subject: string
    mrp: number
    description?: string
    images?: string[]
  }) {
    return this.request("/api/books", {
      method: "POST",
      body: JSON.stringify(bookData),
    })
  }

  async donateBook(formData: FormData) {
    // For file uploads, don't set Content-Type header, let browser set it with boundary
    const config: RequestInit = {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    }

    const url = `${this.baseUrl}/api/books/donate`
    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "An error occurred")
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  async verifyBook(bookId: string, verificationData: {
    status: "verified" | "rejected"
    rejectionReason?: string
  }) {
    // Convert frontend parameters to API parameters
    const apiData = {
      approved: verificationData.status === "verified",
      reason: verificationData.rejectionReason
    }
    
    return this.request(`/api/books/${bookId}/verify`, {
      method: "POST",
      body: JSON.stringify(apiData),
    })
  }

  async updateBook(bookId: string, bookData: Partial<{
    title: string
    author: string
    subject: string
    mrp: number
    condition: string
    description: string
  }>) {
    return this.request(`/api/books/${bookId}`, {
      method: "PUT",
      body: JSON.stringify(bookData),
    })
  }

  async purchaseBook(bookId: string) {
    return this.request(`/api/books/${bookId}/purchase`, {
      method: "POST",
    })
  }

  async deleteBook(bookId: string) {
    return this.request(`/api/books/${bookId}`, {
      method: "DELETE",
    })
  }

  // Transaction methods
  async getTransactions(filters?: {
    userId?: string
    type?: string
    status?: string
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    const queryString = params.toString()
    return this.request(`/api/transactions${queryString ? `?${queryString}` : ""}`)
  }

  // Notification methods
  async getNotifications() {
    return this.request("/api/notifications")
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}`, {
      method: "PUT",
      body: JSON.stringify({ read: true }),
    })
  }

  // Admin methods
  async getSystemStats() {
    return this.request("/api/admin/stats")
  }

  async exportData(type: string) {
    const response = await fetch(`${this.baseUrl}/api/admin/export?type=${type}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Export failed")
    }

    return response.blob()
  }

  async updateRewardSettings(settings: {
    donationPercentage: number
    purchasePercentage: number
  }) {
    return this.request("/api/admin/settings/rewards", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  // Admin user management methods
  async getUsers(filters?: {
    role?: "student" | "manager" | "admin"
    status?: "active" | "suspended" | "blocked"
    search?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.role) params.append("role", filters.role)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    
    return this.request(`/api/admin/users?${params}`)
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: "student" | "manager" | "admin"
    institution?: string
  }) {
    return this.request("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUserStatus(userId: string, action: "suspend" | "activate" | "block") {
    return this.request(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    })
  }

  async updateUser(userId: string, userData: {
    name?: string
    email?: string
    role?: string
    institution?: string
    reward_points?: number
  }) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "DELETE",
    })
  }

  // Support/Help methods
  async getSupportQueries(filters?: {
    status?: "open" | "in_progress" | "resolved" | "closed"
    category?: "technical" | "account" | "book_issues" | "payments" | "general" | "complaint"
    priority?: "low" | "medium" | "high" | "urgent"
  }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.category) params.append("category", filters.category)
    if (filters?.priority) params.append("priority", filters.priority)
    
    return this.request(`/api/support?${params}`)
  }

  async createSupportQuery(queryData: {
    name: string
    email: string
    subject: string
    message: string
    category?: "technical" | "account" | "book_issues" | "payments" | "general" | "complaint"
    priority?: "low" | "medium" | "high" | "urgent"
  }) {
    return this.request("/api/support", {
      method: "POST",
      body: JSON.stringify(queryData),
    })
  }

  async updateSupportQuery(queryId: string, updateData: {
    status?: "open" | "in_progress" | "resolved" | "closed"
    admin_response?: string
    priority?: "low" | "medium" | "high" | "urgent"
  }) {
    return this.request(`/api/support/${queryId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })
  }

  async deleteSupportQuery(queryId: string) {
    return this.request(`/api/support/${queryId}`, {
      method: "DELETE",
    })
  }

  // Payment methods
  async createPaymentSession(points: number) {
    return this.request("/api/payment/create-checkout", {
      method: "POST",
      body: JSON.stringify({ points }),
    })
  }

  async verifyPayment(sessionId: string) {
    return this.request("/api/payment/verify", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    })
  }
}

// Create a singleton instance
const apiClient = new ApiClient()

// Named exports for compatibility
export const signUp = (userData: Parameters<ApiClient["signUp"]>[0]) => apiClient.signUp(userData)
export const signIn = (email: string, password: string) => apiClient.signIn(email, password)
export const getCurrentUser = () => apiClient.getCurrentUser()
export const signOut = () => apiClient.signOut()

export const getUsers = (filters?: Parameters<ApiClient["getUsers"]>[0]) => apiClient.getUsers(filters)
export const createUser = (userData: Parameters<ApiClient["createUser"]>[0]) => apiClient.createUser(userData)
export const updateUserStatus = (userId: string, action: Parameters<ApiClient["updateUserStatus"]>[1]) =>
  apiClient.updateUserStatus(userId, action)
export const updateUser = (userId: string, userData: Parameters<ApiClient["updateUser"]>[1]) =>
  apiClient.updateUser(userId, userData)
export const deleteUser = (userId: string) => apiClient.deleteUser(userId)

export const getBooks = (filters?: Parameters<ApiClient["getBooks"]>[0]) => apiClient.getBooks(filters)
export const createBook = (bookData: Parameters<ApiClient["createBook"]>[0]) => apiClient.createBook(bookData)
export const donateBook = (formData: FormData) => apiClient.donateBook(formData)
export const verifyBook = (bookId: string, verificationData: Parameters<ApiClient["verifyBook"]>[1]) =>
  apiClient.verifyBook(bookId, verificationData)
export const updateBook = (bookId: string, bookData: Parameters<ApiClient["updateBook"]>[1]) =>
  apiClient.updateBook(bookId, bookData)
export const purchaseBook = (bookId: string) => apiClient.purchaseBook(bookId)
export const deleteBook = (bookId: string) => apiClient.deleteBook(bookId)

export const getTransactions = (filters?: Parameters<ApiClient["getTransactions"]>[0]) =>
  apiClient.getTransactions(filters)

export const getNotifications = () => apiClient.getNotifications()
export const markNotificationRead = (notificationId: string) => apiClient.markNotificationRead(notificationId)

export const getSystemStats = () => apiClient.getSystemStats()
export const exportData = (type: string) => apiClient.exportData(type)
export const updateRewardSettings = (settings: Parameters<ApiClient["updateRewardSettings"]>[0]) =>
  apiClient.updateRewardSettings(settings)

// Support exports
export const getSupportQueries = (filters?: Parameters<ApiClient["getSupportQueries"]>[0]) => 
  apiClient.getSupportQueries(filters)
export const createSupportQuery = (queryData: Parameters<ApiClient["createSupportQuery"]>[0]) => 
  apiClient.createSupportQuery(queryData)
export const updateSupportQuery = (queryId: string, updateData: Parameters<ApiClient["updateSupportQuery"]>[1]) =>
  apiClient.updateSupportQuery(queryId, updateData)
export const deleteSupportQuery = (queryId: string) => apiClient.deleteSupportQuery(queryId)

// Payment exports
export const createPaymentSession = (points: number) => apiClient.createPaymentSession(points)
export const verifyPayment = (sessionId: string) => apiClient.verifyPayment(sessionId)

// Default export
export default apiClient
