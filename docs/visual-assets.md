# Recursos de Jardín Eterno

Todos los recursos servidos por la página están alojados en `public/`. No se utiliza el mockup como fondo ni se requiere conexión con un proveedor de fotografías al visualizar la invitación.

## Fotografías de demostración

Licencia: [Unsplash License](https://unsplash.com/license), que permite descargar y utilizar fotografías, incluso comercialmente. Las fotografías son ilustrativas: no representan a Laura y Martín ni a los lugares ficticios. Sustituirlas por fotografías autorizadas del cliente para una invitación real.

Registro tipado: `src/features/invitations/config/assets.ts`. Se conservan las proporciones reales y se generan versiones responsive con `next/image`. Archivos web optimizados en WebP.

| Archivo en `public/invitations/laura-martin/photos/` | Fuente |
| --- | --- |
| `couple.webp` | [550Park Luxury Wedding Films · abrazo al atardecer](https://unsplash.com/photos/a-bride-and-groom-embracing-each-other-in-front-of-the-sun-WhnaFO47j5E), CDN `photo-1708126755292-4cf3bff62d8f` |
| `bouquet-white.webp` | [Nicole Corbin · ramo blanco](https://unsplash.com/photos/white-flower-arrangement-i4NqeIHNbTI), CDN `photo-1523454131402-131223cdd00e` |
| `rings.webp` | [Micah & Sammie Chaffin · alianzas](https://unsplash.com/photos/wedding-rings-rest-in-their-holder-J2I3_ox-np0), CDN `photo-1741207154948-66f7fa63c35a` |
| `ceremony-garden.webp` | [Fuente original de Unsplash](https://images.unsplash.com/photo-1523438885200-e635ba2c371e), jardín para ceremonia |
| `reception.webp` | [Fuente original de Unsplash](https://images.unsplash.com/photo-1519225421980-715cb0215aed), mesas de recepción |
| `cake.webp` | [Fuente original de Unsplash](https://images.unsplash.com/photo-1535254973040-607b474cb50d), pastel con flores |

## Ornamentos e iconografía

- `public/themes/botanical/floral-corner.webp`: ornamento original generado con la herramienta integrada **ImageGen**, con transparencia preservada y exportación web optimizada a 800 px. Se reutiliza mediante rotación en esquinas; no contiene tipografía ni datos de la pareja.
- `public/themes/botanical/sprig.svg`: rama vectorial creada para este proyecto.
- `src/themes/botanical/icons.ts`: registro de trazados SVG originales de iconos lineales. `Icon` los presenta con `aria-hidden`, acompañados de texto visible cuando tienen función.
- `public/themes/botanical/leaf.svg`: recurso de la fase 0 conservado; no lo consume esta versión.

Prompt final de ImageGen (modo integrado, sin CLI):

> Use case: illustration-story. Asset type: transparent botanical corner ornament for an elegant wedding invitation website. Create one exquisite watercolor botanical L-shaped corner arrangement growing from the top left edge, delicate creamy white cosmos flowers with small golden centers, natural olive and sage eucalyptus leaves, translucent fine stems. Dense at the top left corner, tapering gracefully along the top and left edges, center and bottom right empty transparent. Soft realistic watercolor detail, muted olive #596B3B sage #A5AE8B and warm ivory petals. No text, no frame, no background, genuine alpha transparency. Square 1024 composition.

## Tipografías

Cormorant Garamond, Great Vibes e Inter, descargadas del [repositorio oficial Google Fonts](https://github.com/google/fonts) y alojadas en `public/fonts/`. Cada familia incluye su archivo de licencia SIL Open Font License (`*-OFL.txt`). Carga con `font-display: swap`; sin solicitudes a Google durante ejecución o compilación.

## Diferencias deliberadas respecto al mockup

- Una página vertical, sin marcos de teléfonos. En escritorio, papel centrado con ancho máximo de 760 px.
- Ornamento propio y fotografías de stock, distintos de los de referencia. La ceremonia muestra un jardín acorde con la configuración existente, en lugar de una iglesia.
- Se conservan fecha, zona horaria y horario configurados en fase 0 (ceremonia 16:00, recepción 18:00). El contador calcula el tiempo real; no fija los números del mockup.
- No se añaden ubicaciones ni listas de regalos inventadas. Los botones aparecen cuando la configuración contiene URLs reales; la demo omite esos enlaces opcionales.
- El RSVP muestra sus campos, pero identifica explícitamente la demostración y deshabilita WhatsApp. No envía ni almacena respuestas, incluso con Enter.
- El contador tiene estado de fecha vencida. La galería ofrece dos fotografías adicionales mediante un desplegable nativo accesible, sin dependencia de lightbox.
