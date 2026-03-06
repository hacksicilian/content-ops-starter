import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

export const preference = new Preference(client);
export const payment = new Payment(client);

export interface ItemMP {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export async function crearPreferencia(items: ItemMP[], ventaId: string, baseUrl: string) {
  const response = await preference.create({
    body: {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'ARS'
      })),
      back_urls: {
        success: `${baseUrl}/tienda/confirmacion?ventaId=${ventaId}&status=success`,
        failure: `${baseUrl}/tienda/confirmacion?ventaId=${ventaId}&status=failure`,
        pending: `${baseUrl}/tienda/confirmacion?ventaId=${ventaId}&status=pending`
      },
      auto_return: 'approved',
      external_reference: ventaId,
      notification_url: `${baseUrl}/api/mercadopago/webhook`
    }
  });

  return response;
}
