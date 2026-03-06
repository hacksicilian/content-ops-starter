import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { stockDisponible } from '../../../lib/stock';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const { categoria, activo, search } = req.query;
    const productos = await prisma.producto.findMany({
      where: {
        ...(categoria ? { categoria: String(categoria) } : {}),
        ...(activo !== undefined ? { activo: activo === 'true' } : {}),
        ...(search ? { nombre: { contains: String(search), mode: 'insensitive' } } : {})
      },
      orderBy: { nombre: 'asc' }
    });

    const productosConStock = await Promise.all(
      productos.map(async (p) => ({
        ...p,
        stockActual: await stockDisponible(p.id)
      }))
    );

    return res.json(productosConStock);
  }

  if (req.method === 'POST') {
    const { nombre, codigoNatura, descripcion, categoria, precioVenta, precioCosto, imagenUrl, stockMinimo } = req.body;

    if (!nombre || !categoria || precioVenta == null || precioCosto == null) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const producto = await prisma.producto.create({
      data: { nombre, codigoNatura, descripcion, categoria, precioVenta: Number(precioVenta), precioCosto: Number(precioCosto), imagenUrl, stockMinimo: Number(stockMinimo ?? 3) }
    });
    return res.status(201).json(producto);
  }

  res.status(405).end();
}
