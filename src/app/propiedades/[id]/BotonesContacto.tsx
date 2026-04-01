'use client'

import { useState } from 'react'
import ModalContacto from './ModalContacto'

const MENSAJE_VISITA = 'Hola, estoy interesado/a en esta propiedad y me gustaría coordinar una visita.'

interface Props {
  propertyId: string
  userEmail?: string | null
  yaConsulto?: boolean
}

export default function BotonesContacto({ propertyId, userEmail, yaConsulto = false }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeInicial, setMensajeInicial] = useState('')

  function abrirComoVisita() {
    setMensajeInicial(MENSAJE_VISITA)
    setModalAbierto(true)
  }

  function abrirComoContacto() {
    setMensajeInicial('')
    setModalAbierto(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={abrirComoVisita}
        className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-4 text-base font-bold text-white transition-colors hover:bg-blue-700"
      >
        Quiero esta propiedad
      </button>
      <button
        type="button"
        onClick={abrirComoContacto}
        className="flex w-full items-center justify-center rounded-xl border border-slate-300 py-4 text-base font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
      >
        Contactar al dueño
      </button>

      <ModalContacto
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        propertyId={propertyId}
        userEmail={userEmail}
        mensajeInicial={mensajeInicial}
        yaConsulto={yaConsulto}
      />
    </>
  )
}
