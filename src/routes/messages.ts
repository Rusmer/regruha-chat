import { Hono } from 'hono';
import { generateMessageId, generateConversationId } from '../utils/auth';
import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
}

const router = new Hono<{ Bindings: Env }>();

// Get conversations
router.get('/conversations', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const db = c.env.DB;
    const conversations = await db
      .prepare(`
        SELECT c.* FROM conversations c
        INNER JOIN conversation_members cm ON c.id = cm.conversation_id
        WHERE cm.user_id = ?
        ORDER BY c.updated_at DESC
      `)
      .bind(userId)
      .all();

    return c.json(conversations.results || []);
  } catch (e) {
    console.error('Get conversations error:', e);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

// Create conversation
router.post('/conversations', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { name, type, participantIds } = await c.req.json();
    const db = c.env.DB;
    const conversationId = generateConversationId();

    // Create conversation
    await db
      .prepare(`
        INSERT INTO conversations (id, type, name, creator_id)
        VALUES (?, ?, ?, ?)
      `)
      .bind(conversationId, type || 'group', name, userId)
      .run();

    // Add creator as member
    await db
      .prepare(`
        INSERT INTO conversation_members (id, conversation_id, user_id, role)
        VALUES (?, ?, ?, ?)
      `)
      .bind(nanoid(), conversationId, userId, 'admin')
      .run();

    // Add other participants
    if (participantIds && Array.isArray(participantIds)) {
      for (const participantId of participantIds) {
        if (participantId !== userId) {
          await db
            .prepare(`
              INSERT INTO conversation_members (id, conversation_id, user_id)
              VALUES (?, ?, ?)
            `)
            .bind(nanoid(), conversationId, participantId)
            .run();
        }
      }
    }

    return c.json({ id: conversationId }, 201);
  } catch (e) {
    console.error('Create conversation error:', e);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

// Get messages in conversation
router.get('/conversations/:conversationId/messages', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { conversationId } = c.req.param();
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const db = c.env.DB;

    // Verify user is member
    const member = await db
      .prepare(`
        SELECT id FROM conversation_members
        WHERE conversation_id = ? AND user_id = ?
      `)
      .bind(conversationId, userId)
      .first();

    if (!member) return c.json({ error: 'Access denied' }, 403);

    // Get messages
    const messages = await db
      .prepare(`
        SELECT m.*, u.username, u.display_name, u.avatar_url
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ? AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(conversationId, limit, offset)
      .all();

    return c.json(messages.results || []);
  } catch (e) {
    console.error('Get messages error:', e);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Send message
router.post('/conversations/:conversationId/messages', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { conversationId } = c.req.param();
    const { content, type = 'text' } = await c.req.json();

    if (!content) return c.json({ error: 'Message content required' }, 400);

    const db = c.env.DB;
    const messageId = generateMessageId();

    // Verify user is member
    const member = await db
      .prepare(`
        SELECT id FROM conversation_members
        WHERE conversation_id = ? AND user_id = ?
      `)
      .bind(conversationId, userId)
      .first();

    if (!member) return c.json({ error: 'Access denied' }, 403);

    // Create message
    await db
      .prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, content, type)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(messageId, conversationId, userId, content, type)
      .run();

    // Update conversation updated_at
    await db
      .prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(conversationId)
      .run();

    return c.json({ id: messageId }, 201);
  } catch (e) {
    console.error('Send message error:', e);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Edit message
router.put('/messages/:messageId', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { messageId } = c.req.param();
    const { content } = await c.req.json();

    if (!content) return c.json({ error: 'Message content required' }, 400);

    const db = c.env.DB;

    // Verify ownership
    const message = await db
      .prepare('SELECT sender_id FROM messages WHERE id = ?')
      .bind(messageId)
      .first();

    if (!message) return c.json({ error: 'Message not found' }, 404);
    if (message.sender_id !== userId) return c.json({ error: 'Access denied' }, 403);

    // Update message
    await db
      .prepare(`
        UPDATE messages
        SET edited_content = ?, edited_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(content, messageId)
      .run();

    return c.json({ success: true });
  } catch (e) {
    console.error('Edit message error:', e);
    return c.json({ error: 'Failed to edit message' }, 500);
  }
});

// Delete message
router.delete('/messages/:messageId', async (c) => {
  try {
    const userId = c.req.header('X-User-Id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const { messageId } = c.req.param();
    const db = c.env.DB;

    // Verify ownership
    const message = await db
      .prepare('SELECT sender_id FROM messages WHERE id = ?')
      .bind(messageId)
      .first();

    if (!message) return c.json({ error: 'Message not found' }, 404);
    if (message.sender_id !== userId) return c.json({ error: 'Access denied' }, 403);

    // Soft delete message
    await db
      .prepare('UPDATE messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(messageId)
      .run();

    return c.json({ success: true });
  } catch (e) {
    console.error('Delete message error:', e);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

export default router;
