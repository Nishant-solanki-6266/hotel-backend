import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { errorResponse } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token missing', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Invalid token payload', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        phone: true,
        initials: true,
        lastActive: true,
        whatsapp: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found or deactivated', 401);
    }

    req.user = {
      ...user,
      hotelId: decoded.hotelId || user.hotelId,
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};
