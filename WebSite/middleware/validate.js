// ============================================================
// middleware/validate.js
// ============================================================
// Lightweight validation helpers used by controllers.
// These are plain functions, not Express middleware, so they
// can be imported and called inline within controller logic.
// ============================================================

function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

module.exports = { isNonEmpty, isValidEmail, isValidPassword };
