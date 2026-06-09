/**
 * Map Mercado Pago error messages (English) to user-friendly Spanish.
 * Used on both server (MP order API) and client (checkout forms).
 */

const ERROR_MAP: [RegExp, string][] = [
  // ── Amount / range ────────────────────────────────────────────────────────
  [/transaction amount is outside the valid range/i,
   "El monto de la compra está fuera del rango permitido para este medio de pago."],
  [/invalid amount|amount must be|amount is invalid/i,
   "El monto ingresado no es válido. Revisá el producto e intentá de nuevo."],
  [/minimum amount/i,
   "El monto mínimo para pagar con tarjeta no se alcanzó. Probá con otro medio de pago."],

  // ── Card / token ─────────────────────────────────────────────────────────
  [/invalid card number|card number is invalid/i,
   "El número de tarjeta ingresado no es válido. Revisalo e intentá de nuevo."],
  [/invalid.*security code|invalid.*cvv|cvv.*invalid/i,
   "El código de seguridad ingresado no es válido."],
  [/invalid.*expiration|expir.*invalid/i,
   "La fecha de vencimiento de la tarjeta no es válida."],
  [/card declined|payment rejected|rejected.*payment/i,
   "La tarjeta fue rechazada. Probá con otra tarjeta o medio de pago."],
  [/insufficient.*funds|without.*funds|insufficient.*amount|sin fondos|saldo insuficiente/i,
   "La tarjeta no tiene fondos suficientes. Probá con otra tarjeta."],

  // ── MP rejection codes (status_detail) ──────────────────────────────────
  [/cc_rejected_insufficient_amount/i,
   "La tarjeta no tiene fondos suficientes. Probá con otra tarjeta."],
  [/cc_rejected_bad_filled_card_number/i,
   "El número de tarjeta ingresado no es válido. Revisalo e intentá de nuevo."],
  [/cc_rejected_bad_filled_date/i,
   "La fecha de vencimiento de la tarjeta no es válida."],
  [/cc_rejected_bad_filled_security_code/i,
   "El código de seguridad ingresado no es válido."],
  [/cc_rejected_card_disabled|cc_rejected_blacklist/i,
   "La tarjeta no está habilitada para pagos online. Comunicate con tu banco."],
  [/cc_rejected_duplicate_payment/i,
   "Ya existe un pago en proceso con estos datos. Esperá unos minutos."],
  [/cc_rejected_high_risk/i,
   "El pago fue rechazado por medidas de seguridad. Probá con otra tarjeta."],
  [/cc_rejected_max_attempts/i,
   "Alcanzaste el límite de intentos. Esperá unos minutos y volvé a intentar."],
  [/cc_rejected_other_reason/i,
   "La tarjeta fue rechazada. Probá con otra tarjeta o medio de pago."],

  [/card.*not.*support|not.*support.*card/i,
   "Esta tarjeta no está habilitada. Probá con otro medio de pago."],
  [/invalid.*cardholder|cardholder.*invalid|cardholder name/i,
   "El nombre del titular de la tarjeta no es válido."],
  [/card.*expired|expired.*card|expir.*tarjet/i,
   "La tarjeta está vencida. Usá otra tarjeta."],

  // ── Payment method ────────────────────────────────────────────────────────
  [/payment method not supported|payment_method.*invalid/i,
   "El medio de pago seleccionado no está disponible. Probá con otro."],
  [/invalid.*payment|payment.*invalid/i,
   "Hubo un problema con el medio de pago. Intentá de nuevo."],

  // ── Rate limiting / timeout ───────────────────────────────────────────────
  [/too many requests|rate limit/i,
   "Estamos procesando muchas solicitudes. Esperá unos segundos e intentá de nuevo."],
  [/timeout|timed out|took too long/i,
   "La operación tardó demasiado. Intentá de nuevo."],

  // ── Generic MP errors ─────────────────────────────────────────────────────
  [/internal server error|internal_error/i,
   "Hubo un error interno. Ya lo estamos revisando. Intentá de nuevo en unos minutos."],
  [/bad request|invalid parameters/i,
   "Hay datos inválidos en la solicitud. Revisá los campos e intentá de nuevo."],
  [/not found|resource.*not found/i,
   "No se encontró el recurso solicitado. Intentá de nuevo."],
  [/unauthorized|forbidden|invalid_token/i,
   "No autorizado. Si el problema persiste, contactanos."],
  [/conflict|already exists/i,
   "Ya existe una solicitud en proceso. Esperá unos minutos."],

  // ── Generic fallback (DEBE SER EL ÚLTIMO — atrapa cualquier "error" en inglés) ──
  [/error/i,
   "Ocurrió un error al procesar el pago. Intentá de nuevo."],
];

/**
 * Translate an MP error message to Spanish.
 * Siempre devuelve español — si no hay match, usa el fallback genérico.
 */
export function translateMpError(message: string): string {
  if (!message) return "Ocurrió un error al procesar el pago.";

  for (const [pattern, translation] of ERROR_MAP) {
    if (pattern.test(message)) {
      return translation;
    }
  }

  // Nunca devolver inglés crudo. Si llegamos acá, es porque algo no está cubierto.
  return "Ocurrió un error al procesar el pago. Intentá de nuevo.";
}

/**
 * Wrapper for catch blocks: extracts message from any error shape
 * and translates it to Spanish.
 */
export function formatAndTranslateError(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : typeof err === "object" && err && "message" in err
          ? String((err as Record<string, unknown>).message)
          : "Ocurrió un error inesperado.";

  return translateMpError(message);
}
