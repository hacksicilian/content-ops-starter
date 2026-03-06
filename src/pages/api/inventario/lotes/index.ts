import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const { productoId } = req.query;
    const lotes = await prisma.lote.findMany({
      where: {
        ...(productoId ? { productoId: String(productoId) } : {}),
        cantidad: { gt: 0 }
      },
      include: { producto: { select: { nombre: true, categoria: true } } },
      orderBy: [{ fechaVencimiento: 'asc' }, { fechaIngreso: 'asc' }]
    });
    return res.json(lotes);
  }

  if (req.method === 'POST') {
    const { productoId, cantidad, precioCosto, fechaVencimiento, numeroLote } = req.body;

    if (!productoId || !cantidad) {
      return res.status(400).json({ error: 'productoId y cantidad son requeridos' });
    }

    const lote = await prisma.lote.create({
      data: {
        productoId,
        cantidad: Number(cantidad),
        cantidadInicial: Number(cantidad),
        precioCosto: Number(precioCosto ?? 0),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        numeroLote: numeroLote || null
      }
    });

    await prisma.movimiento.create({
      data: {
        loteId: lote.id,
        tipo: 'ENTRADA',
        cantidad: Number(cantidad),
        motivo: 'Ingreso de stock'
      }
    });

    return res.status(201).json(lote);
  }

  res.status(405).end();
}
