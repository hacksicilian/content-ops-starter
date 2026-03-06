import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { crearPreferencia } from '../../../lib/mercadopago';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, clienteNombre, clienteEmail, ventaId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items requeridos' });
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.host}`;
    const pref = await crearPreferencia(items, ventaId || 'online', baseUrl);

    // Guardar preferenceId en la venta si se provee ventaId
    if (ventaId) {
      await prisma.venta.update({
        where: { id: ventaId },
        data: { mpPreferenceId: pref.id }
      });
    }

    return res.json({ preferenceId: pref.id, initPoint: pref.init_point, sandboxInitPoint: pref.sandbox_init_point });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
