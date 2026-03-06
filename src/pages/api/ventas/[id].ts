import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        items: { include: { producto: true } },
        cliente: true,
        vendedor: { select: { nombre: true, email: true } }
      }
    });
    if (!venta) return res.status(404).json({ error: 'No encontrada' });
    return res.json(venta);
  }

  if (req.method === 'PUT') {
    const venta = await prisma.venta.update({
      where: { id },
      data: req.body
    });
    return res.json(venta);
  }

  res.status(405).end();
}
