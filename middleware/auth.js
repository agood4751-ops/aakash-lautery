function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  req.flash('error', 'Please login to continue.');
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.is_admin) return next();
  req.flash('error', 'Access denied.');
  res.redirect('/');
}

module.exports = { ensureAuth, ensureAdmin };
