import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

// Mapeo flexible de columnas del Excel de Natura
function mapearColumnas(row: Record<string, string>) {
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]));

  const codigoNatura =
    lower['código'] || lower['codigo'] || lower['cod.'] || lower['cod'] || lower['code'] || '';
  const nombre =
    lower['descripción'] || lower['descripcion'] || lower['nombre'] || lower['produto'] || lower['name'] || '';
  const categoria =
    lower['categoría'] || lower['categoria'] || lower['category'] || lower['línea'] || lower['linea'] || 'General';
  const precioVenta =
    lower['precio lista'] || lower['precio de lista'] || lower['pvp'] || lower['precio venta'] || lower['price'] || '0';
  const precioCosto =
    lower['precio costo'] || lower['precio de compra'] || lower['costo'] || lower['cost'] || '0';

  return {
    codigoNatura: codigoNatura.trim() || null,
    nombre: nombre.trim(),
    categoria: categoria.trim(),
    precioVenta: parseFloat(precioVenta.replace(',', '.').replace(/[^0-9.]/g, '')) || 0,
    precioCosto: parseFloat(precioCosto.replace(',', '.').replace(/[^0-9.]/g, '')) || 0
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'No autorizado' });
  if (req.method !== 'POST') return res.status(405).end();

  const { rows } = req.body as { rows: Record<string, string>[] };
  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Se esperan rows como array de objetos' });
  }

  let creados = 0;
  let actualizados = 0;
  const errores: string[] = [];

  for (const row of rows) {
    try {
      const datos = mapearColumnas(row);
      if (!datos.nombre) continue;

      const existing = datos.codigoNatura
        ? await prisma.producto.findUnique({ where: { codigoNatura: datos.codigoNatura } })
        : null;

      if (existing) {
        await prisma.producto.update({
          where: { id: existing.id },
          data: {
            nombre: datos.nombre,
            categoria: datos.categoria,
            precioVenta: datos.precioVenta || existing.precioVenta,
            precioCosto: datos.precioCosto || existing.precioCosto
          }
        });
        actualizados++;
      } else {
        await prisma.producto.create({ data: { ...datos, activo: true } });
        creados++;
      }
    } catch (e: any) {
      errores.push(e.message);
    }
  }

  return res.json({ creados, actualizados, errores });
}
