import { prisma } from '../../config/database.js';

/**
 * Housekeeping intent keywords map and dictionary
 */
const HOUSEKEEPING_PATTERNS = [
  { regex: /\b(towel|towels|bath towel|hand towel|face towel)\b/i, item: 'Fresh towels', priority: 'Normal' },
  { regex: /\b(pillow|pillows|extra pillow|feather pillow)\b/i, item: 'Extra pillows', priority: 'Normal' },
  { regex: /\b(blanket|blankets|duvet|bedsheet|bed sheet|linen)\b/i, item: 'Extra bedding / blanket', priority: 'Normal' },
  { regex: /\b(baby cot|cot|crib|baby bed)\b/i, item: 'Baby cot setup', priority: 'High' },
  { regex: /\b(toiletries|shampoo|conditioner|soap|body wash|shower gel)\b/i, item: 'Toiletries replenishment', priority: 'Normal' },
  { regex: /\b(dental kit|toothbrush|toothpaste|shaving kit|razor)\b/i, item: 'Dental / vanity kit', priority: 'Normal' },
  { regex: /\b(slipper|slippers|bathrobe|robe)\b/i, item: 'Bathrobes & slippers', priority: 'Normal' },
  { regex: /\b(water|water bottle|bottles of water|drinking water)\b/i, item: 'Complimentary water bottles', priority: 'Normal' },
  { regex: /\b(iron|ironing board|steamer)\b/i, item: 'Iron & ironing board', priority: 'Normal' },
  { regex: /\b(clean|cleaning|clean my room|housekeeping|make up room|service room)\b/i, item: 'Room cleaning service', priority: 'High' },
  { regex: /\b(trash|rubbish|garbage|empty bin|bin)\b/i, item: 'Trash clearance', priority: 'Normal' },
  { regex: /\b(toilet paper|tissue|tissues|napkins)\b/i, item: 'Tissue / toilet roll refill', priority: 'Normal' },
];

/**
 * Maintenance intent keywords
 */
const MAINTENANCE_PATTERNS = [
  { regex: /\b(ac|air condition|air conditioner|heating|hvac|thermostat|cold|hot)\b/i, issue: 'AC / Climate control issue' },
  { regex: /\b(leak|leaking|tap|faucet|drain|clogged|plumbing|flush|toilet)\b/i, issue: 'Plumbing / leak issue' },
  { regex: /\b(tv|television|remote|channels|wifi|internet|connection)\b/i, issue: 'TV / Media connectivity issue' },
  { regex: /\b(light|bulb|lamp|electricity|power|socket|plug)\b/i, issue: 'Electrical / lighting issue' },
  { regex: /\b(lock|key|keycard|safe|door)\b/i, issue: 'Door lock / in-room safe issue' },
];

/**
 * Format current time as HH:MM
 */
function getClockTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Calculate due time (minutes added to current time)
 */
function getDueTime(minutesToAdd = 20) {
  const d = new Date(Date.now() + minutesToAdd * 60 * 1000);
  return getClockTime(d);
}

/**
 * Extract room number from message or reservation context
 */
function extractRoomNumber(messageText, conversation, guest) {
  const match = messageText.match(/room\s*#?\s*(\d{2,4})/i) || messageText.match(/\b(\d{3,4})\b/);
  if (match?.[1]) {
    return match[1];
  }
  if (guest?.reservations?.[0]?.room) {
    return guest.reservations[0].room;
  }
  if (guest?.room) {
    return guest.room;
  }
  return null;
}

/**
 * Process inbound guest message, detect intent and trigger automated actions
 */
export async function processGuestMessageAI({
  messageText,
  conversationId,
  hotelId = 'hotel-mercier',
  channel = 'whatsapp',
}) {
  if (!messageText || typeof messageText !== 'string') {
    return null;
  }

  // Load conversation details with guest and reservation
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
    include: {
      guest: {
        include: { reservations: true },
      },
    },
  });

  if (!conversation) return null;

  const guest = conversation.guest;
  const guestName = guest?.name || 'Guest';
  const effectiveHotelId = guest?.hotelId || hotelId;
  const room = extractRoomNumber(messageText, conversation, guest) || '208';
  const timeStr = getClockTime();

  // 1. Check for Housekeeping Intent
  for (const pattern of HOUSEKEEPING_PATTERNS) {
    if (pattern.regex.test(messageText)) {
      const itemTitle = `${pattern.item} — Room ${room}`;
      const taskId = `t-${Date.now()}`;
      const dueTime = getDueTime(pattern.priority === 'High' ? 15 : 25);

      // Create Task in Database
      const task = await prisma.task.create({
        data: {
          id: taskId,
          hotelId: effectiveHotelId,
          title: itemTitle,
          detail: `Guest request via ${channel}: "${messageText.trim()}"`,
          room,
          guest: guestName,
          department: 'Housekeeping',
          priority: pattern.priority,
          status: 'New',
          createdAt: timeStr,
          due: dueTime,
          source: 'WhatsApp',
          conversationId,
          trail: {
            create: [
              {
                at: timeStr,
                text: `Automated AI Task created for Housekeeping: "${pattern.item}"`,
                via: 'ai',
              },
            ],
          },
        },
        include: { trail: true },
      }).catch((err) => {
        console.error('[AI Service] Task creation error:', err.message);
        return null;
      });

      // Update Conversation taskIds array
      try {
        const existingTaskIds = JSON.parse(conversation.taskIds || '[]');
        if (!existingTaskIds.includes(taskId)) {
          existingTaskIds.push(taskId);
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              taskIds: JSON.stringify(existingTaskIds),
              lastAt: timeStr,
            },
          });
        }
      } catch (e) {
        console.warn('[AI Service] Task IDs update warning:', e.message);
      }

      // Log Activity Feed Item
      await prisma.activityItem.create({
        data: {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          hotelId: effectiveHotelId,
          at: timeStr,
          kind: 'task',
          text: `AI created task for Housekeeping: "${itemTitle}"`,
          meta: `Room ${room}`,
        },
      }).catch(() => {});

      const aiReplyBody = `Certainly, ${guestName.split(' ')[0] || 'Sir/Madam'}. I have logged your request for ${pattern.item.toLowerCase()} for Room ${room}. Our housekeeping team has been dispatched and will attend to this promptly.`;

      // Save AI Message in Conversation
      const aiMsg = await prisma.message.create({
        data: {
          id: `m-${Date.now()}`,
          conversationId,
          author: 'ai',
          channel,
          body: aiReplyBody,
          at: timeStr,
          confidence: 0.98,
        },
      });

      return {
        handled: true,
        type: 'housekeeping',
        task,
        message: aiMsg,
        replyText: aiReplyBody,
      };
    }
  }

  // 2. Check for Maintenance Intent
  for (const pattern of MAINTENANCE_PATTERNS) {
    if (pattern.regex.test(messageText)) {
      const issueTitle = `${pattern.issue} in Room ${room}`;
      const issueId = `MT-${Date.now().toString().slice(-4)}`;
      const taskId = `t-${Date.now()}`;

      // Create Task for Maintenance
      const task = await prisma.task.create({
        data: {
          id: taskId,
          hotelId: effectiveHotelId,
          title: `Inspect ${pattern.issue} — Room ${room}`,
          detail: `Reported by ${guestName} via ${channel}: "${messageText.trim()}"`,
          room,
          guest: guestName,
          department: 'Maintenance',
          priority: 'High',
          status: 'New',
          createdAt: timeStr,
          due: getDueTime(20),
          source: 'AI Detection',
          conversationId,
          trail: {
            create: [
              {
                at: timeStr,
                text: `Automated AI Task created for Maintenance (${issueId})`,
                via: 'ai',
              },
            ],
          },
        },
      }).catch(() => null);

      const aiReplyBody = `I apologize for the inconvenience regarding the ${pattern.issue.toLowerCase()} in Room ${room}. Our engineering team has been alerted immediately and a technician will visit your room shortly.`;

      const aiMsg = await prisma.message.create({
        data: {
          id: `m-${Date.now()}`,
          conversationId,
          author: 'ai',
          channel,
          body: aiReplyBody,
          at: timeStr,
          confidence: 0.96,
        },
      });

      return {
        handled: true,
        type: 'maintenance',
        task,
        message: aiMsg,
        replyText: aiReplyBody,
      };
    }
  }

  // 3. Fallback General AI Acknowledgement
  const fallbackReply = `Thank you for your message, ${guestName.split(' ')[0] || 'Guest'}. Our front office and guest experience team are at your service. Please let us know if you need anything specific for your stay.`;

  const fallbackMsg = await prisma.message.create({
    data: {
      id: `m-${Date.now()}`,
      conversationId,
      author: 'ai',
      channel,
      body: fallbackReply,
      at: timeStr,
      confidence: 0.92,
    },
  });

  return {
    handled: true,
    type: 'general',
    message: fallbackMsg,
    replyText: fallbackReply,
  };
}
