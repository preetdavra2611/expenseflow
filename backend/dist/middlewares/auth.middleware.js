"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = void 0;
const auth_service_1 = require("../services/auth.service");
const config_1 = require("../config");
const authenticateJwt = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = auth_service_1.authService.verifyToken(token);
        const user = await config_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
exports.authenticateJwt = authenticateJwt;
