// Staging-safe optional module loader
// Provides no-op fallbacks for optional dependencies

function optionalRequire(modulePath, exportName) {
  try {
    const mod = require(modulePath);
    if (exportName) {
      return mod[exportName] || mod.default || mod;
    }
    return mod;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

function noopMiddleware() {
  return (req, res, next) => next();
}

function noopRouter() {
  const router = require('express').Router();
  return router;
}

module.exports = {
  optionalRequire,
  noopMiddleware,
  noopRouter
};

