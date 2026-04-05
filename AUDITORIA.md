# AUDITORÍA TÉCNICA COMPLETA — PROPIA

**Fecha:** 4 de abril de 2026
**Archivos analizados:** 73
**Líneas de código:** ~15,000+
**Total de problemas encontrados: 47**

---

## RESUMEN EJECUTIVO

| Severidad | Cantidad |
|-----------|----------|
| 🔴 CRÍTICO | 6 |
| 🟠 ALTO | 15 |
| 🟡 MEDIO | 16 |
| 🟢 BAJO | 10 |
| **TOTAL** | **47** |

---

## TOP 3 MÁS URGENTES

**1. 🔴 Exposición de API Key en logs** — `src/app/api/ubicacion-info/route.ts` línea ~20
Fix en 10 minutos. Un `console.log` imprime los primeros 8 caracteres de la ANTHROPIC_API_KEY en logs de servidor.

**2. 🔴 console.log con PII del usuario** — `src/app/perfil/page.tsx` líneas ~509, 526, 635, 643
Fix en 15 minutos. User IDs y emails expuestos en logs de servidor. Problema legal (GDPR/CCPA).

**3. 🔴 JSON.parse sin try/catch en formulario publicar** — `src/app/publicar/page.tsx` líneas ~280, 310
Fix en 10 minutos. App crash para cualquier usuario con un draft corrupto en localStorage.

---

## PROBLEMAS CRÍTICOS (6)

---

### CRÍTICO #1 — Email de admin hardcodeado en 4 archivos

**SEVERIDAD:** CRÍTICO
**ARCHIVOS:**
- `src/app/admin/page.tsx`
- `src/app/api/admin/propiedad/route.ts`
- `src/app/api/admin/verificacion/route.ts`
- `src/app/api/admin/signed-urls/route.ts`

**PROBLEMA:** El email `ivaan.avalos2020@gmail.com` está hardcodeado directamente en código fuente en 4 archivos distintos.

**IMPACTO:** Si el email cambia hay que editar en 4 lugares. Si el repositorio se expone públicamente, el email del administrador es visible. Seguridad frágil y difícil de mantener.

**CORRECCIÓN:**
```bash
# Agregar a .env.local
ADMIN_EMAIL=ivaan.avalos2020@gmail.com
```
```ts
// src/config.ts (nuevo archivo)
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
```
Reemplazar todas las ocurrencias por `import { ADMIN_EMAIL } from '@/config'`.

---

### CRÍTICO #2 — Exposición parcial de API Key en logs

**SEVERIDAD:** CRÍTICO
**ARCHIVO:** `src/app/api/ubicacion-info/route.ts`
**LÍNEA:** ~20

**PROBLEMA:**
```ts
console.log('[ubicacion-info] ANTHROPIC_API_KEY present:', !!apiKey, apiKey ? `(${apiKey.slice(0, 8)}...)` : '')
```
Imprime los primeros 8 caracteres de la API key de Anthropic en los logs del servidor.

**IMPACTO:** Viola principios de seguridad básicos. Cualquiera con acceso a logs del servidor puede ver un fragmento de la clave. Las credenciales nunca deben aparecer en logs bajo ninguna circunstancia.

**CORRECCIÓN:**
```ts
// Reemplazar por:
console.log('[ubicacion-info] API key configured:', !!apiKey)
```

---

### CRÍTICO #3 — JSON.parse sin try/catch en localStorage

**SEVERIDAD:** CRÍTICO
**ARCHIVO:** `src/app/publicar/page.tsx`
**LÍNEAS:** ~280, ~310

**PROBLEMA:** `JSON.parse()` sobre datos de `localStorage` sin manejo de error. Si el JSON guardado está malformado (sesión interrumpida, corrupción de datos), la app crashea con excepción no capturada.

**IMPACTO:** App inutilizable para usuarios que tengan un draft corrupto guardado. El usuario no puede acceder al formulario de publicar.

**CORRECCIÓN:**
```ts
// Línea ~280
try {
  const saved = localStorage.getItem(DRAFT_KEY)
  if (saved) {
    const parsed = JSON.parse(saved) as { data: FormData; savedAt: string }
    // ...resto de la lógica
  }
} catch {
  // Draft corrupto — ignorar silenciosamente
  localStorage.removeItem(DRAFT_KEY)
}

// Línea ~310 (misma lógica en restaurarBorrador)
function restaurarBorrador() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as { data: FormData; savedAt: string }
      setForm(parsed.data ?? (parsed as unknown as FormData))
    }
  } catch {
    localStorage.removeItem(DRAFT_KEY)
  }
  setMostrarRestaurar(false)
}
```

---

### CRÍTICO #4 — .map() sobre arrays potencialmente null

**SEVERIDAD:** CRÍTICO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`
**LÍNEAS:** ~621, ~634

**PROBLEMA:**
```ts
{(propiedad.guarantees_accepted as string[]).map((g) => (...))}
{(propiedad.services_included as string[]).map((s) => (...))}
```
El cast `as string[]` no garantiza que el valor sea un array. Si la propiedad no tiene garantías o servicios en la DB (null/undefined), esto lanza un TypeError en runtime.

**IMPACTO:** Runtime crash. La página de detalle de propiedad es inutilizable para propiedades que no cargaron estos campos.

**CORRECCIÓN:**
```ts
{((propiedad.guarantees_accepted as string[]) ?? []).map((g) => (...))}
{((propiedad.services_included as string[]) ?? []).map((s) => (...))}
// O mejor aún:
{(Array.isArray(propiedad.guarantees_accepted) ? propiedad.guarantees_accepted : []).map(...)}
```

---

### CRÍTICO #5 — PII expuesto en console.log del perfil

**SEVERIDAD:** CRÍTICO
**ARCHIVO:** `src/app/perfil/page.tsx`
**LÍNEAS:** ~509, ~526, ~635, ~643

**PROBLEMA:** Múltiples `console.log` exponen datos personales del usuario:
```ts
console.log('USER:', user?.id, user?.email, userError)
console.log('PROFILE LOADED:', profile, profileError)
console.log('GUARDANDO:', updateData)
console.log('RESULTADO:', data, 'ERROR:', error)
```

**IMPACTO:** Los logs del servidor contienen PII (Personally Identifiable Information). Cualquiera con acceso a los logs puede ver user IDs, emails, y datos del perfil. Incumple GDPR y CCPA.

**CORRECCIÓN:** Eliminar todos estos `console.log` completamente. Si se necesita debugging, usar un flag de desarrollo:
```ts
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info (no PII)')
}
```

---

### CRÍTICO #6 — BASE_URL hardcodeada

**SEVERIDAD:** CRÍTICO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`
**LÍNEA:** ~16

**PROBLEMA:**
```ts
const BASE_URL = 'https://propia-kappa.vercel.app'
```
URL de producción hardcodeada. Se usa para Open Graph tags, canonical URLs y compartir en redes sociales.

**IMPACTO:** Si el dominio cambia (dominio propio, staging, preview deploys), todos los links de Open Graph y SEO apuntan al dominio incorrecto.

**CORRECCIÓN:**
```ts
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propia-kappa.vercel.app'
```
```bash
# .env.local
NEXT_PUBLIC_BASE_URL=https://propia-kappa.vercel.app
```

---

## PROBLEMAS ALTOS (15)

---

### ALTO #1 — Type cast de email null en responder-mensaje

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/api/responder-mensaje/route.ts`
**LÍNEA:** ~63

**PROBLEMA:**
```ts
const senderEmail = mensaje.sender_email as string
```
`sender_email` puede ser null. El cast fuerza el tipo pero si el valor es null, se envía el email de notificación a `"null"` literalmente, o falla al construir el request.

**IMPACTO:** Las notificaciones de respuesta nunca llegan al inquilino si no tiene email registrado. Fallo silencioso.

**CORRECCIÓN:**
```ts
const senderEmail = mensaje.sender_email as string | null
if (!senderEmail) {
  return NextResponse.json({ ok: true, skipped: 'no sender email' })
}
```

---

### ALTO #2 — Conversión de precio sin validación en publicar

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/publicar/page.tsx`
**LÍNEA:** ~415

**PROBLEMA:**
```ts
price_usd: Number(form.precio),
```
Si `form.precio` es `""` o `"abc"`, `Number()` retorna `0` o `NaN`. No hay validación previa.

**IMPACTO:** Propiedades se insertan con precio `0` o `NaN`. Las búsquedas por precio retornan resultados incorrectos.

**CORRECCIÓN:**
```ts
const price = parseFloat(form.precio)
if (isNaN(price) || price <= 0) {
  setError('El precio debe ser un número mayor a cero.')
  setPublicando(false)
  return
}
// Luego usar price en el insert
price_usd: price,
```

---

### ALTO #3 — fetch sin try/catch en VentajasUbicacion

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/propiedades/[id]/VentajasUbicacion.tsx`
**LÍNEA:** ~156

**PROBLEMA:** La llamada a `/api/ubicacion-info` no tiene `try/catch`. Si Claude API está caído o la red falla, el componente no muestra nada y no hay fallback UI.

**IMPACTO:** En caso de error de la API, el componente queda en estado de carga indefinido o en blanco. El usuario no sabe qué pasó.

**CORRECCIÓN:**
```ts
try {
  const res = await fetch('/api/ubicacion-info', { ... })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  setInfo(data)
} catch {
  setError('No pudimos cargar información de la zona.')
}
```

---

### ALTO #4 — Acceso a content[0] sin verificación en mejorar-descripcion

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/api/mejorar-descripcion/route.ts`
**LÍNEA:** ~47

**PROBLEMA:** Acceso a `message.content[0].type` sin verificar que `content` tiene elementos.

**IMPACTO:** Si Claude retorna respuesta vacía o inesperada, la route crashea con error 500.

**CORRECCIÓN:**
```ts
const texto = message.content?.[0]?.type === 'text'
  ? (message.content[0] as { type: 'text'; text: string }).text
  : ''
if (!texto) return NextResponse.json({ error: 'Sin respuesta de IA' }, { status: 500 })
```

---

### ALTO #5 — Fallo silencioso en upsert de perfil durante auth callback

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/auth/callback/route.ts`
**LÍNEA:** ~23

**PROBLEMA:**
```ts
} catch { /* no bloquear el login si falla */ }
```
Si el upsert a la tabla `profiles` falla (por ejemplo, error de constraint), el error se descarta completamente sin logging.

**IMPACTO:** El usuario puede iniciar sesión pero sin email guardado en `profiles`. Esto rompe la funcionalidad de contacto y la vista del admin.

**CORRECCIÓN:**
```ts
} catch (err) {
  // No bloquear login, pero sí loguear el error
  console.error('[auth/callback] Error en upsert de profiles:', err)
}
```

---

### ALTO #6 — Propiedad eliminada causa crash en inbox de mensajes

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/dashboard/mensajes/InboxMensajes.tsx`
**LÍNEAS:** ~24–25

**PROBLEMA:**
```ts
const prop = m.properties as unknown as PropRow
// Luego se accede a prop.address, prop.photo_urls, etc. sin verificar null
```
Si la propiedad asociada al mensaje fue eliminada, `m.properties` es null y el acceso crashea.

**IMPACTO:** El inbox completo falla si algún mensaje tiene la propiedad eliminada.

**CORRECCIÓN:**
```ts
const prop = m.properties as unknown as PropRow
if (!prop) return null // Filtrar mensajes huérfanos
```

---

### ALTO #7 — Sin rollback en favoritos

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/propiedades/[id]/BotonFavorito.tsx`
**LÍNEAS:** ~28–37

**PROBLEMA:** Las operaciones `.delete()` e `.insert()` no tienen manejo de error. El estado local cambia optimistamente pero si la operación de DB falla, el estado queda inconsistente.

**IMPACTO:** El usuario ve el ícono como favorito guardado, recarga la página y el favorito no existe. Experiencia confusa.

**CORRECCIÓN:**
```ts
const prevState = isFav
setIsFav(!isFav) // Optimistic update
const { error } = await supabase.from('favoritos')...
if (error) {
  setIsFav(prevState) // Rollback
  toast('No se pudo guardar el favorito')
}
```

---

### ALTO #8 — Query de profiles sin manejo de error en Navbar/Perfil

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/perfil/page.tsx`
**LÍNEA:** ~270

**PROBLEMA:**
```ts
supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
  .then(({ data }) => { setNavInfo({ ... }) })
// Sin .catch()
```

**IMPACTO:** Si la query falla, el navbar queda vacío sin indicación de error al usuario.

**CORRECCIÓN:**
```ts
.then(({ data, error }) => {
  if (error) console.error('Error loading profile for nav:', error.code)
  setNavInfo({ email: user.email ?? null, name: data?.full_name ?? null, avatar: data?.avatar_url ?? null })
})
```

---

### ALTO #9 — guarantees_accepted sin verificación de array en editar

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/dashboard/publicaciones/[id]/editar/page.tsx`
**LÍNEAS:** ~110–111

**PROBLEMA:**
```ts
guaranteesInicial={(propiedad.guarantees_accepted as string[]) ?? []}
servicesInicial={(propiedad.services_included as string[]) ?? []}
```
El cast `as string[]` no protege contra un valor que no sea array (podría ser un objeto, string, o null no capturado por `??`).

**IMPACTO:** La página de editar puede fallar al cargar si los campos están en formato inesperado en la DB.

**CORRECCIÓN:**
```ts
guaranteesInicial={Array.isArray(propiedad.guarantees_accepted) ? propiedad.guarantees_accepted : []}
servicesInicial={Array.isArray(propiedad.services_included) ? propiedad.services_included : []}
```

---

### ALTO #10 — Promise.all sin manejo de rechazos individuales

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`
**LÍNEA:** ~250

**PROBLEMA:** `Promise.all()` agrupa múltiples queries. Si una falla, toda la página 404 o 500.

**IMPACTO:** Si el servicio de reviews está caído, toda la página de propiedad es inaccesible aunque los datos principales existan.

**CORRECCIÓN:**
```ts
const [reviewsResult, ...otros] = await Promise.allSettled([
  supabase.from('reviews')...,
  // ...otras queries
])
const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data ?? [] : []
```

---

### ALTO #11 — Filtro de precio con NaN en ListadoConFiltros

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/propiedades/ListadoConFiltros.tsx`
**LÍNEA:** ~435

**PROBLEMA:**
```ts
const minUSD = moneda === 'ars' ? Number(precioMin) / ARS_TO_USD : Number(precioMin)
```
Si `precioMin` es `""`, `Number("")` retorna `0`. Si es un string no numérico, retorna `NaN`.

**IMPACTO:** El filtro de precio retorna resultados incorrectos o vacíos.

**CORRECCIÓN:**
```ts
const minRaw = parseFloat(precioMin)
const minUSD = isNaN(minRaw) ? undefined : (moneda === 'ars' ? minRaw / ARS_TO_USD : minRaw)
```

---

### ALTO #12 — Race condition en validación de admin

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/admin/page.tsx`
**LÍNEA:** ~235

**PROBLEMA:** Las queries de datos se inician antes de que el `useEffect` de validación de admin termine. Hay un período donde se hacen queries sin confirmar que el usuario es admin.

**IMPACTO:** Race condition. Potencialmente se muestran datos antes de confirmar permisos.

**CORRECCIÓN:** Mover `cargarDatos()` para ejecutarse solo después de confirmar que `isAdmin === true`.

---

### ALTO #13 — propiedadId sin validación de formato UUID

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/api/admin/propiedad/route.ts`
**LÍNEA:** ~21

**PROBLEMA:** `propiedadId` se usa directamente en queries sin validar que sea un UUID válido.

**IMPACTO:** Un atacante puede pasar IDs malformados que causen errores de DB inesperados o comportamientos no definidos.

**CORRECCIÓN:**
```ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!UUID_REGEX.test(propiedadId)) {
  return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
}
```

---

### ALTO #14 — fetch a Claude sin timeout explícito

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/publicar/page.tsx`
**LÍNEA:** ~360

**PROBLEMA:** La llamada a `/api/mejorar-descripcion` (que a su vez llama a Claude API) no tiene timeout. Si Claude está lento, la UI muestra el spinner indefinidamente.

**IMPACTO:** El usuario puede quedar esperando minutos sin poder hacer nada. No hay forma de cancelar.

**CORRECCIÓN:**
```ts
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 20_000)
try {
  const res = await fetch('/api/mejorar-descripcion', {
    ...,
    signal: controller.signal,
  })
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    setErrorIA('Tiempo de espera agotado. Intentá de nuevo.')
  }
} finally {
  clearTimeout(timeout)
}
```

---

### ALTO #15 — Validación de nombre bypasseable en formulario de contacto

**SEVERIDAD:** ALTO
**ARCHIVO:** `src/app/propiedades/[id]/ModalContacto.tsx`
**LÍNEA:** ~114

**PROBLEMA:** El campo `nombre` solo tiene `required` en HTML. Cualquier request programático (curl, Postman, scripts) puede enviar mensajes sin nombre.

**IMPACTO:** Se pueden enviar mensajes anónimos o con nombres vacíos. Spam potencial.

**CORRECCIÓN:**
```ts
async function handleEnviar() {
  if (!nombre.trim()) {
    setError('El nombre es requerido.')
    return
  }
  if (nombre.trim().length < 2) {
    setError('El nombre debe tener al menos 2 caracteres.')
    return
  }
  // continuar con el envío
}
```

---

## PROBLEMAS MEDIOS (16)

---

### MEDIO #1 — Inconsistencia de versiones de modelo Claude

**SEVERIDAD:** MEDIO
**ARCHIVOS:**
- `src/app/api/ubicacion-info/route.ts` — usa `claude-sonnet-4-6`
- `src/app/api/mejorar-descripcion/route.ts` — usa `claude-haiku-4-5-20251001`

**PROBLEMA:** Dos endpoints usan versiones de Claude diferentes sin razón documentada.

**IMPACTO:** Resultados inconsistentes. Si un modelo se descontinúa, hay que cambiar en múltiples lugares.

**CORRECCIÓN:**
```bash
# .env.local
ANTHROPIC_MODEL_SMART=claude-sonnet-4-6
ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001
```

---

### MEDIO #2 — dangerouslySetInnerHTML en JSON-LD sin sanitizar

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`
**LÍNEA:** ~343

**PROBLEMA:** El JSON-LD se inserta con `dangerouslySetInnerHTML` y la descripción de la propiedad no está escapada. Si contiene `</script>`, el HTML se rompe.

**IMPACTO:** El Schema.org JSON-LD queda inválido. Los buscadores no leen los metadatos correctamente.

**CORRECCIÓN:** `JSON.stringify()` ya escapa correctamente los caracteres especiales. Verificar que se usa en todo el objeto, no solo en partes.

---

### MEDIO #3 — lang="en" en sitio español

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/layout.tsx`
**LÍNEA:** ~37

**PROBLEMA:** `<html lang="en">` en un sitio 100% en español argentino.

**IMPACTO:** Screen readers anuncian en inglés. Google puede clasificar el sitio como inglés. Penalización de SEO.

**CORRECCIÓN:** Cambiar a `<html lang="es-AR">`.

---

### MEDIO #4 — photo_urls sin Array.isArray()

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`
**LÍNEA:** ~304

**PROBLEMA:**
```ts
const fotos: string[] = propiedad.photo_urls ?? []
```
Si `photo_urls` es un string o un objeto inesperado (no null), la operación `?? []` no protege.

**IMPACTO:** Galería no carga o muestra datos malformados.

**CORRECCIÓN:**
```ts
const fotos: string[] = Array.isArray(propiedad.photo_urls) ? propiedad.photo_urls : []
```

---

### MEDIO #5 — Draft de publicar sin límite de tamaño en localStorage

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/publicar/page.tsx`
**LÍNEA:** ~298

**PROBLEMA:** El draft se guarda en localStorage cada 30 segundos sin controlar el tamaño. Si el formulario crece (descripciones largas, etc.), puede acercarse al límite de localStorage (~5MB).

**IMPACTO:** El navegador puede rechazar el guardado. Otros datos en localStorage se pueden perder.

**CORRECCIÓN:** Comprimir el draft o guardar solo los campos que cambiaron. Limpiar drafts de más de 7 días.

---

### MEDIO #6 — Mensajes con propiedad eliminada no se filtran

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/mensajes/page.tsx`
**LÍNEA:** ~18

**PROBLEMA:** Si la propiedad relacionada a un mensaje fue eliminada, la join retorna null para `properties` y el render puede fallar.

**IMPACTO:** La página de mensajes del inquilino se rompe si tiene mensajes de propiedades eliminadas.

**CORRECCIÓN:** Filtrar mensajes donde la propiedad es null antes de renderizar.

---

### MEDIO #7 — URL de Resend hardcodeada

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/api/responder-mensaje/route.ts`
**LÍNEA:** ~73

**PROBLEMA:** `'https://api.resend.com/emails'` hardcodeada en código.

**CORRECCIÓN:** Usar la SDK oficial de Resend o mover a constante/env var.

---

### MEDIO #8 — TIPO_LABEL con type null retorna string "null"

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`
**LÍNEA:** ~89

**PROBLEMA:**
```ts
TIPO_LABEL[propiedad.type] ?? propiedad.type
```
Si `propiedad.type` es null, `TIPO_LABEL[null]` es undefined, luego `?? null` retorna `null`, que React renderiza como nada. Pero si se usa en template string, aparece `"null"`.

**CORRECCIÓN:**
```ts
TIPO_LABEL[propiedad.type ?? ''] ?? 'Propiedad'
```

---

### MEDIO #9 — Memory leak por URL.createObjectURL sin revocar

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/publicar/page.tsx`
**LÍNEA:** ~335

**PROBLEMA:** `URL.createObjectURL()` crea URLs de objeto que deben revocarse con `revokeObjectURL()`. No se garantiza que siempre se revoca (especialmente en el cleanup de `useEffect`).

**IMPACTO:** Consumo de memoria que aumenta mientras el usuario cambia fotos. El navegador se lentifica en sesiones largas.

**CORRECCIÓN:** En el cleanup de `useEffect` o al desmontar el componente, iterar sobre todas las previews y revocarlas.

---

### MEDIO #10 — Errores de Supabase mostrados raw al usuario

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/perfil/page.tsx`
**LÍNEA:** ~296

**PROBLEMA:** Los mensajes de error de Supabase (ej: `"duplicate key value violates unique constraint"`) se muestran directamente al usuario sin transformar.

**IMPACTO:** Información técnica sensible visible. UX degradada con mensajes que el usuario no entiende.

**CORRECCIÓN:** Mapear errores de DB a mensajes en español:
```ts
function parsearError(error: PostgrestError): string {
  if (error.code === '23505') return 'Ya existe un registro con esos datos.'
  return 'Ocurrió un error. Intentá de nuevo.'
}
```

---

### MEDIO #11 — .single() en lugar de .maybeSingle() en Navbar

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/components/Navbar.tsx`
**LÍNEA:** ~18

**PROBLEMA:** `.single()` lanza error si no encuentra la fila. En el primer login, el perfil puede no existir aún en la tabla `profiles`.

**IMPACTO:** Navbar muestra error en el primer acceso del usuario.

**CORRECCIÓN:** Cambiar a `.maybeSingle()` que retorna `null` en lugar de error si no hay fila.

---

### MEDIO #12 — useRef para toast sin usar en admin

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/admin/page.tsx`
**LÍNEA:** ~161

**PROBLEMA:** `const cerrarToastRef = useRef()` declarado pero nunca utilizado. Código muerto.

**CORRECCIÓN:** Eliminar la referencia y usar `setToast(null)` directamente donde se necesite.

---

### MEDIO #13 — ContadorVistas sin catch

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/propiedades/[id]/ContadorVistas.tsx`
**LÍNEA:** ~9

**PROBLEMA:** `.rpc('increment_property_views')` sin manejo de error. Si la función RPC no existe o falla, el error es silencioso.

**CORRECCIÓN:**
```ts
supabase.rpc('increment_property_views', { prop_id: id })
  .catch((err) => console.error('Error contando vista:', err))
```

---

### MEDIO #14 — Páginas sin metadata SEO

**SEVERIDAD:** MEDIO
**ARCHIVOS:** `src/app/dashboard/page.tsx`, `src/app/favoritos/page.tsx`, `src/app/mensajes/page.tsx`

**PROBLEMA:** Estas páginas no tienen `export const metadata` ni `generateMetadata`. Google las indexa sin título ni descripción.

**CORRECCIÓN:**
```ts
export const metadata: Metadata = {
  title: 'Mi dashboard — Propia',
  description: 'Gestioná tus publicaciones de alquiler.',
}
```

---

### MEDIO #15 — Alt text genérico en galería de fotos

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/propiedades/[id]/GaleriaFotos.tsx`
**LÍNEA:** ~42

**PROBLEMA:** `alt={`Foto ${activa + 1}`}` — genérico y no describe el contenido.

**IMPACTO:** SEO débil. Accesibilidad no óptima para usuarios con screen readers.

**CORRECCIÓN:** Pasar `propertyAddress` como prop y usar:
```ts
alt={`Foto ${activa + 1} de ${propertyAddress}`}
```

---

### MEDIO #16 — fecha_nacimiento sin validación de formato

**SEVERIDAD:** MEDIO
**ARCHIVO:** `src/app/perfil/page.tsx`
**LÍNEA:** ~509

**PROBLEMA:** El campo `fecha_nacimiento` se maneja como string y se envía a la DB sin validar que sea una fecha válida en formato ISO (YYYY-MM-DD).

**IMPACTO:** La DB puede rechazar el valor o guardar datos inválidos.

**CORRECCIÓN:**
```ts
if (fechaNacimiento) {
  const fecha = new Date(fechaNacimiento)
  if (isNaN(fecha.getTime())) {
    setError('Fecha de nacimiento inválida.')
    return
  }
}
```

---

## PROBLEMAS BAJOS (10)

---

### BAJO #1 — Type cast innecesario en favoritos

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/app/favoritos/page.tsx`
**LÍNEA:** ~28

**PROBLEMA:** Type cast `as unknown as TipoEsperado` innecesario.

**CORRECCIÓN:** Eliminar el cast o tipar correctamente la query de Supabase.

---

### BAJO #2 — Acceso a photo_urls[0] inconsistente entre componentes

**SEVERIDAD:** BAJO
**ARCHIVOS:** `src/app/propiedades/ListadoConBuscador.tsx`, `ListadoConFiltros.tsx`

**PROBLEMA:** Algunos componentes usan `p.photo_urls?.[0]` y otros no verifican. Inconsistencia en el codebase.

**CORRECCIÓN:** Crear helper:
```ts
// src/lib/utils.ts
export function getFirstPhoto(photoUrls: unknown): string | null {
  return Array.isArray(photoUrls) && photoUrls.length > 0 ? photoUrls[0] : null
}
```

---

### BAJO #3 — Timeout de API hardcodeado

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/app/api/ubicacion-info/route.ts`
**LÍNEA:** ~66

**PROBLEMA:** Timeout de 15 segundos hardcodeado en el código.

**CORRECCIÓN:** `const timeout = parseInt(process.env.CLAUDE_TIMEOUT_MS ?? '15000')`

---

### BAJO #4 — Mensajes de contacto hardcodeados

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/app/propiedades/[id]/BotonesContacto.tsx`
**LÍNEA:** ~6

**PROBLEMA:** Texto de marketing hardcodeado. Difícil de actualizar sin modificar código.

**CORRECCIÓN:** Mover a archivo de constantes `src/lib/copy.ts`.

---

### BAJO #5 — NumericoInput no valida en submit

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/app/publicar/page.tsx`
**LÍNEA:** ~183

**PROBLEMA:** El componente `NumericoInput` controla el rango con botones, pero en el submit no se valida que los valores sean números válidos.

**CORRECCIÓN:** Validar en `handlePublicar` que todos los campos numéricos son enteros positivos.

---

### BAJO #6 — API routes sin verificación de método HTTP

**SEVERIDAD:** BAJO
**ARCHIVOS:** Múltiples routes en `src/app/api/`

**PROBLEMA:** Algunas routes no verifican que el método sea el correcto (ej: solo aceptan POST pero no rechazan GET).

**CORRECCIÓN:** En Next.js App Router, exportar solo la función del método correcto (`export async function POST(...)`) es suficiente — retorna 405 automáticamente.

---

### BAJO #7 — supabase-admin sin validación de env vars en startup

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/lib/supabase-admin.ts`
**LÍNEA:** ~9

**PROBLEMA:** Si `SUPABASE_SERVICE_ROLE_KEY` no existe, el cliente falla al usarse, no al iniciar.

**CORRECCIÓN:** Agregar validación en `next.config.ts` o en el módulo:
```ts
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
}
```

---

### BAJO #8 — Campos innecesarios en SELECT de propiedad

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/app/propiedades/[id]/page.tsx`

**PROBLEMA:** El SELECT incluye campos como `video_urls` que no se usan en la página de detalle.

**IMPACTO:** Tráfico de red innecesario.

**CORRECCIÓN:** Seleccionar solo los campos que se usan en la página.

---

### BAJO #9 — img nativo en lugar de next/image en algunos lugares

**SEVERIDAD:** BAJO
**ARCHIVOS:** Varios componentes

**PROBLEMA:** Algunos lugares usan `<img>` nativo en vez de `<Image>` de Next.js.

**IMPACTO:** Sin optimización de imágenes (resize, WebP, lazy loading).

**CORRECCIÓN:** Migrar a `<Image>` con `fill` o `width`/`height` definidos.

---

### BAJO #10 — Alt text en next/image sin contexto de propiedad

**SEVERIDAD:** BAJO
**ARCHIVO:** `src/app/propiedades/[id]/GaleriaFotos.tsx`

**PROBLEMA:** `alt="Foto 1"` sin información de la propiedad.

**CORRECCIÓN:** `alt={`Foto ${i + 1} — ${address}`}`

---

## ESTIMACIÓN DE TIEMPO

| Categoría | Cantidad | Tiempo estimado |
|-----------|----------|-----------------|
| Críticos (6) | 6 | ~2 horas |
| Altos (15) | 15 | ~1 día |
| Medios (16) | 16 | ~2 días |
| Bajos (10) | 10 | ~4 horas |
| **TOTAL** | **47** | **~4 días** |

---

## NOTAS SOBRE RLS Y STORAGE

Por limitaciones de acceso directo a la consola de Supabase, las políticas RLS y la configuración de Storage Buckets no pudieron auditarse directamente desde el código fuente. Se recomienda verificar manualmente:

1. **Tabla `mensajes`:** Política SELECT debe permitir lectura al `sender_id` Y al `owner_id` de la propiedad relacionada.
2. **Tabla `respuestas_mensajes`:** Política INSERT debe permitir inserción al dueño de la propiedad.
3. **Tabla `profiles`:** La política UPDATE debe restringir edición al propio usuario (`auth.uid() = id`).
4. **Bucket `propiedades`:** Política SELECT debe ser pública (para mostrar fotos). Política INSERT debe requerir autenticación.
5. **Bucket `verificaciones`:** Política SELECT debe estar restringida solo al admin. NO debe ser pública.
6. **Bucket `avatars`:** Política SELECT pública, INSERT solo al propio usuario.

---

*Auditoría realizada: 4 de abril de 2026*
