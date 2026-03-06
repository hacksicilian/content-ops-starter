import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const { search } = req.query;
    const clientes = await prisma.cliente.findMany({
      where: search
        ? {
            OR: [
              { nombre: { contains: String(search), mode: 'insensitive' } },
              { telefono: { contains: String(search) } },
              { email: { contains: String(search), mode: 'insensitive' } }
            ]
          }
        : {},
      orderBy: { nombre: 'asc' }
    });
    return res.json(clientes);
  }

  if (req.method === 'POST') {
    const { nombre, telefono, email, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
    const cliente = await prisma.cliente.create({ data: { nombre, telefono, email, direccion } });
    return res.status(201).json(cliente);
  }

  res.status(405).end();
}
