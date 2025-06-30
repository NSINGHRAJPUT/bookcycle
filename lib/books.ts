import { supabase } from "./supabase"

export async function createBookDonation(bookData: {
  title: string
  author: string
  isbn?: string
  subject: string
  mrp: number
  condition: string
  description?: string
  images?: string[]
  donor_id: string
}) {
  try {
    const { data, error } = await supabase
      .from("books")
      .insert({
        ...bookData,
        status: "pending",
        points_price: Math.floor(bookData.mrp * 0.6), // 60% of MRP for purchase
      })
      .select()
      .single()

    if (error) throw error

    // Create notification for book managers
    await createNotificationForManagers(
      "New Book Donation",
      `A new book "${bookData.title}" has been submitted for verification.`,
      "book_donation",
    )

    return data
  } catch (error) {
    console.error("Create book donation error:", error)
    throw error
  }
}

export async function getAvailableBooks() {
  try {
    const { data, error } = await supabase
      .from("books")
      .select(`
        *,
        donor:users!books_donor_id_fkey(name, email)
      `)
      .eq("status", "verified")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Get available books error:", error)
    throw error
  }
}

export async function getPendingBooks() {
  try {
    const { data, error } = await supabase
      .from("books")
      .select(`
        *,
        donor:users!books_donor_id_fkey(name, email)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Get pending books error:", error)
    throw error
  }
}

export async function getUserDonations(userId: string) {
  try {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("donor_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Get user donations error:", error)
    throw error
  }
}

export async function verifyBook(bookId: string, verifierId: string, approved: boolean) {
  try {
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*, donor:users!books_donor_id_fkey(id, name, email, reward_points)")
      .eq("id", bookId)
      .single()

    if (bookError) throw bookError

    const newStatus = approved ? "verified" : "rejected"

    // Update book status
    const { error: updateError } = await supabase
      .from("books")
      .update({
        status: newStatus,
        verifier_id: verifierId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)

    if (updateError) throw updateError

    if (approved && book.donor) {
      // Award points to donor (40% of MRP)
      const pointsToAward = Math.floor(book.mrp * 0.4)

      const { error: pointsError } = await supabase
        .from("users")
        .update({
          reward_points: book.donor.reward_points + pointsToAward,
          updated_at: new Date().toISOString(),
        })
        .eq("id", book.donor.id)

      if (pointsError) throw pointsError

      // Create transaction record
      await supabase.from("transactions").insert({
        type: "donation",
        user_id: book.donor.id,
        book_id: bookId,
        points_amount: pointsToAward,
        status: "completed",
      })

      // Create notification for donor
      await createNotification(
        book.donor.id,
        "Book Approved!",
        `Your book "${book.title}" has been approved! You earned ${pointsToAward} reward points.`,
        "book_approved",
      )
    } else if (!approved && book.donor) {
      // Create notification for donor
      await createNotification(
        book.donor.id,
        "Book Rejected",
        `Your book "${book.title}" was not approved for listing. Please check the quality guidelines and try again.`,
        "book_rejected",
      )
    }

    return true
  } catch (error) {
    console.error("Verify book error:", error)
    throw error
  }
}

export async function purchaseBook(bookId: string, buyerId: string) {
  try {
    // Get book and buyer info
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("status", "verified")
      .single()

    if (bookError) throw bookError

    const { data: buyer, error: buyerError } = await supabase.from("users").select("*").eq("id", buyerId).single()

    if (buyerError) throw buyerError

    if (buyer.reward_points < book.points_price) {
      throw new Error("Insufficient reward points")
    }

    // Update book status and buyer
    const { error: updateBookError } = await supabase
      .from("books")
      .update({
        status: "sold",
        buyer_id: buyerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId)

    if (updateBookError) throw updateBookError

    // Deduct points from buyer
    const { error: updateBuyerError } = await supabase
      .from("users")
      .update({
        reward_points: buyer.reward_points - book.points_price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", buyerId)

    if (updateBuyerError) throw updateBuyerError

    // Create transaction record
    await supabase.from("transactions").insert({
      type: "purchase",
      user_id: buyerId,
      book_id: bookId,
      points_amount: book.points_price,
      status: "completed",
    })

    // Create notification for buyer
    await createNotification(
      buyerId,
      "Purchase Successful!",
      `You successfully purchased "${book.title}" for ${book.points_price} points.`,
      "book_purchased",
    )

    return true
  } catch (error) {
    console.error("Purchase book error:", error)
    throw error
  }
}

async function createNotification(userId: string, title: string, message: string, type: string) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  })
}

async function createNotificationForManagers(title: string, message: string, type: string) {
  // Get all managers
  const { data: managers } = await supabase.from("users").select("id").eq("role", "manager")

  if (managers) {
    const notifications = managers.map((manager) => ({
      user_id: manager.id,
      title,
      message,
      type,
    }))

    await supabase.from("notifications").insert(notifications)
  }
}
