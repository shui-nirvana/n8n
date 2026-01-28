import jwt from 'jsonwebtoken'

export async function createToken (payload) {
  const secret = process.env.JWT_SECRET || 'change_me'
  return jwt.sign(payload, secret, { expiresIn: '12h' })
}
