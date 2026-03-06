import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { verificarStockSuficiente, descontarStockFIFO } from '../../../lib/stock';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const { canal, estadoPago, desde, hasta } = req.query;
    const ventas = await prisma.venta.findMany({
      where: {
        ...(canal ? { canal: String(canal) as any } : {}),
        ...(estadoPago ? { estadoPago: String(estadoPago) as any } : {}),
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(String(desde)) } : {}),
                ...(hasta ? { lte: new Date(String(hasta)) } : {})
              }
            }
          : {})
      },
      include: {
        items: { include: { producto: { select: { nombre: true } } } },
        cliente: { select: { nombre: true } },
        vendedor: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });
    return res.json(ventas);
  }

  if (req.method === 'POST') {
    const { canal, clienteId, items, notas, estadoPago } = req.body as {
      canal: string;
      clienteId?: string;
      items: { productoId: string; cantidad: number; precioUnitario: number }[];
      notas?: string;
      estadoPago?: string;
    };

    if (!canal || !items || items.length === 0) {
      return res.status(400).json({ error: 'canal e items son requeridos' });
    }

    const vendedor = await prisma.user.findUnique({ where: { email: session.user?.email! } });
    if (!vendedor) return res.status(400).json({ error: 'Vendedor no encontrado' });

    // Verificar stock antes de crear la venta
    await verificarStockSuficiente(items);

    const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

    const venta = await prisma.venta.create({
      data: {
        canal: canal as any,
        clienteId: clienteId || null,
        total,
        estadoPago: (estadoPago as any) || 'PENDIENTE',
        vendedorId: vendedor.id,
        notas: notas || null,
        items: {
          create: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario
          }))
        }
      }
    });

    // Descontar stock FIFO
    await descontarStockFIFO(
      items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, ventaId: venta.id }))
    );

    return res.status(201).json(venta);
  }

  res.status(405).end();
}
