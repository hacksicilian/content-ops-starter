import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

function startOf(date: Date, unit: 'day' | 'week' | 'month') {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (unit === 'week') d.setDate(d.getDate() - d.getDay());
  if (unit === 'month') d.setDate(1);
  return d;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });
  if (req.method !== 'GET') return res.status(405).end();

  const ahora = new Date();
  const hoy = startOf(ahora, 'day');
  const semana = startOf(ahora, 'week');
  const mes = startOf(ahora, 'month');
  const en30dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [ventasHoy, ventasSemana, ventasMes, ventasPorCanal, alertasVenc, stockBajoProds] = await Promise.all([
    prisma.venta.aggregate({ where: { fecha: { gte: hoy } }, _sum: { total: true }, _count: true }),
    prisma.venta.aggregate({ where: { fecha: { gte: semana } }, _sum: { total: true }, _count: true }),
    prisma.venta.aggregate({ where: { fecha: { gte: mes } }, _sum: { total: true }, _count: true }),
    prisma.venta.groupBy({ by: ['canal'], where: { fecha: { gte: mes } }, _sum: { total: true }, _count: true }),
    prisma.lote.findMany({
      where: { fechaVencimiento: { lte: en30dias }, cantidad: { gt: 0 } },
      include: { producto: { select: { nombre: true } } },
      orderBy: { fechaVencimiento: 'asc' },
      take: 10
    }),
    prisma.producto.findMany({
      where: { activo: true },
      include: { lotes: { where: { cantidad: { gt: 0 } } } }
    })
  ]);

  const stockBajo = stockBajoProds
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      stockMinimo: p.stockMinimo,
      stockActual: p.lotes.reduce((s, l) => s + l.cantidad, 0)
    }))
    .filter((p) => p.stockActual <= p.stockMinimo)
    .slice(0, 10);

  return res.json({
    ventas: {
      hoy: { total: ventasHoy._sum.total ?? 0, cantidad: ventasHoy._count },
      semana: { total: ventasSemana._sum.total ?? 0, cantidad: ventasSemana._count },
      mes: { total: ventasMes._sum.total ?? 0, cantidad: ventasMes._count }
    },
    porCanal: ventasPorCanal.map((v) => ({ canal: v.canal, total: v._sum.total ?? 0, cantidad: v._count })),
    alertas: {
      vencimientos: alertasVenc,
      stockBajo
    }
  });
}
