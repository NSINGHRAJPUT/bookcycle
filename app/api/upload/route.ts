import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue // Skip non-image files
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Cloudinary
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "bookcycle/books", // Organize uploads in folders
              public_id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
              transformation: [
                { width: 800, height: 800, crop: "limit" }, // Limit size for performance
                { quality: "auto" }, // Automatic quality optimization
                { format: "auto" } // Automatic format optimization
              ]
            },
            (error, result) => {
              if (error) {
                reject(error)
              } else if (result) {
                resolve(result)
              } else {
                reject(new Error("Upload failed - no result"))
              }
            }
          ).end(buffer)
        })

        // Add the secure URL to uploaded files
        uploadedFiles.push(result.secure_url)
      } catch (uploadError) {
        console.error("Failed to upload file:", file.name, uploadError)
        // Continue with other files even if one fails
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No files were successfully uploaded" }, { status: 400 })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error: any) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload files" }, { status: 500 })
  }
}
