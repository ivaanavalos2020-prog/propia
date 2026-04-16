import type { ConceptType } from './types'

export interface PaymentPortal {
  readonly id: string
  readonly name: string
  readonly url: string
  readonly description: string
  readonly available_in: readonly string[] // ['*'] = nacional
}

// Mapa inmutable de portales por concepto
export const PAYMENT_PORTALS = {
  abl: [
    {
      id: 'gcba-abl',
      name: 'Portal GCBA',
      url: 'https://www.buenosaires.gob.ar/tramites/pago-abl',
      description: 'Portal oficial del Gobierno de la Ciudad de Buenos Aires',
      available_in: ['CABA'],
    },
    {
      id: 'rapipago-abl',
      name: 'Rapipago',
      url: 'https://www.rapipago.com.ar',
      description: 'Pago en efectivo o desde la app',
      available_in: ['*'],
    },
    {
      id: 'pagofacil-abl',
      name: 'Pago Fácil',
      url: 'https://www.pagofacil.com.ar',
      description: 'Pago en efectivo o desde la app',
      available_in: ['*'],
    },
  ],
  arba: [
    {
      id: 'arba-oficial',
      name: 'ARBA',
      url: 'https://www.arba.gov.ar/Aplicaciones/InicioPagos.aspx',
      description: 'Portal oficial de la Agencia de Recaudación de Buenos Aires',
      available_in: ['Buenos Aires'],
    },
    {
      id: 'rapipago-arba',
      name: 'Rapipago',
      url: 'https://www.rapipago.com.ar',
      description: 'Pago en efectivo o desde la app',
      available_in: ['*'],
    },
  ],
  municipal: [
    {
      id: 'pagomiscuentas',
      name: 'PagoMisCuentas',
      url: 'https://www.pagomiscuentas.com',
      description: 'Pago online desde home banking',
      available_in: ['*'],
    },
    {
      id: 'rapipago-municipal',
      name: 'Rapipago',
      url: 'https://www.rapipago.com.ar',
      description: 'Pago en efectivo o desde la app',
      available_in: ['*'],
    },
    {
      id: 'pagofacil-municipal',
      name: 'Pago Fácil',
      url: 'https://www.pagofacil.com.ar',
      description: 'Pago en efectivo o desde la app',
      available_in: ['*'],
    },
  ],
  expensas_ordinarias: [
    {
      id: 'expensaspagas',
      name: 'Expensas Pagas',
      url: 'https://www.expensaspagas.com.ar',
      description: 'Plataforma líder de pago de expensas en Argentina',
      available_in: ['*'],
    },
    {
      id: 'mercadopago-expensas',
      name: 'Mercado Pago',
      url: 'https://www.mercadopago.com.ar',
      description: 'Buscá tu consorcio y pagá online',
      available_in: ['*'],
    },
    {
      id: 'rapipago-expensas',
      name: 'Rapipago',
      url: 'https://www.rapipago.com.ar',
      description: 'Pago en efectivo o desde la app',
      available_in: ['*'],
    },
  ],
  expensas_extraordinarias: [
    {
      id: 'expensaspagas-ext',
      name: 'Expensas Pagas',
      url: 'https://www.expensaspagas.com.ar',
      description: 'Plataforma líder de pago de expensas en Argentina',
      available_in: ['*'],
    },
    {
      id: 'mercadopago-expensas-ext',
      name: 'Mercado Pago',
      url: 'https://www.mercadopago.com.ar',
      description: 'Buscá tu consorcio y pagá online',
      available_in: ['*'],
    },
  ],
  seguro_caucion: [
    {
      id: 'fianzasonline',
      name: 'Fianzas Online',
      url: 'https://www.fianzasonline.com.ar',
      description: 'Seguro de caución para inquilinos sin garantía',
      available_in: ['*'],
    },
    {
      id: 'mercadopago-garantias',
      name: 'Mercado Pago Garantías',
      url: 'https://www.mercadopago.com.ar/garantias-de-alquiler',
      description: 'Garantía de alquiler integrada en Mercado Pago',
      available_in: ['*'],
    },
  ],
  seguro_edificio: [
    {
      id: 'mercadopago-seguros',
      name: 'Mercado Pago Seguros',
      url: 'https://www.mercadopago.com.ar/seguros',
      description: 'Consultá y pagá tu seguro online',
      available_in: ['*'],
    },
  ],
  // alquiler, otro: sin portales (pago directo o a convenir)
} as const satisfies Partial<Record<ConceptType, readonly PaymentPortal[]>>

export type PortalConceptType = keyof typeof PAYMENT_PORTALS

// Type guard: verifica si un concept_type tiene portales
export function hasPaymentPortals(
  conceptType: string,
): conceptType is PortalConceptType {
  return conceptType in PAYMENT_PORTALS
}

// Obtener portales para un concepto (nunca tira, siempre retorna array)
export function getPortalesForConcept(
  conceptType: string,
): readonly PaymentPortal[] {
  if (!hasPaymentPortals(conceptType)) return []
  return PAYMENT_PORTALS[conceptType]
}

// Abrir portal externo de forma segura
// noopener: evita que la nueva pestaña acceda a window.opener
// noreferrer: no envía el referrer header (privacidad)
export function openPaymentPortal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Guía de pago por concepto (texto para el usuario final)
export const PAYMENT_GUIDE: Partial<Record<ConceptType, {
  icon: string
  title: string
  instructions: string
}>> = {
  alquiler: {
    icon: '🏠',
    title: 'Alquiler',
    instructions:
      'Transferí directamente a tu dueño usando el CBU o alias que te haya dado. Siempre guardá el comprobante de la transferencia.',
  },
  expensas_ordinarias: {
    icon: '🏢',
    title: 'Expensas ordinarias',
    instructions:
      'Pagá en el portal de tu administración, en Expensas Pagas o a través de Mercado Pago buscando tu consorcio. Si no sabés el código de pago, consultá con tu administrador.',
  },
  expensas_extraordinarias: {
    icon: '🏢',
    title: 'Expensas extraordinarias',
    instructions:
      'Igual que las expensas ordinarias. Consultá con tu administrador el código de pago específico para este concepto.',
  },
  abl: {
    icon: '🏛️',
    title: 'ABL (CABA)',
    instructions:
      'Pagá en el portal oficial del Gobierno de la Ciudad de Buenos Aires ingresando la partida inmobiliaria, o en cualquier sucursal de Rapipago o Pago Fácil presentando la boleta.',
  },
  arba: {
    icon: '🏛️',
    title: 'Impuesto inmobiliario (ARBA)',
    instructions:
      'Pagá en el portal oficial de ARBA con la partida inmobiliaria, desde tu home banking o en Rapipago con la boleta impresa.',
  },
  municipal: {
    icon: '🏛️',
    title: 'Tasa municipal',
    instructions:
      'Consultá con tu municipio cómo obtener la boleta. Generalmente se paga en Rapipago, Pago Fácil o desde el home banking de tu banco.',
  },
  seguro_edificio: {
    icon: '🔐',
    title: 'Seguro del edificio',
    instructions:
      'Contactá directamente a la aseguradora del consorcio. El número de póliza lo tiene el administrador del edificio.',
  },
  seguro_caucion: {
    icon: '🔒',
    title: 'Seguro de caución',
    instructions:
      'Contactá a tu aseguradora directamente. Fianzas Online y Mercado Pago Garantías son las más usadas en Argentina para alquileres.',
  },
}
