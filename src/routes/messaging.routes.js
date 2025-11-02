const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messaging.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Notification and messaging endpoints
 */

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Send individual notification
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - type
 *               - message
 *             properties:
 *               recipientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [sms, email, push]
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [appointment, payment, system, marketing, alert, general]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */
router.post('/send', authenticate, messagingController.sendIndividualMessage);

/**
 * @swagger
 * /api/messages/send-bulk:
 *   post:
 *     summary: Send bulk notifications
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - type
 *               - message
 *             properties:
 *               recipientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetType:
 *                 type: string
 *                 enum: [individual, role-based, all-users]
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [provider, patient, vendor, sponsor, admin]
 *               type:
 *                 type: string
 *                 enum: [sms, email, push]
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk notifications sent
 */
router.post('/send-bulk', authenticate, messagingController.sendBulkMessage);

/**
 * @swagger
 * /api/messages/history:
 *   get:
 *     summary: Get notification history (sent messages)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification history retrieved
 */
router.get('/history', authenticate, messagingController.getNotificationHistory);

/**
 * @swagger
 * /api/messages/received:
 *   get:
 *     summary: Get received notifications
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Received notifications retrieved
 */
router.get('/received', authenticate, messagingController.getReceivedNotifications);

/**
 * @swagger
 * /api/messages/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:notificationId/read', authenticate, messagingController.markAsRead);

/**
 * @swagger
 * /api/messages/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/stats', authenticate, messagingController.getNotificationStats);

module.exports = router;
