const prisma = require('../prismaClient');

const bcrypt = require('bcryptjs');

exports.getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.id },
      include: { portalUser: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

exports.createClient = async (req, res) => {
  const { name, email, phone, cui, regCom, address, city, county, country, zipCode } = req.body;
  try {
    const user = req.user;
    
    // Check Plan Limits (Clients)
    const count = await prisma.client.count({ where: { userId: user.id } });
    
    if (user.plan === 'FREE' && count >= 3) {
        return res.status(403).json({ 
            message: 'Free Plan limit reached (3 clients). Please upgrade to add more.' 
        });
    }
    
    if (user.plan === 'STARTER' && count >= 50) {
        return res.status(403).json({ 
            message: 'Starter Plan limit reached (50 clients). Please upgrade to add more.' 
        });
    }

    const client = await prisma.client.create({
      data: {
        userId: req.user.id,
        name,
        email,
        phone,
        cui,
        regCom,
        address,
        city,
        county,
        country,
        zipCode
      },
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

exports.inviteClient = async (req, res) => {
    const { clientId } = req.body;
    try {
        const client = await prisma.client.findFirst({
            where: { id: clientId, userId: req.user.id }
        });
        
        if (!client || !client.email) {
            return res.status(400).json({ message: 'Client not found or missing email.' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: client.email } });
        if (existingUser) {
            // Link existing user if not linked? Or just return error
            // For MVP, if email matches, we can just update role or link
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Create Portal User
        // Generate random password
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                email: client.email,
                password: hashedPassword,
                companyName: client.name,
                role: 'CUSTOMER',
                emailVerified: true, // Auto verify for invited clients?
            }
        });

        // Link to Client
        await prisma.client.update({
            where: { id: clientId },
            data: { portalUserId: newUser.id }
        });

        // Send Email with credentials (MOCKED)
        console.log(`[PORTAL INVITE] Sent to ${client.email}: Password: ${randomPassword}`);

        res.json({ message: 'Client invited to portal', tempPassword: randomPassword });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error inviting client', error: error.message });
    }
};

exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, email, phone, cui, regCom, address, city, county, country, zipCode } = req.body;
  try {
    const client = await prisma.client.updateMany({
      where: { id, userId: req.user.id },
      data: { name, contactPerson, email, phone, cui, regCom, address, city, county, country, zipCode },
    });
    if (client.count === 0) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating client', error: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await prisma.client.deleteMany({
      where: { id, userId: req.user.id },
    });
    if (client.count === 0) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};
