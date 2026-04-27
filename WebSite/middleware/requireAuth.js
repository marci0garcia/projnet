// ============================================================
// middleware/requireAuth.js
// ============================================================
// Applied to every protected HTTP route. Returns 401 JSON if
// no active session exists so the client can redirect to login.
// ============================================================

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized. Please log in." });
}

module.exports = requireAuth;
