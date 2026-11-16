# Entrega · Fase 1 de Jardín Eterno

## Resultado

Página vertical completa en `/invitacion/laura-martin`, basada en el mockup de cinco pantallas, conservando contrato tipado, repositorio, renderer y configuración centralizada. Sin reconstruir la aplicación ni añadir dependencias.

## Archivos modificados

- `src/features/invitations/types.ts`: campos visuales opcionales y sección de cuenta regresiva.
- `src/features/invitations/config/laura-martin.ts`: contenido romántico, fotografías, paleta, cinco actividades y secciones activas.
- `src/features/invitations/validation.ts`: validación de fotos de historia/lugares y nueva sección.
- `src/features/invitations/InvitationRenderer.tsx`: portada, orden de secciones y cierre reutilizables.
- `src/components/wedding/Sections.tsx`: historia con foto, lugares, timeline, galería ampliable, vestimenta y regalos.
- `src/components/ui/Section.tsx`, `ActionLink.tsx`: encabezados ornamentales y variantes de enlace.
- `src/themes/registry.ts`, `botanical/theme.css`, `src/styles/base.css`: gráficos registrados, fuentes locales, tokens y composición responsive.
- `src/lib/dates.ts`: opción de formato de 24 horas sin cambiar el comportamiento predeterminado.
- `tests/core.test.ts`: fixture con fotografías de otro slug y prueba del contador.
- `README.md`, `public/invitations/laura-martin/README.md`: documentación actualizada.

## Archivos nuevos

- `src/features/invitations/config/assets.ts`: registro tipado de fotografías locales.
- `src/lib/countdown.ts`: cálculo puro con límite en cero.
- `src/components/wedding/Countdown.tsx`: contador funcional con limpieza de intervalo y sin errores de hidratación.
- `src/components/wedding/Reveal.tsx`: mejora de aparición progresiva con IntersectionObserver; contenido visible sin JS y sin movimiento cuando se solicita.
- `src/components/wedding/Rsvp.tsx`: campos visuales nativos dentro de una región accesible de formulario, sin mecanismo de envío. No necesita Client Component ni puede enviar respuestas al pulsar Enter.
- `src/components/ui/Icon.tsx`, `BotanicalDecoration.tsx`: iconografía y ornamentos reutilizables.
- `src/themes/botanical/icons.ts`: trazados lineales propios.
- `public/themes/botanical/{floral-corner.webp,sprig.svg}`.
- Seis fotos WebP en `public/invitations/laura-martin/photos/`.
- Tres fuentes TTF y sus tres licencias en `public/fonts/`.
- `docs/visual-assets.md`, este informe y capturas en `docs/screenshots/`.

## Recursos y diferencias

Cormorant Garamond para encabezados, Great Vibes para nombres/firma/agradecimiento e Inter para controles. Paleta marfil, verde oliva, salvia y champagne. Fotos de demostración de Unsplash, ornamento original creado con ImageGen integrado, SVG propios; todo servido localmente. [Procedencia y prompt](visual-assets.md).

El mockup se adapta a una página sin teléfonos; escritorio con papel centrado de 760 px como máximo. Fotos y flores propias; jardín en lugar de iglesia; horarios preservados desde la configuración inicial. El contador muestra el tiempo real y ceros si la fecha vence. Los botones de ubicación y regalos son opcionales y no aparecen sin URLs válidas. El formulario identifica la demostración y deshabilita WhatsApp.

## Comprobaciones

- `npm run lint`: aprobado sin advertencias.
- `npm run typecheck`: aprobado.
- `npm test`: diez pruebas aprobadas, incluido contador vencido y desglose de días/horas/minutos/segundos.
- `npm run build`: aprobado con pre-renderizado de la demo.
- `npm start`: inicio correcto. HTTP 200 en raíz, demo, ornamento y fuente; 404 para slug inexistente.
- Navegador: revisión de portada, historia, foto, contador, lugares, itinerario, galería y RSVP; ampliación de fotos, salto a RSVP, campos de demostración y Enter sin transmisión.
- Anchos CSS medidos: 320, 375, 390, 430, 768, 1024 y 1440. Sin scroll horizontal ni desbordamiento de nombres. Resultados en `screenshots/responsive.json`; el viewport temporal se restauró al terminar.
- Capturas: `mobile-cover.png`, `mobile-gallery.png`, `mobile-rsvp.png`, `desktop-cover.png`. Son capturas por viewport; las animaciones de aparición se revisan navegando por la página.
- `prefers-reduced-motion` aplicado en CSS y respetado por Reveal. No se realizó una auditoría de accesibilidad exhaustiva ni una prueba con lector de pantalla.

## Pendientes y siguiente fase recomendada

Revisión y aprobación visual del usuario, sustitución de imágenes ilustrativas y datos ficticios, y URLs reales de mapas/regalos. Después de aprobar esta fase, definir requisitos de RSVP real y privacidad antes de conectar un canal. No se implementa esa siguiente fase aquí.

Sin backend, autenticación, Supabase, commits, push ni despliegue. El repositorio de Giuliett no se modificó.
