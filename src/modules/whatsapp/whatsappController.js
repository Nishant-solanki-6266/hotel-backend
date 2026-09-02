import { prisma } from '../../config/database.js';
import { errorResponse, successResponse } from '../../utils/response.js';

export const getThreads = async (req, res, next) => {
  try {
    const threads = await prisma.waThread.findMany({
      include: {
        messages: {
          orderBy: { at: 'asc' },
        },
      },
    });

    const parsed = threads.map((t) => ({
      ...t,
      messages: t.messages.map((m) => ({
        ...m,
        buttons: JSON.parse(m.buttons || '[]'),
      })),
    }));

    return successResponse(res, parsed, 'WhatsApp threads');
  } catch (error) {
    next(error);
  }
};

export const handleAction = async (req, res, next) => {
  try {
    const { threadId, messageId, label, staffName, room, actionType } = req.body;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // If messageId provided, mark chosen label
    if (messageId) {
      await prisma.waMessage.update({
        where: { id: messageId },
        data: { chosen: label },
      }).catch(() => {});
    }

    // Process action based on label/type
    if (actionType === 'room_clean' || label?.toLowerCase().includes('clean') || label?.toLowerCase().includes('ready')) {
      const roomNum = room || label?.match(/\d+/)?.[0];
      if (roomNum) {
        await prisma.room.update({
          where: { number: roomNum },
          data: { status: 'Clean', cleaner: staffName, updatedAt: timeStr },
        }).catch(() => {});

        // Complete any matching cleaning task
        const matchingTask = await prisma.task.findFirst({
          where: { room: roomNum, department: 'Housekeeping', status: { not: 'Completed' } },
        });

        if (matchingTask) {
          await prisma.task.update({
            where: { id: matchingTask.id },
            data: {
              status: 'Completed',
              trail: {
                create: {
                  at: timeStr,
                  text: `Completed by ${staffName || 'Staff'} via WhatsApp`,
                  via: 'whatsapp',
                },
              },
            },
          });
        }
      }
    }

    // Append outbound confirmation message in the thread
    if (threadId) {
      await prisma.waMessage.create({
        data: {
          id: `wam-${Date.now()}`,
          threadId,
          from: 'staff',
          body: label || 'Action confirmed',
          at: timeStr,
        },
      }).catch(() => {});
    }

    return successResponse(res, { success: true, at: timeStr }, 'WhatsApp action processed');
  } catch (error) {
    next(error);
  }
};
