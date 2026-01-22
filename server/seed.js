const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Cont Administrator (Full Access / Premium)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@saas.com' },
    update: {},
    create: {
      email: 'admin@saas.com',
      password: hashedPassword,
      companyName: 'Admin Corporation',
      subscriptionPlan: 'premium',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log({ adminUser });

  // 2. Cont Client (Standard / Free)
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      password: hashedPassword,
      companyName: 'Test Client SRL',
      subscriptionPlan: 'free',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log({ clientUser });

  // 3. Cont Vendor (Requested by user)
  const vendorPassword = await bcrypt.hash('password123', 10);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@test.com' },
    update: {},
    create: {
      email: 'vendor@test.com',
      password: vendorPassword,
      companyName: 'Vendor SRL',
      subscriptionPlan: 'free',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log({ vendorUser });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
