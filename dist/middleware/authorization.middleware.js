"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role) {
            return res.status(403).json({ message: 'Acceso denegado: no autorizado' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: rol no permitido' });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=authorization.middleware.js.map