import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { ventas: { orderBy: { fecha: 'desc' }, take: 10 } }
    });
    if (!cliente) return res.status(404).json({ error: 'No encontrado' });
    return res.json(cliente);
  }

  if (req.method === 'PUT') {
    const cliente = await prisma.cliente.update({ where: { id }, data: req.body });
    return res.json(cliente);
  }

  if (req.method === 'DELETE') {
    await prisma.cliente.delete({ where: { id } });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
