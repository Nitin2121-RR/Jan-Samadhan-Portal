import { PrismaClient, AuthorityLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { code: 'PWD', name: 'Public Works Department', category: 'Roads & Infrastructure', description: 'Handles roads, bridges, and public infrastructure' },
  { code: 'PHED', name: 'Public Health Engineering / Jal Board', category: 'Water Supply', description: 'Water supply and pipeline management' },
  { code: 'MC-ELEC', name: 'Municipal Corporation - Electrical Wing', category: 'Street Lights', description: 'Street lighting and electrical infrastructure' },
  { code: 'MC-SAN', name: 'Municipal Corporation - Sanitation', category: 'Garbage Collection', description: 'Waste management and sanitation services' },
  { code: 'MC-DRAIN', name: 'Municipal Corporation - Drainage', category: 'Drainage & Sewage', description: 'Drainage and sewage system maintenance' },
  { code: 'HORT', name: 'Horticulture Department', category: 'Parks & Gardens', description: 'Parks, gardens, and green spaces maintenance' },
  { code: 'POLICE', name: 'Police Department', category: 'Public Safety', description: 'Law enforcement and public safety' },
  { code: 'TRAFFIC', name: 'Traffic Police / Transport Department', category: 'Traffic Issues', description: 'Traffic management and transport services' },
  { code: 'DISCOM', name: 'State Electricity Board (DISCOM)', category: 'Electricity', description: 'Power supply and electrical services' },
  { code: 'EDU', name: 'Education Department', category: 'Education', description: 'Schools and educational institutions' },
  { code: 'HEALTH', name: 'Health Department', category: 'Healthcare', description: 'Hospitals and healthcare services' },
  { code: 'REVENUE', name: 'Revenue / Land Records Department', category: 'Land & Property', description: 'Land records and property issues' },
  { code: 'WELFARE', name: 'Social Welfare Department', category: 'Pension & Welfare', description: 'Social welfare schemes and pensions' },
  { code: 'FCS', name: 'Food & Civil Supplies Department', category: 'Ration & Food', description: 'Ration distribution and food security' },
  { code: 'DC', name: 'District Collector Office', category: 'Other', description: 'General administration and miscellaneous issues' },
];

async function main() {
  console.log('🌱 Starting database seed...');

  const hashedPassword = await bcrypt.hash('Test@123', 10);

  // Create departments
  console.log('📁 Creating departments...');
  const createdDepartments: Record<string, string> = {};

  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, category: dept.category, description: dept.description },
      create: dept,
    });
    createdDepartments[dept.code] = created.id;
    console.log(`  ✓ ${dept.code}: ${dept.name}`);
  }

  // Create test authority accounts
  console.log('\n👤 Creating test authority accounts...');

  const testAuthorities = [
    { code: 'PWD', email: 'gro.pwd@test.com', name: 'Rajesh Kumar (PWD)', level: AuthorityLevel.gro },
    { code: 'PHED', email: 'gro.water@test.com', name: 'Suresh Sharma (Water)', level: AuthorityLevel.gro },
    { code: 'MC-SAN', email: 'gro.sanitation@test.com', name: 'Amit Singh (Sanitation)', level: AuthorityLevel.gro },
    { code: 'MC-ELEC', email: 'gro.electrical@test.com', name: 'Mohan Das (Electrical)', level: AuthorityLevel.gro },
    { code: 'HEALTH', email: 'gro.health@test.com', name: 'Dr. Priya Patel (Health)', level: AuthorityLevel.gro },
    { code: 'POLICE', email: 'gro.police@test.com', name: 'Inspector Vijay (Police)', level: AuthorityLevel.gro },
    { code: 'DISCOM', email: 'gro.electricity@test.com', name: 'Ramesh Verma (Electricity)', level: AuthorityLevel.gro },
    { code: 'EDU', email: 'gro.education@test.com', name: 'Sunita Devi (Education)', level: AuthorityLevel.gro },
    { code: 'DC', email: 'nodal.dc@test.com', name: 'Collector Office Nodal', level: AuthorityLevel.nodal_officer },
    { code: 'DC', email: 'director.dc@test.com', name: 'District Director', level: AuthorityLevel.director },
  ];

  for (const auth of testAuthorities) {
    const deptId = createdDepartments[auth.code];
    const dept = DEPARTMENTS.find(d => d.code === auth.code);

    await prisma.user.upsert({
      where: { email: auth.email },
      update: {
        name: auth.name,
        departmentId: deptId,
        authorityLevel: auth.level,
        department: dept?.name,
        position: auth.level === AuthorityLevel.director ? 'Director' :
                  auth.level === AuthorityLevel.nodal_officer ? 'Nodal Officer' : 'GRO',
      },
      create: {
        email: auth.email,
        password: hashedPassword,
        name: auth.name,
        role: 'authority',
        departmentId: deptId,
        authorityLevel: auth.level,
        department: dept?.name,
        position: auth.level === AuthorityLevel.director ? 'Director' :
                  auth.level === AuthorityLevel.nodal_officer ? 'Nodal Officer' : 'GRO',
      },
    });
    console.log(`  ✓ ${auth.email} (${auth.level})`);
  }

  // Keep legacy test authority for backwards compatibility
  await prisma.user.upsert({
    where: { email: 'authority@test.com' },
    update: {},
    create: {
      email: 'authority@test.com',
      password: hashedPassword,
      name: 'Test Authority',
      phone: '9876543211',
      role: 'authority',
      department: 'Municipal Corporation',
      position: 'Municipal Engineer',
      departmentId: createdDepartments['DC'],
      authorityLevel: AuthorityLevel.gro,
    },
  });
  console.log('  ✓ authority@test.com (legacy)');

  // Create a test citizen account
  console.log('\n👤 Creating test citizen account...');
  await prisma.user.upsert({
    where: { email: 'citizen@test.com' },
    update: {},
    create: {
      email: 'citizen@test.com',
      password: hashedPassword,
      name: 'Test Citizen',
      role: 'citizen',
      address: '123 Main Street, New Delhi',
      phone: '+91 9876543210',
    },
  });
  console.log('  ✓ citizen@test.com');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test Accounts (password: Test@123):');
  console.log('   Citizen: citizen@test.com');
  console.log('   Authorities: gro.pwd@test.com, gro.health@test.com, etc.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
