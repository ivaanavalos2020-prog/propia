/**
 * Plantillas de email para el sistema de pagos de contratos.
 * Todos los emails se envían vía Resend API (RESEND_API_KEY).
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://propia.com.ar'
const FROM = 'PROPIA <noreply@propia.com.ar>'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface EmailResult {
  ok: boolean
  error?: string
}

// ── Helper interno de envío ────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada — email no enviado')
    return { ok: false, error: 'RESEND_API_KEY no configurada' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Resend error:', body)
      return { ok: false, error: body }
    }

    return { ok: true }
  } catch (err) {
    console.error('[email] Error de red:', err)
    return { ok: false, error: String(err) }
  }
}

// ── TEMPLATE 1 — Recordatorio de pago (dueño → inquilino) ────────────────

export async function enviarRecordatorioPago(opts: {
  tenantEmail: string
  tenantName: string
  conceptLabel: string
  periodLabel: string
  amount: string // ya formateado con formatMonto()
  dueDate: string // ya formateado con formatFechaAR()
  contractId: string
  messageCustom?: string | null
}): Promise<EmailResult> {
  const subject = `Recordatorio de pago — ${opts.conceptLabel} ${opts.periodLabel}`

  const customSection = opts.messageCustom
    ? `<p style="background:#f8fafc;border-left:3px solid #2563eb;padding:12px 16px;border-radius:4px;color:#374151;">${opts.messageCustom}</p>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:#2563eb;padding:24px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">💳 Recordatorio de pago</p>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:4px 0 0;">De parte de tu dueño</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hola <strong>${opts.tenantName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">Te recordamos sobre el siguiente pago pendiente:</p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Concepto</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.conceptLabel}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Período</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.periodLabel}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Monto</td>
            <td style="color:#2563eb;font-size:16px;font-weight:700;text-align:right;">${opts.amount}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Vencimiento</td>
            <td style="color:#dc2626;font-size:13px;font-weight:600;text-align:right;">${opts.dueDate}</td>
          </tr>
        </table>
      </div>

      ${customSection}

      <a href="${BASE_URL}/mis-pagos"
         style="display:block;background:#2563eb;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;margin-top:20px;">
        Ver mis pagos en PROPIA
      </a>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
        PROPIA · Alquileres sin intermediarios
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({ to: opts.tenantEmail, subject, html })
}

// ── TEMPLATE 2 — Notificación al dueño cuando inquilino marca pagado ──────

export async function notificarPagoMarcado(opts: {
  ownerEmail: string
  tenantName: string
  conceptLabel: string
  periodLabel: string
  amount: string
  contractId: string
  hasProof: boolean
}): Promise<EmailResult> {
  const subject = `${opts.tenantName} marcó como pagado: ${opts.conceptLabel} ${opts.periodLabel}`

  const proofNote = opts.hasProof
    ? '<p style="color:#059669;font-size:14px;">📎 Subió un comprobante de pago adjunto.</p>'
    : ''

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:#059669;padding:24px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">✅ Pago registrado</p>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:4px 0 0;">Tu inquilino marcó un pago como realizado</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        <strong>${opts.tenantName}</strong> marcó como pagado el siguiente concepto:
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #bbf7d0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Concepto</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.conceptLabel}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Período</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.periodLabel}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Monto</td>
            <td style="color:#059669;font-size:16px;font-weight:700;text-align:right;">${opts.amount}</td>
          </tr>
        </table>
      </div>

      ${proofNote}

      <a href="${BASE_URL}/dashboard/contratos/${opts.contractId}"
         style="display:block;background:#1e293b;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;margin-top:20px;">
        Ver en mi dashboard
      </a>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
        PROPIA · Alquileres sin intermediarios
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({ to: opts.ownerEmail, subject, html })
}

// ── TEMPLATE 3 — Bienvenida al inquilino cuando se crea el contrato ───────

export async function notificarNuevoContrato(opts: {
  tenantEmail: string
  tenantName: string
  ownerName: string
  propertyAddress: string
  startDate: string
  endDate: string
}): Promise<EmailResult> {
  const subject = `Tu dueño cargó tu contrato en PROPIA`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:#2563eb;padding:24px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">🏠 Tu contrato en PROPIA</p>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:4px 0 0;">Gestión de pagos simplificada</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hola <strong>${opts.tenantName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        <strong>${opts.ownerName}</strong> cargó tu contrato de alquiler en PROPIA.
        Ahora podés ver todos tus pagos y obligaciones en un solo lugar.
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Propiedad</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.propertyAddress}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Inicio</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.startDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:13px;padding:6px 0;">Fin</td>
            <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${opts.endDate}</td>
          </tr>
        </table>
      </div>

      <a href="${BASE_URL}/mis-pagos"
         style="display:block;background:#2563eb;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;">
        Ver mis pagos y obligaciones
      </a>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
        Si no reconocés este contrato o no sos inquilino en esta propiedad, podés ignorar este email con seguridad.
      </p>
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        PROPIA · Alquileres sin intermediarios
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail({ to: opts.tenantEmail, subject, html })
}
