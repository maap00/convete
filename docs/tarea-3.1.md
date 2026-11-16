# Convete · Tarea 3.1 · RSVP por WhatsApp

## Resultado

El formulario existente se convierte en Client Component y conserva tipografías, paleta, ornamentos y distribución de la sección. Recibe únicamente la configuración RSVP y una etiqueta de pareja/evento; no contiene nombres ni teléfonos concretos. El renderer deriva la etiqueta de `couple` o usa `rsvp.eventLabel`.

Las demos conservan sus configuraciones: Laura y Martín muestra el formulario inactivo sin receptor; Ana y Carlos sigue con la sección oculta. No se incorporaron teléfonos reales ni se modificó el resto del contenido aprobado.

## Archivos creados

- `src/features/rsvp/types.ts`: contrato RSVP, datos de entrada, resultado validado, errores y estados de disponibilidad.
- `src/features/rsvp/whatsapp.ts`: validación pura, normalización del receptor, cálculo de disponibilidad, mensaje, URL y preparación completa sin efectos secundarios.
- `tests/rsvp.test.ts`: veinte casos nuevos con runner nativo de Node.
- `docs/screenshots/rsvp-responsive.json`: medidas del formulario activo a 320, 375, 390, 430, 768, 1024 y 1440 px CSS.
- Este informe y captura de la demo con RSVP actualizado.

## Archivos modificados

- `src/components/wedding/Rsvp.tsx`: estado de campos, ninguna asistencia inicial, acompañantes condicionales, errores accesibles, botón configurable, verificación de disponibilidad y navegación explícita.
- `src/features/invitations/types.ts`: reutiliza `RSVPConfig` en lugar de duplicar sus campos.
- `src/features/invitations/validation.ts`: fecha opcional, validación del receptor y textos configurables, límite predeterminado de dos acompañantes.
- `src/features/invitations/InvitationRenderer.tsx`: pasa la identificación correcta al formulario compartido.
- `src/styles/base.css`: solo errores, foco de campos inválidos, ajuste táctil de etiquetas y mensajes largos.
- `scripts/verify-http.mjs`: reconoce el formulario real, ausencia de radio preseleccionado y ausencia de links de WhatsApp en las demos sin receptor.
- `README.md`: guía de configuración, pruebas, privacidad y límites.

Sin dependencias nuevas. Se retiró la página local temporal `rsvp-qa` antes de la compilación final; no es una tercera invitación ni una ruta entregada.

## Funciones implementadas

- `validateRSVPInput()`: nombre obligatorio, normalización de espacios, máximo 100 caracteres, selección explícita y cantidad entera dentro del límite. Rechazo implica cero acompañantes.
- `normalizeWhatsAppPhone()`: acepta formato internacional con separadores permitidos y devuelve solo dígitos; comprueba estructura, no existencia de cuenta.
- `getRSVPAvailability()`: ready, disabled, missing-phone, invalid-phone, expired o invalid-deadline. La fecha límite es opcional e inclusiva.
- `buildWhatsAppRSVPMessage()`: mensaje positivo/negativo con textos personalizables, sin campos de acompañantes en rechazo y con total calculado solo en aceptación.
- `buildWhatsAppRSVPUrl()`: host HTTPS fijo `wa.me`, teléfono normalizado y mensaje codificado con URLSearchParams.
- `prepareWhatsAppRSVP()`: combina validación, disponibilidad y preparación; no navega, no hace peticiones, no guarda datos ni envía mensajes.

El único efecto externo está en el submit explícito del componente: `window.location.assign(url)` síncrono, misma pestaña, sin popup. Se indica que WhatsApp abrirá la respuesta preparada y el invitado aún debe enviarla. No existe un estado «enviado».

## Verificación

- TypeScript, ESLint y build de producción aprobados.
- Suite completa: 40 casos aprobados, incluidos los 20 requeridos de RSVP. Se mantiene el snapshot de Laura y Martín y la independencia entre configuraciones.
- HTTP: ambas demos 200, SEO y secciones correctos; slug inexistente 404. Las demos no exponen enlaces a teléfonos ficticios ni reales.
- Navegador: ninguna respuesta preseleccionada; validación vacía con foco; conservación del nombre; selector 0/1/2 al aceptar; ocultación y normalización a cero al rechazar; bloqueo por fecha vencida y teléfono ausente; apertura explícita del enlace con datos sintéticos, sin pulsar Enviar.
- El caso de apertura utilizó exclusivamente `+1 202-555-0123`, del [rango ficticio no operativo reservado por NANPA](https://www.nanpa.com/numbering/555-line-numbers). Este número no se configura en las invitaciones. La prueba solo abrió la pantalla web de WhatsApp, sin contactar ni enviar mensajes a una persona.
- Formulario activo sin scroll horizontal en los siete anchos. Ajuste de viewport restaurado al finalizar.
- Página temporal de QA retirada; build final contiene únicamente raíz, 404 y las dos invitaciones registradas.

## Límites y próximos pasos

La aplicación prepara un enlace, no garantiza apertura de la app ni envío. No comprueba la existencia del receptor, conectividad, inicio de sesión o aceptación del mensaje. El nombre/respuesta se incorporan a la URL de WhatsApp solo tras la acción del invitado. No existe almacenamiento en Convete, seguimiento ni registro de asistencias. Los datos permanecen únicamente en la memoria del formulario mientras está abierto.

Para una invitación real falta proporcionar un teléfono autorizado, activar RSVP y revisar fechas/textos; no se solicita un receptor real para las demos. Un reloj cliente incorrecto puede afectar la fecha límite, que no constituye una restricción de servidor.

No se implementa la Tarea 3.2. Su alcance debe autorizarse por separado. Sin backend, Supabase, autenticación, panel, servicios de envío, commits, push ni despliegue.

## Ejemplos generados (solo datos ficticios, no abrir como destinatario real)

Aceptación:

```text
Hola, Laura y Martín.

Quiero confirmar mi asistencia a su boda.

Nombre: Juan Pérez
Asistencia: Sí, asistiré.
Acompañantes: 1
Total de personas: 2

¡Nos vemos en la celebración!
```

Rechazo:

```text
Hola, Ana y Carlos.

Gracias por la invitación.

Nombre: Juan Pérez
Asistencia: No podré asistir.

Les deseo una celebración maravillosa.
```

URL de ejemplo con número ficticio reservado (bloque de código, no enlace):

```text
https://wa.me/12025550123?text=Hola%2C+Laura+y+Mart%C3%ADn.%0A%0AQuiero+confirmar+mi+asistencia+a+su+boda.%0A%0ANombre%3A+Juan+P%C3%A9rez%0AAsistencia%3A+S%C3%AD%2C+asistir%C3%A9.%0AAcompa%C3%B1antes%3A+1%0ATotal+de+personas%3A+2%0A%0A%C2%A1Nos+vemos+en+la+celebraci%C3%B3n%21
```

Formato basado en la [documentación oficial de WhatsApp](https://faq.whatsapp.com/5913398998672934).
