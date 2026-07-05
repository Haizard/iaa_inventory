import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@inventory.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  await prisma.user.upsert({
    where: { email: 'manager@inventory.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@inventory.com',
      password: managerPassword,
      role: 'MANAGER',
    },
  });

  // Staff user
  const staffPassword = await bcrypt.hash('staff123', 12);
  await prisma.user.upsert({
    where: { email: 'staff@inventory.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@inventory.com',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics', description: 'Electronic devices and accessories' },
    }),
    prisma.category.upsert({
      where: { name: 'Office Supplies' },
      update: {},
      create: { name: 'Office Supplies', description: 'Stationery and office materials' },
    }),
    prisma.category.upsert({
      where: { name: 'Food & Beverages' },
      update: {},
      create: { name: 'Food & Beverages', description: 'Consumable products' },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: { name: 'Clothing', description: 'Apparel and garments' },
    }),
  ]);

  // Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'supplier-1' },
      update: {},
      create: {
        id: 'supplier-1',
        name: 'Tech Supplies Ltd',
        email: 'orders@techsupplies.com',
        phone: '+255-712-000-001',
        address: 'Dar es Salaam, Tanzania',
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'supplier-2' },
      update: {},
      create: {
        id: 'supplier-2',
        name: 'Office World',
        email: 'supply@officeworld.co.tz',
        phone: '+255-712-000-002',
        address: 'Arusha, Tanzania',
      },
    }),
  ]);

  // Brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'HP' },
      update: {},
      create: { name: 'HP', description: 'Computers and accessories' },
    }),
    prisma.brand.upsert({
      where: { name: 'Logitech' },
      update: {},
      create: { name: 'Logitech', description: 'Computer peripherals' },
    }),
    prisma.brand.upsert({
      where: { name: 'Generic' },
      update: {},
      create: { name: 'Generic', description: 'Unbranded or mixed-supplier products' },
    }),
  ]);

  // Products
  await Promise.all([
    prisma.product.upsert({
      where: { sku: 'ELEC-001' },
      update: {},
      create: {
        name: 'Laptop HP ProBook',
        sku: 'ELEC-001',
        description: 'HP ProBook 450 G8 15.6" laptop',
        price: 1200000,
        costPrice: 950000,
        wholesalePrice: 1100000,
        minSellingPrice: 1050000,
        productType: 'PHYSICAL',
        currency: 'TZS',
        quantity: 15,
        minStock: 5,
        maxStock: 40,
        unit: 'pcs',
        purchaseUnit: 'pcs',
        sellingUnit: 'pcs',
        warehouse: 'Main Store',
        storageLocation: 'Shelf A1',
        status: 'ACTIVE',
        canBeSold: true,
        availableInStore: true,
        availableOnline: true,
        brandId: brands[0].id,
        supplierId: suppliers[0].id,
        supplierSku: 'HP-PROBOOK-450',
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'ELEC-002' },
      update: {},
      create: {
        name: 'Wireless Mouse',
        sku: 'ELEC-002',
        description: 'Logitech M185 wireless mouse',
        price: 45000,
        costPrice: 30000,
        wholesalePrice: 40000,
        productType: 'PHYSICAL',
        quantity: 8,
        minStock: 10,
        unit: 'pcs',
        brandId: brands[1].id,
        supplierId: suppliers[0].id,
        warehouse: 'Main Store',
        storageLocation: 'Shelf A2',
        categoryId: categories[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'OFF-001' },
      update: {},
      create: {
        name: 'A4 Paper Ream',
        sku: 'OFF-001',
        description: '500 sheets A4 80gsm paper',
        price: 12000,
        costPrice: 8000,
        quantity: 50,
        minStock: 20,
        unit: 'ream',
        brandId: brands[2].id,
        supplierId: suppliers[1].id,
        purchaseUnit: 'carton',
        sellingUnit: 'ream',
        unitConversion: '1 carton = 5 reams',
        warehouse: 'Main Store',
        categoryId: categories[1].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'OFF-002' },
      update: {},
      create: {
        name: 'Ballpoint Pen Box',
        sku: 'OFF-002',
        description: 'Box of 50 blue ballpoint pens',
        price: 8000,
        costPrice: 5000,
        quantity: 4,
        minStock: 10,
        unit: 'box',
        brandId: brands[2].id,
        supplierId: suppliers[1].id,
        warehouse: 'Main Store',
        categoryId: categories[1].id,
      },
    }),
  ]);

  console.log('✅ Seed complete!');
  console.log('📧 Admin:   admin@inventory.com   / admin123');
  console.log('📧 Manager: manager@inventory.com / manager123');
  console.log('📧 Staff:   staff@inventory.com   / staff123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
