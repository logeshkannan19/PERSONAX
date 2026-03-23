import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      apiKey: 'pk_demo_' + uuidv4().replace(/-/g, '').slice(0, 32),
      plan: 'pro',
      settings: JSON.stringify({
        features: ['analytics', 'recommendations', 'segments']
      })
    }
  });

  console.log('✅ Created organization:', org.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  console.log('✅ Created admin user:', admin.email);

  // Create website
  const website = await prisma.website.create({
    data: {
      organizationId: org.id,
      name: 'Demo Website',
      domain: 'demo.example.com',
      isEnabled: true
    }
  });

  console.log('✅ Created website:', website.domain);

  // Create sample profiles
  const profiles = [
    { interests: ['products', 'pricing'], engagementScore: 75, visitCount: 15, totalDuration: 1800 },
    { interests: ['blog', 'tutorials'], engagementScore: 45, visitCount: 5, totalDuration: 600 },
    { interests: ['features'], engagementScore: 20, visitCount: 2, totalDuration: 120 },
    { interests: ['pricing', 'products', 'features'], engagementScore: 85, visitCount: 25, totalDuration: 3600 },
    { interests: ['blog'], engagementScore: 15, visitCount: 1, totalDuration: 45 },
  ];

  for (const p of profiles) {
    await prisma.userProfile.create({
      data: {
        organizationId: org.id,
        websiteId: website.id,
        anonymousId: 'anon_' + uuidv4().slice(0, 12),
        interests: p.interests,
        engagementScore: p.engagementScore,
        visitCount: p.visitCount,
        totalDuration: p.totalDuration,
        lastActiveAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('✅ Created sample user profiles');

  // Create sample segments
  const segments = [
    { name: 'New Users', description: 'Users with 2 or fewer visits', color: '#8B5CF6', userCount: 1 },
    { name: 'Active', description: 'Regularly engaged users', color: '#10B981', userCount: 2 },
    { name: 'High Value', description: 'Highly engaged users', color: '#F59E0B', userCount: 2 },
  ];

  for (const s of segments) {
    await prisma.segment.create({
      data: {
        organizationId: org.id,
        ...s,
        criteria: JSON.stringify({})
      }
    });
  }

  console.log('✅ Created sample segments');

  // Create sample events
  const session = await prisma.session.create({
    data: {
      websiteId: website.id,
      anonymousId: 'session_demo',
      deviceInfo: JSON.stringify({ userAgent: 'Mozilla/5.0' }),
      pageCount: 5,
      duration: 300
    }
  });

  const eventTypes = ['PAGE_VIEW', 'CLICK', 'SCROLL', 'TIME_ON_PAGE'];
  for (let i = 0; i < 20; i++) {
    await prisma.event.create({
      data: {
        sessionId: session.id,
        websiteId: website.id,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        url: ['/home', '/pricing', '/features', '/about'][Math.floor(Math.random() * 4)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('✅ Created sample events');

  // Create personalization rule
  await prisma.personalizationRule.create({
    data: {
      organizationId: org.id,
      websiteId: website.id,
      name: 'Welcome New Users',
      description: 'Show welcome message to new visitors',
      triggerEvent: 'page_view',
      conditions: JSON.stringify([{ field: 'visitCount', operator: 'lte', value: 2 }]),
      action: 'SHOW_CTA',
      actionData: JSON.stringify({ message: 'Welcome! Check out our features.', cta: 'Get Started' }),
      isActive: true,
      priority: 10
    }
  });

  console.log('✅ Created sample personalization rule');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📧 Login credentials:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: admin123');
  console.log('\n🔑 API Key:', org.apiKey);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });