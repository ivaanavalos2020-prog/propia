export interface Zona {
  value: string
  label: string
  filterCity?: string    // city value for DB filter; if undefined → text input, no city filter
  localidades?: string[] // if defined → dropdown; if undefined → text input
}

export interface ProvinciaConfig {
  label: string           // matches PROVINCIAS values (stored in properties.city)
  cityValue: string       // exact value stored in properties.city
  zonas?: Zona[]          // if defined → show zone select (step 2)
  localidades?: string[]  // if no zonas but has localidades → direct to barrio select (step 2)
  // if neither → text input for localidad
}

export const UBICACIONES: ProvinciaConfig[] = [
  // ── CABA: direct to 48 barrios ─────────────────────────────────────────────
  {
    label: 'CABA',
    cityValue: 'CABA',
    localidades: [
      'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano',
      'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales',
      'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal',
      'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat', 'Nueva Pompeya',
      'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas',
      'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra',
      'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sársfield', 'Versalles',
      'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre',
      'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón',
      'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati',
      'Villa Urquiza',
    ],
  },

  // ── Buenos Aires: GBA zones ─────────────────────────────────────────────────
  {
    label: 'Buenos Aires',
    cityValue: 'Buenos Aires',
    zonas: [
      {
        value: 'gba-norte',
        label: 'GBA Norte',
        filterCity: 'Buenos Aires',
        localidades: [
          'Florida', 'Olivos', 'Munro', 'Villa Martelli', 'La Lucila', 'Martínez',
          'Acassuso', 'Beccar', 'Boulogne', 'San Isidro', 'Villa Adelina',
          'San Fernando', 'Don Torcuato', 'El Talar', 'Nordelta', 'Tigre',
          'Del Viso', 'Manuel Alberti', 'Pilar', 'Fátima',
          'Belén de Escobar', 'Garín', 'Maquinista Savio',
          'San Martín', 'Villa Lynch', 'Villa Maipú', 'José León Suárez',
          'Ciudadela', 'Caseros', 'El Palomar', 'Malvinas Argentinas', 'José C. Paz',
        ],
      },
      {
        value: 'gba-sur',
        label: 'GBA Sur',
        filterCity: 'Buenos Aires',
        localidades: [
          'Banfield', 'Lomas de Zamora', 'Temperley', 'Turdera', 'Villa Fiorito',
          'Lanús', 'Remedios de Escalada', 'Monte Chingolo',
          'Avellaneda', 'Dock Sud', 'Villa Domínico', 'Wilde',
          'Bernal', 'Berazategui', 'Quilmes', 'Don Bosco', 'Ezpeleta',
          'Adrogué', 'Burzaco', 'Claypole', 'Don Orione', 'Longchamps',
          'Monte Grande', 'El Jagüel', '9 de Abril',
          'Ezeiza', 'Tristán Suárez',
          'Florencio Varela', 'Bosques', 'Presidente Perón',
        ],
      },
      {
        value: 'gba-oeste',
        label: 'GBA Oeste',
        filterCity: 'Buenos Aires',
        localidades: [
          'Ramos Mejía', 'San Justo', 'Isidro Casanova', 'González Catán',
          'Ciudad Evita', 'Tapiales', 'Villa Luzuriaga',
          'Morón', 'Castelar', 'Haedo', 'Ituzaingó',
          'Hurlingham', 'William Morris', 'Villa Tesei',
          'Merlo', 'Mariano Acosta', 'Pontevedra', 'San Antonio de Padua',
          'Moreno', 'Francisco Álvarez', 'Paso del Rey',
          'General Rodríguez', 'Marcos Paz', 'Luján',
        ],
      },
      {
        value: 'gba-este',
        label: 'GBA Este',
        filterCity: 'Buenos Aires',
        localidades: [
          'La Plata', 'Berisso', 'City Bell', 'Gonnet', 'Los Hornos',
          'Melchor Romero', 'Tolosa', 'Villa Elisa', 'Ensenada',
          'Brandsen', 'Cañuelas', 'General Las Heras',
        ],
      },
      {
        value: 'interior-ba',
        label: 'Interior Buenos Aires',
        // no filterCity → text input, user types city name
      },
    ],
  },

  // ── Córdoba ─────────────────────────────────────────────────────────────────
  {
    label: 'Córdoba',
    cityValue: 'Córdoba',
    zonas: [
      {
        value: 'cordoba-capital',
        label: 'Córdoba Capital',
        filterCity: 'Córdoba',
        localidades: [
          'Nueva Córdoba', 'General Paz', 'Güemes', 'Alberdi', 'Cofico',
          'Cerro de las Rosas', 'Country Club', 'Villa Belgrano', 'Arguello',
          'Colinas de Vélez Sársfield', 'Jardín', 'San Vicente', 'Urca',
          'Talleres', 'Observatorio', 'Alta Córdoba', 'Barrio Jardín', 'Villa Cabrera',
        ],
      },
      {
        value: 'gran-cordoba',
        label: 'Gran Córdoba',
        filterCity: 'Córdoba',
        localidades: [
          'Villa Carlos Paz', 'La Calera', 'Malvinas Argentinas', 'Mendiolaza',
          'Unquillo', 'Río Ceballos', 'Saldán', 'Malagueño', 'Falda del Carmen',
        ],
      },
      {
        value: 'interior-cordoba',
        label: 'Interior Córdoba',
        // no filterCity → text input
      },
    ],
  },

  // ── Santa Fe ─────────────────────────────────────────────────────────────────
  {
    label: 'Santa Fe',
    cityValue: 'Santa Fe',
    zonas: [
      {
        value: 'rosario',
        label: 'Rosario',
        filterCity: 'Rosario',
        localidades: [
          'Centro', 'República de la Sexta', 'Pichincha', 'Belgrano', 'Echesortu',
          'Abasto', 'Fisherton', 'Arroyito', 'Las Delicias', 'Martín',
          'Constitución', 'La Florida', 'Villa del Parque', 'Aviación',
        ],
      },
      {
        value: 'santa-fe-capital',
        label: 'Santa Fe Capital',
        filterCity: 'Santa Fe',
        // no localidades → text input for barrio
      },
      {
        value: 'interior-santa-fe',
        label: 'Interior Santa Fe',
        // no filterCity → text input
      },
    ],
  },

  // ── Mendoza ─────────────────────────────────────────────────────────────────
  {
    label: 'Mendoza',
    cityValue: 'Mendoza',
    zonas: [
      {
        value: 'gran-mendoza',
        label: 'Gran Mendoza',
        filterCity: 'Mendoza',
        localidades: [
          'Centro', 'Godoy Cruz', 'Guaymallén', 'Las Heras', 'Luján de Cuyo',
          'Maipú', 'Chacras de Coria', 'Vistalba', 'Dorrego', 'Palmira',
        ],
      },
      {
        value: 'interior-mendoza',
        label: 'Interior Mendoza',
        // no filterCity → text input
      },
    ],
  },
]

// Provinces without special config → text input for localidad
export const PROVINCIAS_ORDENADAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
  'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
] as const

export function getProvinciaConfig(label: string): ProvinciaConfig | undefined {
  return UBICACIONES.find((p) => p.label === label)
}
