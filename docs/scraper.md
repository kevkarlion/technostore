# Scraper de Jotakp (Cappelletti Informática)

Este documento describe el flujo de trabajo del sistema de scraping para el sitio de Cappelletti Informática.

---

## 📋 Resumen

El scraper extrae productos, precios y detalles de la web del proveedor para guardarlos en MongoDB.

**Proveedor**: Jotakp (Cappelletti Informática)  
**URL Base**: `https://jotakp.dyndns.org`  
**Categorías**: 127 subcategorías (almacenamiento, audio, hardware, etc.)

---

## 🏗️ Arquitectura del Scraper

### Archivos Principales

| Archivo | Descripción |
|---------|-------------|
| `src/lib/scraper/scraper.service.ts` | Servicio principal con toda la lógica |
| `src/lib/scraper/config.ts` | Configuración de categorías y selectores |
| `src/lib/scraper/types.ts` | Definiciones de tipos TypeScript |
| `src/lib/scraper/data-transformer.ts` | Transformación de datos crudos a formato DB |
| `src/lib/scraper/image-downloader.ts` | Descarga de imágenes al servidor local |
| `run-scraper.ts` | Punto de entrada CLI |
| `src/api/repository/product.repository.ts` | Repositorio con control atómico |
| `src/domain/mappers/product-to-presentation.ts` | Mapper de productos para el frontend |

### Tecnologías

- **Playwright**: Automatización del navegador (headless)
- **MongoDB**: Base de datos para productos
- **Next.js**: Servir imágenes descargadas localmente

---

## 🔄 Flujo de Trabajo

```
1. Inicialización
   ├── Cargar configuración desde .env.local
   ├── Conectar a MongoDB
   └── Verificar runs anteriores (checkpoint)

2. Login
   ├── Navegar a página de login
   ├── Ingresar credenciales
   └── Seleccionar sucursal (Cipolletti)

3. Scraping de Categorías
   └── Por cada categoría:
       ├── Navegar a página de lista (pag=1)
       ├── Extraer productos de la página
       │   ├── Extraer imagen del producto (div.tg-article-img)
       │   └── Para cada producto:
       │       ├── Crear nueva página
       │       ├── Navegar a página de detalle
       │       ├── Extraer imágenes (evitar logo 000014645)
       │       ├── Extraer descripción, stock
       │       └── Cerrar página
       │
       ├── Verificar paginado
       │   └── Navegar a ?pag=N+1 y verificar si hay productos
       │
       └── Guardar checkpoint

4. Transformación
   ├── Convertir precios de USD a formato interno
   ├── Limpiar nombres de productos
   └── Generar slug de categorías

5. Descarga de Imágenes
   ├── Por cada producto
   │   ├── Descargar a /public/images/suppliers/{supplier}/
   │   └── Naming: {supplier}_{productId}_{imageId}.{ext}
   └── Guardar URLs locales en DB

6. Guardado Atómico (como Git)
   ├── Comparar cada campo (name, price, stock, etc.)
   ├── Solo actualizar si hay cambios reales
   ├── Preservar imágenes si no vinieron nuevas
   └── Marcar descontinuados (no appeared in scrape)
```

---

## 🔀 Control Atómico (tipo Git)

### Filosofía

El scraper funciona como Git:
- **CREATE**: Producto nuevo en la web
- **UPDATE**: Producto existente con cambios (precio, stock, etc.)
- **UNCHANGED**: Producto sin cambios (no actualiza)
- **DISCONTINUED**: Producto que ya no está en la web → se oculta automáticamente

### Implementación

En `product.repository.ts`, función `atomicUpsertByExternalId`:

```typescript
async atomicUpsertByExternalId(data: ScrapedProductDTO): Promise<{
  product: Product;
  created: boolean;
  updated: boolean;
  changes: string[];
}> {
  // 1. Si no existe → CREATE
  // 2. Si existe → comparar campos uno por uno
  const changes: string[] = [];
  for (const field of fieldsToCompare) {
    if (hasChanged(existing[field], newVal)) {
      updateOperations[field] = newVal;
      changes.push(field);
    }
  }
  // 3. Imágenes: solo actualizar si vinieron nuevas Y son distintas
  // 4. Si no vinieron imágenes pero existían → PRESERVAR (no borrar)
}
```

### Descontinuados por Categoría

Cuando se scrapea una subcategoría específica (ej: `pendrive` con id=5), el sistema:
1. Compara los productos que había en esa categoría con los scrapeados
2. Los que ya no aparecen → marca como `status: "discontinued"`
3. Quedan ocultos en la tienda automáticamente

**Ejemplo ejecución**:
```typescript
// Script para scrapeo de Almacenamiento completo
const almacenamientoSubcats = [
  { id: 'carry-caddy-disk', idsubrubro1: 100 },
  { id: 'cd-dvd-bluray', idsubrubro1: 13 },
  { id: 'discos-externos', idsubrubro1: 14 },
  { id: 'discos-hdd', idsubrubro1: 69 },
  { id: 'discos-m2', idsubrubro1: 157 },
  { id: 'discos-ssd', idsubrubro1: 156 },
  { id: 'memorias-flash', idsubrubro1: 12 },
  { id: 'pendrive', idsubrubro1: 5 },
];
```

### Campos nuevos en el modelo

```typescript
interface Product {
  status: "active" | "discontinued";  // para productos quitados
  lastSeenAt: Date;                   // última vez que se vio en la web
  discontinuedAt: Date;               // cuándo se marcó como quitado
}
```

### Logging de cambios

```
[Scraper] Updated 21884: description, sku, imageUrls
[Scraper] Marked 2 products as discontinued in pendrive
[Scraper] Completed: 5 created, 10 updated, 85 unchanged, 3 discontinued
```

---

## 🔄 Flujo de Trabajo Actualizado

```
1. Inicialización
   ├── Cargar configuración desde .env.local
   ├── Conectar a MongoDB (Atlas)
   └── Verificar runs anteriores (checkpoint)

2. Login
   ├── Navegar a página de login
   ├── Ingresar credenciales
   └── Seleccionar sucursal (Cipolletti)

3. Scraping de Categorías
   └── Por cada subcategoría:
       ├── Navegar a página de lista (pag=1)
       ├── Extraer productos de la página
       │   ├── Nombre, precio, stock
       │   └── Imagen miniatura (background-image tal cual)
       │
       ├── Para cada producto:
       │   ├── Crear nueva página
       │   ├── Navegar a página de detalle
       │   ├── Extraer TODAS las imágenes (div.tg-img-overlay.artImg[data-src])
       │   ├── Extraer descripción, sku
       │   └── Cerrar página
       │
       ├── Verificar paginado (?pag=N+1)
       └── Guardar checkpoint

4. Descarga de Imágenes
   ├── Por cada producto
   ├── Descargar a /public/images/suppliers/{supplier}/
   └── Naming: {supplier}_{productId}_{imageId}.{ext}

5. Guardado Atómico (como Git)
   ├── Comparar cada campo (name, price, stock, etc.)
   ├── Solo actualizar si hay cambios reales
   ├── Preservar imágenes si no vinieron nuevas
   └── Marcar descontinuados (por categoría específica)
```

---

## 🖼️ Sistema de Imágenes

### Arquitectura del Sitio Jotakp

El sitio tiene dos tipos de páginas con estructuras diferentes:

#### Página de Categoría (Lista de Productos)
- **URL ejemplo**: `https://jotakp.dyndns.org/buscar.aspx?idsubrubro1=100`
- **Contenedor**: `div.row.w-100.m-0.p-0` con cards de productos
- **Imagen**: `div[class*='tg-article-img']` con `style="background-image: url(imagenes/min/imagen000XXXXX.jpg)"`
- **Siempre 1 imagen por producto** (miniatura)
- **Selector CSS**: `div.tg-article-img, div.w-100.tg-article-img, [class*='tg-article-img']`
- **IMPORTANTE**: NO convertir a HD - dejar la miniatura tal cual

#### Página de Detalle (Artículo)
- **URL ejemplo**: `https://jotakp.dyndns.org/articulo.aspx?id=9277`
- **Contenedor miniaturas**: `div.row.w-100.p-3.justify-content-start`
- **Miniaturas**: `div.tg-img-overlay.artImg` con atributo `data-src="imagenes/0000XXXX.JPG"`
- **Imagen principal**: `img.img-fluid` con `src` dinámico (cambia al seleccionar miniatura)
- **Puede tener 1 o más imágenes** (todas las del carrousel)
- **Selector CSS**: `div.tg-img-overlay.artImg` → tomar `data-src`

### Extracción de Imágenes - Lógica Actual

**Solución implementada**:

1. **Página de lista** (scraper.service.ts línea ~398):
   - Extrae del `style="background-image: url(...)"` tal cual
   - NO convierte a HD (línea 409-412 comentada)
   - Mantiene la miniatura como fallback

2. **Página de detalle** (scraper.service.ts línea ~478):
   - Busca todas las miniaturas: `div.tg-img-overlay.artImg`
   - Extrae el atributo `data-src` de cada una
   - Ignora `background-image` (son miniaturas de baja calidad)
   - Ignora `img.img-fluid` (es dinámica, depende de la selección)

```typescript
// Method 1: Get ALL images from thumbnails (data-src attribute)
const thumbnailDivs = await page.locator("div.tg-img-overlay.artImg").all();
const thumbnailUrls: string[] = [];

for (const div of thumbnailDivs) {
  const dataSrc = await div.getAttribute("data-src");
  if (dataSrc && dataSrc.includes("imagenes/") && !dataSrc.includes("/min/")) {
    thumbnailUrls.push(fullUrl);
  }
}
```

### Descarga de Imágenes

- **Directorio**: `/public/images/suppliers/jotakp/`
- **Naming**: `jotakp_{productId}_{imageId}.{ext}`
- **Ejemplo**: `jotakp_9277_15886.JPG` (producto 9277, imagen 15886)

### Notas Importantes

- Algunas imágenes HD no existen en el servidor (devuelven 404)
- Las miniaturas (`/min/`) siempre existen pero son de baja calidad
- El ImageDownloader intenta descargar solo las imágenes de alta resolución
- Si la HD falla, se guarda la URL remota (no la miniatura)

### Descarga de Imágenes

- **Directorio**: `/public/images/suppliers/jotakp/`
- **Naming**: `jotakp_{productId}_{imageId}.{ext}`
- **Ejemplo**: `jotakp_21884_28904.PNG` (producto 21884, imagen 28904)

### Serving de Imágenes

En `product-to-presentation.ts`, el mapper maneja ambos casos:

```typescript
const normalizeImageUrl = (url: string): string => {
  // 1. URL completa → usar como está
  if (url.startsWith("http")) return url;
  
  // 2. Imagen local (/images/suppliers/...) → Next.js sirve automáticamente
  if (url.startsWith("/images/")) return url;
  
  // 3. Ruta del proveedor (imagenes/...) → prepend base URL
  return `${baseImageUrl}/${url}`;
};
```

### Placeholder

Cuando un producto no tiene imagen válida:
- **Caso 1**: No hay imágenes en DB → placeholder SVG
- **Caso 2**: URL de imagen es inválida (ej: `000014626`) → placeholder SVG
- **Archivo**: `/images/placeholder-product.svg`

---

## 📄 Paginación

### Estructura HTML del sitio

```html
<nav aria-label="Page navigation example">
  <ul class="pagination justify-content-center flex-wrap">
    <li class="page-item">
      <a class="page-link tg-page-link">Anterior</a>
    </li>
    <li class="page-item">
      <a class="page-link tg-page-link">1</a>
    </li>
    <li class="page-item">
      <a class="page-link tg-page-link">2</a>
    </li>
    <li class="page-item">
      <a class="page-link tg-page-link">Siguiente</a>
    </li>
  </ul>
</nav>
```

### Cómo funciona

El scraper NO busca el botón "Siguiente" por selector. En su lugar:

1. Intenta navegar a `?pag=N+1` directamente
2. Verifica si la página tiene productos
3. Si tiene productos → continua
4. Si está vacía → termina

**URLs de ejemplo**:
- Página 1: `buscar.aspx?idsubrubro1=149`
- Página 2: `buscar.aspx?idsubrubro1=149&pag=2`
- Página 3: `buscar.aspx?idsubrubro1=149&pag=3`

---

## 🛡️ Manejo de Errores

### Protección contra páginas cerradas

El scraper maneja automáticamente:

1. **Browser desconectado**: Relanzar browser y re-login
2. **Página cerrada**: Crear nueva página del context
3. **Timeout en navegación**: Reintentar hasta 3 veces
4. **Error al obtener contenido**: Reintentar hasta 3 veces

### Sistema de páginas seguras

```typescript
// Crear página nueva (se cierra después de usar)
const detailPage = await this.getPage();
try {
  const detail = await this.scrapeProductDetail(detailPage, url);
} finally {
  await detailPage.close(); // Siempre cerrar
}
```

### Tracking de páginas abiertas

El sistema mantiene un array de páginas abiertas y las cierra cuando:
- Ya no son necesarias
- Se acumulan demasiadas (>10)
- El browser se reconecta

---

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```bash
# URL del proveedor
SUPPLIER_URL=https://jotakp.dyndns.org

# Página de login
SUPPLIER_LOGIN_URL=http://jotakp.dyndns.org/loginext.aspx

# Credenciales
SUPPLIER_EMAIL=20418216795
SUPPLIER_PASSWORD=123456

# Delay entre requests (ms)
SUPPLIER_DELAY_MS=3000

# Intervalo mínimo entre scrapeos (ms) - por defecto 1 hora
SCRAPER_MIN_INTERVAL_MS=3600000
```

### Parámetros CLI

```bash
# Scraper una categoría específica
npm run scraper -- --idsubrubro1 149

# Por slug de categoría
npm run scraper -- --categoryId pendrive

# Con fuente custom
npm run scraper -- --source "mi-script"
```

---

## 🚀 Ejecución

### Modo Inteligente (recomendado)

El script `scrape-all-categories.ts` scrapea todas las categorías pero solo actualiza las que necesitan refresh:

```bash
# Scrapeo normal (solo categorías que no se actualizaron en la última hora)
cd /home/kriq/mis-proyectos/TechnoStore/app
npx tsx scrape-all-categories.ts

# Forzar scrapeo de TODAS las categorías (ignora intervalo)
npx tsx scrape-all-categories.ts --force
```

**Cómo funciona**:
1. Carga la lista de 127 subcategorías
2. Para cada categoría, consulta el último scrapeo en MongoDB
3. Si pasó más de 1 hora → actualiza
4. Si pasó menos de 1 hora → omite (para no saturar el servidor)
5. Cada categoría hace su propio login/reconexión automáticamente

**Ventajas**:
- No re-scrapea categorías recientes innecesariamente
- Resistente a timeouts (cada categoría es independiente)
- Funciona en múltiples ejecuciones
- Con `--force` puede actualizar todo sin importar el intervalo

### Modo Original (una categoría)

```bash
# Scraper una categoría específica
npm run scraper -- --idsubrubro1 149

# Scrapear toda la web (modo legacy)
npm run scraper
```

### Ver logs de progreso

El script `scratch-almacenamiento.ts` scrapea las 8 subcategorías de Almacenamiento:

```bash
cd /home/kriq/mis-proyectos/TechnoStore/app
npx tsx scratch-almacenamiento.ts
```

**Subcategorías scrapeadas**:
| ID | Slug | Nombre |
|----|------|--------|
| 100 | carry-caddy-disk | Carry-Caddy Disk |
| 13 | cd-dvd-bluray | CD-DVD-BluRay-Dual Layer |
| 14 | discos-externos | Discos Externos |
| 69 | discos-hdd | Discos HDD |
| 157 | discos-m2 | Discos M.2 |
| 156 | discos-ssd | Discos SSD |
| 12 | memorias-flash | Memorias Flash |
| 5 | pendrive | Pendrive |

### Scrapear una categoría específica

```bash
# Por idsubrubro1
npm run scraper -- --idsubrubro1 100

# Por slug de categoría
npm run scraper -- --categoryId pendrive
```

### Scrapear toda la web

```bash
npm run scraper
```

### Ver logs de progreso

Los logs muestran:
- Productos encontrados por página
- Navegación entre páginas
- Imágenes descargadas
- Actualizaciones atómicas (qué campos cambiaron)
- Productos descontinuados por categoría
- Conteo final: created/updated/unchanged/discontinued

---

## 📊 Subcategorías de Almacenamiento

```
Almacenamiento (categoría padre)
├── Carry-Caddy Disk (id=100)       - Ej: adaptadores para discos
├── CD-DVD-BluRay-Dual Layer (id=13) - CDs/DVDs (sin stock actualmente)
├── Discos Externos (id=14)         - Discos externos portatiles
├── Discos HDD (id=69)              - Discos rígidos tradicionales
├── Discos M.2 (id=157)             - SSDs NVMe/NGFF
├── Discos SSD (id=156)             - SSDs SATA 2.5"
├── Memorias Flash (id=12)          - Tarjetas microSD
└── Pendrive (id=5)                  - USBs-flash
```

---

## 🎯 Categorías - Fix de URLs

### Problema con "Discos M.2"

El sitio usa "M.2" con punto, pero las URLs de Next.js no aceptan puntos:
- ❌ `/category/discos-m.2` → 404 Not Found
- ✅ `/category/discos-m2` → funciona

**Fix implementado** en `category-dropdown.tsx`:

```typescript
let subSlug = sub.toLowerCase().replace(/\s+/g, "-");
subSlug = subSlug.replace(/\.2$/, "2"); // Fix "m.2" -> "m2"
```

Este fix aplica a cualquier categoría con punto que necesite URL-clean.

---

## 📁 Estructura de Datos

### Producto en MongoDB

```json
{
  "_id": "...",
  "externalId": "21884",
  "supplier": "jotakp",
  "name": "Pendrive Dual 128GB Hiksemi Metalico...",
  "description": "...",
  "price": 15.26,
  "currency": "USD",
  "stock": 25,
  "sku": "HS-USB-E327C-128GB-U3-SILVER",
  "imageUrls": [
    "/images/suppliers/jotakp/jotakp_21884_28904.PNG"
  ],
  "categories": ["pendrive"],
  "attributes": [],
  "status": "active",
  "lastSyncedAt": "2026-04-07T16:40:00Z",
  "lastSeenAt": "2026-04-07T16:40:00Z",
  "discontinuedAt": null,
  "createdAt": "2026-04-07T16:40:00Z",
  "updatedAt": "2026-04-07T16:40:00Z"
}
```

---

## ⚠️ Notas Importantes

### Selectores del sitio

```typescript
// Página de lista - selector para productos
itemSelector: "a[href*='articulo.aspx?id=']"

// Imagen en página de lista (background-image)
"div.tg-article-img, div.w-100.tg-article-img"

// Imagen en página de detalle (por contenido HTML)
imagenes/[min/]*(0+\d+)\.[a-zA-Z]{3,4}
```

### Formato de precios

- **priceRaw**: Precio en USD (ej: "98,75")
- **priceWithIvaRaw**: Precio con IVA en ARS (ej: "139.731,25")
- Los precios se transforman en `data-transformer.ts`

### Imágenes

El sistema:
1. Extrae URLs de imágenes de la página de detalle
2. Las descarga a `/public/images/suppliers/`
3. Guarda la ruta local en la DB
4. Sirve desde Next.js automáticamente
5. Usa placeholder si no hay imagen válida

### ID de imágenes

El sitio usa un sistema de IDs particular:
- `imagenes/min/000028904.jpg` (thumbnail en página)
- `imagenes/000028904.PNG` (imagen completa real)
- El scraper extrae el número y genera la URL correcta

---

## 🔧 Mantenimiento

### Si el sitio cambia su estructura HTML

1. Revisar la página manualmente
2. Actualizar selectores en `scraper.service.ts`
3. Probar con una categoría pequeña

### Si el login falla

1. Verificar credenciales en `.env.local`
2. Probar login manualmente en el navegador
3. Revisar si hay nuevo CAPTCHA o 2FA

### Si el paginado no funciona

1. Verificar que la URL de paginado sea correcta
2. Confirmar que el sitio realmente tiene más páginas
3. Revisar logs para ver qué 返回的空内容

### Si las imágenes no se descargan

1. Verificar que la URL sea correcta (evitar `000014` - logo)
2. Probar la URL directamente en el navegador
3. Revisar logs de `ImageDownloader`

---

## 📞 Troubleshooting

### Error: "Login failed"
→ Verificar credenciales en `.env.local`

### Error: "No next page button found"
→ Revisar estructura HTML de paginación en el sitio

### Error: "Browser disconnected"
→ Reducir delay o revisar conexión a internet

### Error: "Failed to download image"
→ Verificar si la imagen existe en el servidor (algunas devuelven 404)

### Las imágenes no aparecen en la web
1. Verificar que el archivo existe en `/public/images/suppliers/`
2. Probar: `curl http://localhost:3000/images/suppliers/jotakp/jotakp_21884_28904.PNG`
3. Verificar que el mapper convierte URLs correctamente
4. ** IMPORTANTE**: Las imágenes están en `public/images/` - si subís a producción, deben estar en el repo o en un CDN externo

### Producto sin imagen
→ Se muestra el placeholder en `/images/placeholder-product.svg`

### Scraper muy lento
→ Reducir `SUPPLIER_DELAY_MS` en `.env.local`

### La categoría muestra "Category not found"
→ Verificar que el slug sea correcto (sin puntos)
- Ej: `discos-m2` NO `discos-m.2`

### Los productos descontinuados no se ocultan
→ Verificar que el scrape sea de subcategoría específica (con `--idsubrubro1`)
→ El sistema de descontinuados solo funciona con scrapeo específico, no completo

### Productos duplicados en página de detalle
→ El código actual extrae SOLO de `div.tg-img-overlay.artImg[data-src]`
→ NO de `img.img-fluid` (dinámica) ni de `background-image` (miniaturas)

---

## 🔧 Mantenimiento

### Si el sitio cambia su estructura HTML

1. Revisar la página manualmente en el navegador
2. Inspeccionar elementos con DevTools
3. Actualizar selectores en `scraper.service.ts`:
   - Lista: línea ~398 (background-image)
   - Detalle: línea ~478 (thumbnail divs)
4. Probar con una categoría pequeña

### Si el login falla

1. Verificar credenciales en `.env.local`
2. Probar login manualmente en el navegador
3. Revisar si hay nuevo CAPTCHA o 2FA

### Si el paginado no funciona

1. Verificar que la URL de paginado sea correcta
2. Confirmar que el sitio realmente tiene más páginas
3. Revisar logs

---

*Documento actualizado el 2026-04-07*
*Versión: Scraping funcionando con imágenes múltiples + control atómico + descontinuados por categoría*

---

## 🔧 Actualizaciones Recientes (2026-04-08)

### Fix: Auto-reconexión del Browser

**Problema**: Después de ~6 categorías, Playwright perdía la conexión (`Target page, context or browser has been closed`), causando que el scraping completo se cortara.

**Solución implementada**: Dos cambios en `scraper.service.ts`:

1. **`getPage()`** - Verifica la conexión antes de crear páginas:
```typescript
private async getPage(): Promise<Page> {
  // Check browser connection first
  if (!this.browser || !this.browser.isConnected()) {
    console.log("[Scraper] Browser disconnected in getPage, reconnecting...");
    await this.reconnectBrowser();
  }
  // ... create page
}
```

2. **`ensureBrowserConnected()`** - Nueva función que se llama al inicio de cada categoría para verificar y reconectar si es necesario.

**Resultado**: El scraping de 127 categorías ahora puede ejecutarse completamente sin cortes por desconexión del browser.

### Scraping en Paralelo

**Problema anterior**: El scraper procesaba los detalles de productos uno por uno (secuencial), tardando ~15-20 minutos para 60 productos.

**Solución implementada**: Procesamiento en paralelo con batches de 3 productos simultáneos.

```typescript
// scraper.service.ts - scrapeProductsInParallel()
const MAX_PARALLEL_PAGES = 3;

for (let i = 0; i < productsWithUrl.length; i += MAX_PARALLEL_PAGES) {
  const batch = productsWithUrl.slice(i, i + MAX_PARALLEL_PAGES);
  const batchPromises = batch.map(async (product) => {
    const detailPage = await this.getPage();
    const detail = await this.scrapeProductDetail(detailPage, product.productUrl!);
    try { await detailPage.close(); } catch { /* ignore */ }
    // ... merge details
    return product;
  });
  const batchResults = await Promise.all(batchPromises);
}
```

**Resultado**: 70 productos ahora se scrapean en ~90 segundos (antes ~15-20 min).

### Productos Descontinuados - Reactivación Automática

**Problema**: Los productos marcados como "descontinuados" no se reactivaban automáticamente cuando volvían a aparecer en la web.

**Comportamiento actual**:
1. El scraper scrapea la categoría completa (todas las páginas)
2. Compara con productos anteriores en DB
3. Los productos que reaparecen en la web → se actualizan (no se crean de nuevo)
4. El atomic upsert detecta que ya existe → actualiza
5. Al actualizar, los campos como `status` se mantienen o actualizan según vengan del scrape

**Flujo**:
```
Scraper scrapea 70 productos de Auricular Bluetooth
DB tenía: 60 activos + 10 descontinuados
Resultado: 70 activos (los 10 descontinuados volvieron a aparecer)
```

### Fix de Paginación - Página 2

**Problema anterior**: El scraper detectaba correctamente que había página 2 (10 productos), pero al navegar scrapeaba los mismos 60 productos de página 1 (contenido cached).

**Causa**: Después de procesar página 1, se cerraba la página principal y se creaba una nueva. Al navegar a página 2, el sitio devolvía contenido stale.

**Solución**: Mantener la misma página principal y navegar correctamente entre páginas:

```typescript
// Antes (incorrecto):
try { await page.close(); } catch { /* ignore */ }
page = await this.getPage();  // Nueva página con contenido stale

// Después (correcto):
// Navegar la página principal directamente a la siguiente página
await this.safeGoto(page, `${url}?pag=${pageNum}`);
```

### Fix de next.config.ts - Cloudinary

**Problema**: Las imágenes de propiedades (no de productos) usaban Cloudinary y Next.js rechazaba el hostname.

**Solución**: Agregar todos los patrones de Cloudinary:

```typescript
// next.config.ts
images: {
  remotePatterns: [
    // ... existing patterns
    { protocol: "https", hostname: "*.cloudinary.com" },
    { protocol: "https", hostname: "res.cloudinary.com" },
    { protocol: "https", hostname: "cloudinary.com" },
  ],
}
```

**Nota**: Requiere limpiar la cache de Next.js (`rm -rf .next`) después de hacer cambios en `next.config.ts`.

---

## 📊 Métricas de Rendimiento

| Métrica | Antes | Después |
|---------|-------|---------|
| 60 productos | ~15-20 min | ~60 seg |
| 70 productos | N/A | ~90 seg |
| Timeout en detalle | Frequent | Raro |
| Página 2 | No funcionaba | ✅ Funciona |
| Descontinuados reactivados | No | ✅ Sí |

---

*Documento actualizado el 2026-04-08*
*Versión: Scraping completo con auto-reconexión del browser*
