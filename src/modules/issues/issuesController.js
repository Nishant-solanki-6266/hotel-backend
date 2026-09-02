import { prisma } from '../../config/database.js';
import { errorResponse, successResponse } from '../../utils/response.js';

export const getIssues = async (req, res, next) => {
  try {
    const { status, room } = req.query;
    const where = {};
    if (status) where.status = status;
    if (room) where.room = room;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        updates: {
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, issues, 'Issues list');
  } catch (error) {
    next(error);
  }
};

export const createIssue = async (req, res, next) => {
  try {
    const {
      room,
      title,
      detail,
      priority = 'Normal',
      reportedBy = 'Front Office',
      via = 'Dashboard',
      assignee,
      outOfService = false,
    } = req.body;

    if (!room || !title) {
      return errorResponse(res, 'Room and title are required', 400);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const id = `MT-${Math.floor(100 + Math.random() * 900)}`;

    const issue = await prisma.issue.create({
      data: {
        id,
        room,
        title,
        detail,
        priority,
        reportedBy,
        via,
        createdAt: timeStr,
        assignee,
        status: assignee ? 'Accepted' : 'Reported',
        outOfService,
        updates: {
          create: [
            {
              at: timeStr,
              text: `Reported by ${reportedBy} via ${via}`,
              via: 'dashboard',
            },
          ],
        },
      },
      include: { updates: true },
    });

    if (outOfService) {
      await prisma.room.update({
        where: { number: room },
        data: { status: 'Maintenance', updatedAt: timeStr },
      });
    }

    // Record activity
    await prisma.activityItem.create({
      data: {
        id: `act-${Date.now()}`,
        at: timeStr,
        kind: 'maintenance',
        text: `New maintenance issue for Room ${room}: ${title}`,
        meta: `Ticket ${id}`,
      },
    });

    return successResponse(res, issue, 'Issue created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, via = 'dashboard' } = req.body;

    const existing = await prisma.issue.findUnique({
      where: { id },
      include: { updates: true },
    });

    if (!existing) {
      return errorResponse(res, 'Issue not found', 404);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        status,
        updates: {
          create: {
            at: timeStr,
            text: note || `Status updated to ${status}`,
            via,
          },
        },
      },
      include: { updates: true },
    });

    // Cross-department automation:
    // If completed and room was in maintenance / out of service, set room back to Dirty for housekeeping recheck
    if (status === 'Completed') {
      await prisma.room.update({
        where: { number: existing.room },
        data: {
          status: 'Dirty',
          updatedAt: timeStr,
          note: 'Maintenance finished. Requires housekeeping re-inspection.',
        },
      });

      // Also create a re-inspection task for Housekeeping
      await prisma.task.create({
        data: {
          id: `t-${Date.now()}`,
          title: `Re-inspect Room ${existing.room} after ${existing.title} repair`,
          room: existing.room,
          department: 'Housekeeping',
          priority: 'High',
          createdAt: timeStr,
          status: 'New',
          source: 'PMS event',
          trail: {
            create: {
              at: timeStr,
              text: `Auto-generated after maintenance ticket ${id} completed`,
              via: 'ai',
            },
          },
        },
      });
    }

    // Record activity
    await prisma.activityItem.create({
      data: {
        id: `act-${Date.now()}`,
        at: timeStr,
        kind: 'maintenance',
        text: `Issue ${id} (Room ${existing.room}) marked ${status}`,
        meta: note,
      },
    });

    return successResponse(res, updated, 'Issue status updated');
  } catch (error) {
    next(error);
  }
};
