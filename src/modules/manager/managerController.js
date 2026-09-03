import { prisma } from '../../config/database.js';
import { successResponse } from '../../utils/response.js';

export const getBriefing = async (req, res, next) => {
  try {
    const hotelId = req.user?.hotelId || 'hotel-mercier';

    const [
      rooms,
      openTasks,
      openIssues,
      conversations,
      upsells,
      activities,
    ] = await Promise.all([
      prisma.room.findMany({ where: { hotelId } }),
      prisma.task.count({ where: { hotelId, status: { not: 'Completed' } } }),
      prisma.issue.count({ where: { hotelId, status: { not: 'Completed' } } }),
      prisma.conversation.findMany(),
      prisma.upsell.findMany({ where: { hotelId } }),
      prisma.activityItem.findMany({ where: { hotelId }, take: 10, orderBy: { id: 'desc' } }),
    ]);

    const totalRooms = rooms.length || 48;
    const occupiedRooms = rooms.filter((r) => r.guestStatus !== 'Vacant').length;
    const cleanRooms = rooms.filter((r) => r.status === 'Clean' || r.status === 'Inspected').length;
    const dirtyRooms = rooms.filter((r) => r.status === 'Dirty').length;
    const vipArrivals = rooms.filter((r) => r.vip && r.arrivalTime).length;

    const escalations = conversations
      .filter((c) => c.escalation)
      .map((c) => ({
        id: c.id,
        guestName: c.guestId,
        escalation: JSON.parse(c.escalation),
      }));

    const acceptedUpsellsTotal = upsells
      .filter((u) => u.status === 'Accepted')
      .reduce((acc, curr) => acc + curr.value, 0);

    const briefing = {
      hotelName: 'Hotel Mercier',
      occupancy: {
        total: totalRooms,
        occupied: occupiedRooms,
        rate: Math.round((occupiedRooms / totalRooms) * 100),
        clean: cleanRooms,
        dirty: dirtyRooms,
        vipArrivals,
      },
      operations: {
        openTasks,
        openIssues,
        pendingEscalations: escalations.length,
      },
      upsellRevenue: acceptedUpsellsTotal,
      escalations,
      recentActivity: activities,
    };

    return successResponse(res, briefing, 'Manager briefing aggregated');
  } catch (error) {
    next(error);
  }
};

export const getActivityFeed = async (req, res, next) => {
  try {
    const hotelId = req.user?.hotelId || 'hotel-mercier';
    const activities = await prisma.activityItem.findMany({
      where: { hotelId },
      take: 20,
      orderBy: { id: 'desc' },
    });
    return successResponse(res, activities, 'Activity feed');
  } catch (error) {
    next(error);
  }
};

export const getAiRules = async (req, res, next) => {
  try {
    const rules = await prisma.aiRule.findMany();
    return successResponse(res, rules, 'AI Rules');
  } catch (error) {
    next(error);
  }
};

export const getKnowledgeDocs = async (req, res, next) => {
  try {
    const hotelId = req.user?.hotelId || 'hotel-mercier';
    const docs = await prisma.knowledgeDoc.findMany({
      where: { hotelId },
      orderBy: { updatedAt: 'desc' },
    });
    return successResponse(res, docs, 'Knowledge documents');
  } catch (error) {
    next(error);
  }
};
