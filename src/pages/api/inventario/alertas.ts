import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });
  if (req.method !== 'GET') return res.status(405).end();

  const ahora = new Date();
  const en30dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Lotes vencidos
  const vencidos = await prisma.lote.findMany({
    where: {
      fechaVencimiento: { lt: ahora },
      cantidad: { gt: 0 }
    },
    include: { producto: { select: { id: true, nombre: true, categoria: true } } },
    orderBy: { fechaVencimiento: 'asc' }
  });

  // Lotes próximos a vencer (< 30 días)
  const proximos = await prisma.lote.findMany({
    where: {
      fechaVencimiento: { gte: ahora, lte: en30dias },
      cantidad: { gt: 0 }
    },
    include: { producto: { select: { id: true, nombre: true, categoria: true } } },
    orderBy: { fechaVencimiento: 'asc' }
  });

  // Productos con stock bajo
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: { lotes: { where: { cantidad: { gt: 0 } } } }
  });

  const stockBajo = productos
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      stockMinimo: p.stockMinimo,
      stockActual: p.lotes.reduce((sum, l) => sum + l.cantidad, 0)
    }))
    .filter((p) => p.stockActual <= p.stockMinimo);

  return res.json({ vencidos, proximos, stockBajo });
}
