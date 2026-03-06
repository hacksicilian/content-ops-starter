import type { NextApiRequest, NextApiResponse } from 'next';
import { payment } from '../../../lib/mercadopago';
import prisma from '../../../lib/prisma';
import { descontarStockFIFO } from '../../../lib/stock';

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;

  if (type === 'payment' && data?.id) {
    try {
      const pago = await payment.get({ id: data.id });

      if (pago.status === 'approved') {
        const ventaId = pago.external_reference;
        if (ventaId) {
          const venta = await prisma.venta.findUnique({
            where: { id: ventaId },
            include: { items: true }
          });

          if (venta && venta.estadoPago !== 'PAGADO') {
            await prisma.venta.update({
              where: { id: ventaId },
              data: {
                estadoPago: 'PAGADO',
                mpPaymentId: String(pago.id)
              }
            });

            // Descontar stock si aún no se hizo (venta online)
            if (venta.estadoPago === 'PENDIENTE') {
              await descontarStockFIFO(
                venta.items.map((i) => ({
                  productoId: i.productoId,
                  cantidad: i.cantidad,
                  ventaId: venta.id
                }))
              );
            }
          }
        }
      }
    } catch (e) {
      console.error('Webhook MP error:', e);
    }
  }

  // Siempre responder 200 para que MP no reintente
  return res.status(200).json({ ok: true });
}
