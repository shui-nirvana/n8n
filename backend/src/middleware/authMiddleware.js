import jwt from 'jsonwebtoken'

export function authMiddleware (req, res, next) {
  // Allow logs endpoint to bypass auth
  if (req.path === '/logs') {
    return next()
  }

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'missing_token' })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me')
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}
