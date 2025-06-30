import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import connectDB from "./mongodb"
import User, { type IUser } from "../models/User"

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key"

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    return null
  }
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
  role: "student" | "manager" | "admin"
  institution?: string
}): Promise<IUser> {
  await connectDB()

  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password)

  // Create user
  const user = new User({
    ...userData,
    password: hashedPassword,
    reward_points: 0,
  })

  return user.save()
}

export async function authenticateUser(email: string, password: string): Promise<IUser | null> {
  await connectDB()

  const user = await User.findOne({ email })
  console.log("User found:", user)
  if (!user) {
    return null
  }

  const isValidPassword = await comparePassword(password, user.password)
  console.log("Password valid:", isValidPassword)
  if (!isValidPassword) {
    return null
  }

  return user
}

export async function getUserById(userId: string): Promise<IUser | null> {
  await connectDB()
  return User.findById(userId).select("-password")
}
