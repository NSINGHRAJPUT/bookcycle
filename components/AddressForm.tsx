"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Save, User } from "lucide-react"

interface AddressFormProps {
  user: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddressUpdated: (user: any) => void
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

export default function AddressForm({ user, open, onOpenChange, onAddressUpdated }: AddressFormProps) {
  const [addressData, setAddressData] = useState({
    line1: user?.address?.line1 || "",
    line2: user?.address?.line2 || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    postal_code: user?.address?.postal_code || "",
    country: user?.address?.country || "IN"
  })
  const [phone, setPhone] = useState(user?.phone || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate required fields
    if (!addressData.line1 || !addressData.city || !addressData.state || !addressData.postal_code || !phone) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please login to continue")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          address: addressData,
          phone: phone
        })
      })

      const data = await response.json()

      if (response.ok) {
        onAddressUpdated({ ...user, address: addressData, phone })
        onOpenChange(false)
      } else {
        setError(data.error || "Failed to update address")
      }
    } catch (err: any) {
      setError("Failed to update address")
      console.error("Address update error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Update Address Information
          </DialogTitle>
          <DialogDescription>
            As per Indian regulations, we need your address information for payment processing.
            This information will be securely stored and used only for compliance purposes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Billing Address</CardTitle>
              <CardDescription>
                This address will be used for payment processing and invoicing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="line1">Address Line 1 *</Label>
                <Input
                  id="line1"
                  placeholder="House/Flat number, Building name, Street"
                  value={addressData.line1}
                  onChange={(e) => setAddressData({ ...addressData, line1: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  placeholder="Area, Landmark (Optional)"
                  value={addressData.line2}
                  onChange={(e) => setAddressData({ ...addressData, line2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">PIN Code *</Label>
                  <Input
                    id="postal_code"
                    placeholder="PIN Code"
                    value={addressData.postal_code}
                    onChange={(e) => setAddressData({ ...addressData, postal_code: e.target.value })}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={addressData.state}
                  onValueChange={(value) => setAddressData({ ...addressData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+91 XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="[+][0-9]{12,15}"
                  required
                />
                <p className="text-xs text-gray-500">
                  Include country code (e.g., +91 for India)
                </p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Address
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
