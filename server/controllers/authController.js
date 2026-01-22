const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const emailService = require('../services/emailService');

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashVerificationCode(code) {
  const secret = process.env.JWT_SECRET || 'dev';
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

async function createAndSendVerificationCode(userEmail, userId) {
  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.emailVerification.create({
    data: {
      userId,
      code: codeHash,
      expiresAt,
    },
  });
  await emailService.sendVerificationEmail(userEmail, code);
}

exports.register = async (req, res) => {
  const { companyName, email, password, plan } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const existingCompany = await prisma.user.findFirst({ where: { companyName } });
    if (existingCompany) {
        return res.status(400).json({ message: 'Company name already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        companyName,
        email,
        password: hashedPassword,
        emailVerified: false,
        plan: plan ? plan.toUpperCase() : 'FREE',
      },
    });
    try {
      await createAndSendVerificationCode(user.email, user.id);
    } catch (error) {
      console.error('Error sending verification email during registration:', error);
      return res.status(500).json({ message: 'Error sending verification email. Please try again later.' });
    }

    res.status(201).json({ message: 'Verification code sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, companyName: user.companyName, role: user.role, plan: user.plan } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.emailVerified) {
      const token = signToken(user);
      return res.json({ token, user: { id: user.id, email: user.email, companyName: user.companyName, role: user.role, plan: user.plan } });
    }

    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({ message: 'Code expired or invalid. Please request a new one.' });
    }

    if (verification.attempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
    }

    const codeHash = hashVerificationCode(String(code || ''));
    if (codeHash !== verification.code) {
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ message: 'Invalid code' });
    }

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, companyName: user.companyName, role: user.role, plan: user.plan } });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};

exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'Verification code sent' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email already verified' });
    }

    await createAndSendVerificationCode(user.email, user.id);
    res.json({ message: 'Verification code sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending verification code', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

exports.updateEmail = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify password before sensitive change
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Check if email is taken
    if (email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email: email }
    });

    res.json({ message: 'Email updated successfully', email });
  } catch (error) {
    res.status(500).json({ message: 'Error updating email', error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Super admin account cannot be deleted from this page.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.client.updateMany({
        where: { portalUserId: userId },
        data: { portalUserId: null },
      });

      await tx.settings.deleteMany({ where: { userId } });
      await tx.emailVerification.deleteMany({ where: { userId } });
      await tx.customTemplate.deleteMany({ where: { userId } });
      await tx.invoice.deleteMany({ where: { userId } });
      await tx.client.deleteMany({ where: { userId } });

      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ message: 'Account and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
};
