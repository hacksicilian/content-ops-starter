import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  const { id } = req.query as { id: string };

  if (req.method === 'PUT') {
    const lote = await prisma.lote.update({
      where: { id },
      data: req.body
    });
    return res.json(lote);
  }

  if (req.method === 'DELETE') {
    await prisma.lote.delete({ where: { id } });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
