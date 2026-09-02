import { prisma } from '../../config/database.js';
import { errorResponse, successResponse } from '../../utils/response.js';

export const getConversations = async (req, res, next) => {
  try {
    const { channel, stage, aiStatus } = req.query;
    const where = {};
    if (channel) where.primaryChannel = channel;
    if (stage) where.stage = stage;
    if (aiStatus) where.aiStatus = aiStatus;

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        guest: {
          include: { reservations: true },
        },
        messages: {
          orderBy: { at: 'asc' },
        },
      },
      orderBy: { lastAt: 'desc' },
    });

    const parsed = conversations.map((c) => ({
      ...c,
      knowledgeUsed: JSON.parse(c.knowledgeUsed || '[]'),
      upsellIdeas: JSON.parse(c.upsellIdeas || '[]'),
      taskIds: JSON.parse(c.taskIds || '[]'),
      escalation: c.escalation ? JSON.parse(c.escalation) : undefined,
      guest: {
        ...c.guest,
        tags: JSON.parse(c.guest.tags || '[]'),
        reservation: c.guest.reservations[0] || null,
      },
    }));

    return successResponse(res, parsed, 'Conversations list');
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        guest: {
          include: { reservations: true },
        },
        messages: {
          orderBy: { at: 'asc' },
        },
      },
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const parsed = {
      ...conversation,
      knowledgeUsed: JSON.parse(conversation.knowledgeUsed || '[]'),
      upsellIdeas: JSON.parse(conversation.upsellIdeas || '[]'),
      taskIds: JSON.parse(conversation.taskIds || '[]'),
      escalation: conversation.escalation ? JSON.parse(conversation.escalation) : undefined,
      guest: {
        ...conversation.guest,
        tags: JSON.parse(conversation.guest.tags || '[]'),
        reservation: conversation.guest.reservations[0] || null,
      },
      messages: conversation.messages.map((m) => ({
        ...m,
        knowledge: JSON.parse(m.knowledge || '[]'),
        buttons: JSON.parse(m.buttons || '[]'),
      })),
    };

    return successResponse(res, parsed, 'Conversation details');
  } catch (error) {
    next(error);
  }
};

export const sendReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body, staffName = 'Amélie Duprez', channel } = req.body;

    if (!body) {
      return errorResponse(res, 'Message body is required', 400);
    }

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msgId = `m-${Date.now()}`;

    const message = await prisma.message.create({
      data: {
        id: msgId,
        conversationId: id,
        author: 'staff',
        channel: channel || conv.primaryChannel,
        body,
        at: timeStr,
        staffName,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        lastAt: timeStr,
        aiStatus: 'human-takeover',
        unread: 0,
      },
    });

    return successResponse(res, message, 'Reply sent');
  } catch (error) {
    next(error);
  }
};

export const toggleTakeover = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { aiStatus } = req.body; // "ai-handling" or "human-takeover"

    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv) {
      return errorResponse(res, 'Conversation not found', 404);
    }

    const newStatus = aiStatus || (conv.aiStatus === 'ai-handling' ? 'human-takeover' : 'ai-handling');

    const updated = await prisma.conversation.update({
      where: { id },
      data: { aiStatus: newStatus },
    });

    return successResponse(res, { id, aiStatus: updated.aiStatus }, `AI Mode updated to ${updated.aiStatus}`);
  } catch (error) {
    next(error);
  }
};
