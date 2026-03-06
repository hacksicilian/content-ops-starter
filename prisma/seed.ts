import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('natura2024', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'liliana@natura.com' },
    update: {},
    create: {
      email: 'liliana@natura.com',
      password: hash,
      nombre: 'Liliana',
      rol: 'ADMIN'
    }
  });

  console.log('✅ Usuario admin creado:', admin.email);

  // Productos de ejemplo
  const productos = [
    { nombre: 'Perfume Humor Femme', codigoNatura: '98765', categoria: 'Perfumes', precioVenta: 8500, precioCosto: 5000 },
    { nombre: 'Mascara de Pestañas Una', codigoNatura: '12345', categoria: 'Maquillaje', precioVenta: 3200, precioCosto: 1800 },
    { nombre: 'Crema Hidratante Tododia', codigoNatura: '54321', categoria: 'Cuidado de la piel', precioVenta: 2800, precioCosto: 1500 },
    { nombre: 'Shampoo Lumina', codigoNatura: '11111', categoria: 'Cuidado del cabello', precioVenta: 2200, precioCosto: 1200 },
    { nombre: 'Colonia Kaiak', codigoNatura: '22222', categoria: 'Fragancias masculinas', precioVenta: 7500, precioCosto: 4500 }
  ];

  for (const p of productos) {
    const prod = await prisma.producto.upsert({
      where: { codigoNatura: p.codigoNatura },
      update: {},
      create: { ...p, activo: true, stockMinimo: 3 }
    });

    // Agregar stock de ejemplo
    await prisma.lote.upsert({
      where: { id: `seed-${prod.id}` },
      update: {},
      create: {
        id: `seed-${prod.id}`,
        productoId: prod.id,
        cantidad: 10,
        cantidadInicial: 10,
        precioCosto: p.precioCosto,
        fechaVencimiento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses
        numeroLote: 'SEED-001'
      }
    });
  }

  console.log(`✅ ${productos.length} productos de ejemplo creados`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
