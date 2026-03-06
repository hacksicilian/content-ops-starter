import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { stockDisponible } from '../../../lib/stock';

// Ruta pública — sin autenticación
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { categoria } = req.query;

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(categoria ? { categoria: String(categoria) } : {})
    },
    select: { id: true, nombre: true, categoria: true, precioVenta: true, descripcion: true, imagenUrl: true },
    orderBy: { nombre: 'asc' }
  });

  const conStock = await Promise.all(
    productos.map(async (p) => ({ ...p, stockActual: await stockDisponible(p.id) }))
  );

  return res.json(conStock.filter((p) => p.stockActual > 0));
}
