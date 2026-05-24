import type { Order } from "@/domain/models/order";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Buyer: order confirmation ─────────────────────────────────────────────

export function buyerConfirmationHtml(order: Order, storeName: string): string {
  const itemsRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        <span style="font-weight:600;">${item.productName}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">
        ${formatPrice(item.unitPrice)}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">
        ${formatPrice(item.unitPrice * item.quantity)}
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;">¡Gracias por tu compra!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                Tu pedido fue confirmado exitosamente
              </p>
            </td>
          </tr>

          <!-- Order info -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#888;">N° de pedido</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#111;font-family:monospace;">
                      #${order.orderId.substring(0, 12)}
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:13px;color:#888;">Fecha</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#333;">
                      ${formatDate(order.createdAt)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products table -->
          <tr>
            <td style="padding:16px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8f9fa;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#888;">Producto</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;text-transform:uppercase;color:#888;">Cant.</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#888;">Precio</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;text-transform:uppercase;color:#888;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:8px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Subtotal</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${formatPrice(order.totals.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Envío</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${formatPrice(order.totals.shipping)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Impuestos</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${formatPrice(order.totals.taxes)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 6px;border-top:2px solid #eee;font-size:16px;font-weight:700;color:#111;">Total</td>
                  <td style="padding:12px 0 6px;border-top:2px solid #eee;font-size:16px;font-weight:700;color:#111;text-align:right;">${formatPrice(order.totals.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery info -->
          <tr>
            <td style="padding:16px 40px 8px;">
              <h3 style="margin:0 0 12px;font-size:15px;color:#333;">Dirección de envío</h3>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
                ${order.customer.name} ${order.customer.lastName}<br>
                ${order.customer.street} ${order.customer.number}${order.customer.floor ? `, Piso ${order.customer.floor}` : ""}${order.customer.apartment ? `, Depto ${order.customer.apartment}` : ""}<br>
                ${order.customer.city}, ${order.customer.province} — CP ${order.customer.postalCode}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:13px;color:#888;">
                ${storeName} · Ante cualquier duda, respondé este correo o contactanos a través de nuestra web.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#aaa;">
                © ${new Date().getFullYear()} ${storeName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Admin: new sale notification ──────────────────────────────────────────

export function adminNotificationHtml(order: Order, storeName: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#2563eb);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;">🛒 ¡Nueva venta realizada!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                Se registró un nuevo pedido en ${storeName}
              </p>
            </td>
          </tr>

          <!-- Order info -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#888;">N° de pedido</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#111;font-family:monospace;">
                      #${order.orderId.substring(0, 12)}
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:13px;color:#888;">Fecha</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#333;">
                      ${formatDate(order.createdAt)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer info -->
          <tr>
            <td style="padding:8px 40px;">
              <div style="background:#f8f9fa;border-radius:12px;padding:16px;">
                <p style="margin:0 0 4px;font-size:13px;color:#888;">Cliente</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#111;">
                  ${order.customer.name} ${order.customer.lastName}
                </p>
                <p style="margin:4px 0 0;font-size:14px;color:#555;">
                  ${order.customer.email}
                </p>
              </div>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:16px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Productos</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${order.items.length} item${order.items.length !== 1 ? "s" : ""}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Total abonado</td>
                  <td style="padding:6px 0;font-size:14px;color:#059669;text-align:right;font-weight:700;">${formatPrice(order.totals.total)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Método de pago</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">
                    ${order.payment?.paymentMethodId || "Tarjeta"}
                    ${order.payment?.installments ? `(${order.payment.installments} cuotas)` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products list -->
          <tr>
            <td style="padding:8px 40px 24px;">
              <h3 style="margin:0 0 12px;font-size:14px;color:#333;">Detalle del pedido</h3>
              ${order.items
                .map(
                  (item) => `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">
                  <span style="color:#333;">${item.productName} <span style="color:#888;">x${item.quantity}</span></span>
                  <span style="color:#333;font-weight:600;">${formatPrice(item.unitPrice * item.quantity)}</span>
                </div>`
                )
                .join("")}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:13px;color:#888;">
                Gestioná este pedido desde el panel de administración de ${storeName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
