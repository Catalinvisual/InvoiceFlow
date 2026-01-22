const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('--- Începere creare conturi de test ---');

  // 1. Creare Super Admin
  const adminEmail = 'admin@test.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: adminEmail,
      password,
      companyName: 'SaaS Super Admin',
      role: 'SUPER_ADMIN',
      emailVerified: true,
      subscriptionPlan: 'enterprise'
    },
  });
  console.log(`✅ Cont creat: Admin (${adminEmail}) - Parola: password123`);

  // 2. Creare Vendor (Furnizor de servicii)
  const vendorEmail = 'vendor@test.com';
  const vendor = await prisma.user.upsert({
    where: { email: vendorEmail },
    update: { role: 'VENDOR' },
    create: {
      email: vendorEmail,
      password,
      companyName: 'Vendor Services SRL',
      role: 'VENDOR',
      emailVerified: true,
      subscriptionPlan: 'pro'
    },
  });
  console.log(`✅ Cont creat: Vendor (${vendorEmail}) - Parola: password123`);

  // 3. Creare Client (Portal User)
  // Mai întâi creăm user-ul de login
  const clientEmail = 'client@test.com';
  const clientUser = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { role: 'CUSTOMER' },
    create: {
      email: clientEmail,
      password,
      companyName: 'Client SRL',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });
  console.log(`✅ Cont creat: Client Portal (${clientEmail}) - Parola: password123`);

  // 4. Conectare Client la Vendor (Simulăm că Vendorul l-a adăugat pe Client)
  // Verificăm dacă există profilul de client în lista vendorului
  let clientProfile = await prisma.client.findFirst({
    where: { 
      userId: vendor.id,
      email: clientEmail 
    }
  });

  if (!clientProfile) {
    clientProfile = await prisma.client.create({
      data: {
        userId: vendor.id, // Vendorul deține acest client
        name: 'Client SRL',
        email: clientEmail,
        cui: 'RO12345678',
        address: 'Strada Testului Nr. 1, București',
        phone: '0700123456',
        portalUserId: clientUser.id // Legăm contul de portal
      }
    });
    console.log(`🔗 Profil Client creat și legat de Vendor.`);
  } else {
    // Asigurăm legătura dacă profilul exista deja
    await prisma.client.update({
      where: { id: clientProfile.id },
      data: { portalUserId: clientUser.id }
    });
    console.log(`🔗 Profil Client actualizat cu acces portal.`);
  }

  // 5. Creare o factură de test pentru acest client
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'TEST-001',
      userId: vendor.id, // Emisă de Vendor
      clientId: clientProfile.id, // Pentru Client
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Scadență 7 zile
      issueDate: new Date(),
      status: 'sent',
      total: 1500.00,
      items: JSON.stringify([
        { description: 'Servicii Consultanță Web', quantity: 1, price: 1000 },
        { description: 'Mentenanță lunară', quantity: 1, price: 500 }
      ])
    }
  });
  console.log(`📄 Factură de test creată (1500 RON) pentru a fi vizibilă în portal.`);

  console.log('--- Finalizat cu succes ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
