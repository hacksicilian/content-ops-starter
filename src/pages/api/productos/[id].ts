import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { stockDisponible } from '../../../lib/stock';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        lotes: { orderBy: [{ fechaVencimiento: 'asc' }, { fechaIngreso: 'asc' }] }
      }
    });
    if (!producto) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ ...producto, stockActual: await stockDisponible(id) });
  }

  if (req.method === 'PUT') {
    const producto = await prisma.producto.update({
      where: { id },
      data: req.body
    });
    return res.json(producto);
  }

  if (req.method === 'DELETE') {
    await prisma.producto.update({ where: { id }, data: { activo: false } });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
