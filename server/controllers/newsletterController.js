const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('../services/emailService');

exports.subscribe = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const existing = await prisma.newsletterSubscriber.findUnique({
            where: { email }
        });

        if (existing) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        const subscriber = await prisma.newsletterSubscriber.create({
            data: { email }
        });

        res.status(201).json({ message: 'Subscribed successfully', subscriber });
    } catch (error) {
        console.error('Newsletter error:', error);
        res.status(500).json({ message: 'Error subscribing', error: error.message });
    }
};

exports.getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await prisma.newsletterSubscriber.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subscribers', error: error.message });
    }
};

exports.unsubscribe = async (req, res) => {
    const { email } = req.body;
    try {
        await prisma.newsletterSubscriber.delete({
            where: { email }
        });
        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error unsubscribing', error: error.message });
    }
};

exports.sendNewsletter = async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const subscribers = await prisma.newsletterSubscriber.findMany({
            select: { email: true }
        });
        
        const emails = subscribers.map(s => s.email);

        if (emails.length === 0) {
            return res.status(400).json({ message: 'No subscribers found' });
        }

        await emailService.sendNewsletter(emails, title, content);
        res.json({ message: `Newsletter sent to ${emails.length} subscribers` });
    } catch (error) {
        console.error('Controller Error sending newsletter:', error);
        // Extract the most relevant error message
        const errorMessage = error.message || 'Error sending newsletter';
        const errorDetails = error.response?.data || error;
        res.status(500).json({ message: errorMessage, error: errorMessage, details: errorDetails });
    }
};
