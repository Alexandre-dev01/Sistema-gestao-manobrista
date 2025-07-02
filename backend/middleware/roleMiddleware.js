// backend/middleware/roleMiddleware.js
const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    // req.user é definido pelo authMiddleware
    if (!req.user || req.user.cargo !== requiredRole) {
      return res
        .status(403)
        .json({
          message:
            "Acesso negado. Você não tem permissão para realizar esta ação.",
        });
    }
    next();
  };
};

module.exports = roleMiddleware;
