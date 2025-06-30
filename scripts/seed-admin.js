const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// User schema (simplified version for seeding)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'manager', 'admin'], required: true },
  institution: String,
  reward_points: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended', 'blocked'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

async function seedAdmin() {
  try {
    // Connect to MongoDB - Replace with your actual MongoDB connection string
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://neeraj:SaCWgwUqiiLgUKET@mca.tkyb17c.mongodb.net/bookcycle'
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' })
    if (existingAdmin) {
      console.log('Admin user already exists with email: admin@gmail.com')
      console.log('Admin details:', {
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status
      })
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Test@123', 12)

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      institution: 'BookCycle Platform',
      status: 'active'
    })

    await adminUser.save()
    
    console.log('✅ Admin user created successfully!')
    console.log('Admin credentials:')
    console.log('Email: admin@gmail.com')
    console.log('Password: Test@123')
    console.log('Role: admin')
    console.log('Status: active')

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed')
  }
}

seedAdmin()
