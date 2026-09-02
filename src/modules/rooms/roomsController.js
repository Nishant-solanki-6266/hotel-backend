import { prisma } from '../../config/database.js';
import { errorResponse, successResponse } from '../../utils/response.js';

export const getRooms = async (req, res, next) => {
  try {
    const { floor, status } = req.query;
    const where = {};
    if (floor) where.floor = parseInt(floor, 10);
    if (status) where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { number: 'asc' },
    });
    return successResponse(res, rooms, 'Rooms fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getRoomByNumber = async (req, res, next) => {
  try {
    const { number } = req.params;
    const room = await prisma.room.findUnique({
      where: { number },
    });
    if (!room) {
      return errorResponse(res, `Room ${number} not found`, 404);
    }
    return successResponse(res, room, 'Room fetched');
  } catch (error) {
    next(error);
  }
};

export const updateRoomStatus = async (req, res, next) => {
  try {
    const { number } = req.params;
    const { status, cleaner, note } = req.body;

    const existing = await prisma.room.findUnique({ where: { number } });
    if (!existing) {
      return errorResponse(res, `Room ${number} not found`, 404);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated = await prisma.room.update({
      where: { number },
      data: {
        status: status || existing.status,
        cleaner: cleaner !== undefined ? cleaner : existing.cleaner,
        note: note !== undefined ? note : existing.note,
        updatedAt: timeStr,
      },
    });

    // Record activity item
    await prisma.activityItem.create({
      data: {
        id: `act-${Date.now()}`,
        at: timeStr,
        kind: 'room',
        text: `Room ${number} set to ${status || existing.status}`,
        meta: cleaner ? `by ${cleaner}` : undefined,
      },
    });

    return successResponse(res, updated, `Room ${number} updated`);
  } catch (error) {
    next(error);
  }
};
