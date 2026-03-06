import prisma from './prisma';

interface ItemParaDescontar {
  productoId: string;
  cantidad: number;
  ventaId: string;
}

export async function descontarStockFIFO(items: ItemParaDescontar[]) {
  for (const item of items) {
    let cantidadRestante = item.cantidad;

    // Obtener lotes ordenados por fecha de vencimiento (FIFO: vence antes, sale primero)
    const lotes = await prisma.lote.findMany({
      where: {
        productoId: item.productoId,
        cantidad: { gt: 0 }
      },
      orderBy: [
        { fechaVencimiento: 'asc' }, // null va al final con NULLS LAST no disponible directamente
        { fechaIngreso: 'asc' }
      ]
    });

    // Separar lotes con fecha de vencimiento y sin ella
    const lotesConVenc = lotes.filter((l) => l.fechaVencimiento !== null);
    const lotesSinVenc = lotes.filter((l) => l.fechaVencimiento === null);
    const lotesOrdenados = [...lotesConVenc, ...lotesSinVenc];

    for (const lote of lotesOrdenados) {
      if (cantidadRestante <= 0) break;

      const aDescontar = Math.min(lote.cantidad, cantidadRestante);

      await prisma.lote.update({
        where: { id: lote.id },
        data: { cantidad: lote.cantidad - aDescontar }
      });

      await prisma.movimiento.create({
        data: {
          loteId: lote.id,
          tipo: 'SALIDA',
          cantidad: aDescontar,
          motivo: 'Venta',
          ventaId: item.ventaId
        }
      });

      cantidadRestante -= aDescontar;
    }

    if (cantidadRestante > 0) {
      throw new Error(`Stock insuficiente para producto ${item.productoId}`);
    }
  }
}

export async function stockDisponible(productoId: string): Promise<number> {
  const resultado = await prisma.lote.aggregate({
    where: { productoId, cantidad: { gt: 0 } },
    _sum: { cantidad: true }
  });
  return resultado._sum.cantidad ?? 0;
}

export async function verificarStockSuficiente(items: { productoId: string; cantidad: number }[]): Promise<void> {
  for (const item of items) {
    const disponible = await stockDisponible(item.productoId);
    if (disponible < item.cantidad) {
      const producto = await prisma.producto.findUnique({ where: { id: item.productoId } });
      throw new Error(`Stock insuficiente para "${producto?.nombre}". Disponible: ${disponible}, solicitado: ${item.cantidad}`);
    }
  }
}
