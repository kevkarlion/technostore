# TechnoStore - Configuración de Scraper e Imágenes

## Arquitectura General

```
jotakp.dyndns.org (proveedor) 
    → Scraper (Railway)
    → Cloudinary + MongoDB (ecommerce)
    → App (Vercel)
```

---

## 1. Scraper

### Ubicación
```
/home/kriq/mis-proyectos/railwey-scraping/scraper-server
```

### Endpoints (Railway)
```
Base: https://technostore-scraper-production.up.railway.app

GET  /scraper/categories          - Listar categorías
POST /scraper/run                 - Scraping completo
POST /scraper/incremental         - Scraping incremental (recomendado)
```

### Comandos curl

```bash
# Scraping incremental (recomendado)
curl -X POST https://technostore-scraper-production.up.railway.app/scraper/incremental \
  -H "Content-Type: application/json" \
  -d '{"forceFullScrape": false}'

# Scraping completo
curl -X POST https://technostore-scraper-production.up.railway.app/scraper/run \
  -H "Content-Type: application/json" \
  -d '{}'

# Scraping por categoría (ej: pendrive = idsubrubro1: 5)
curl -X POST https://technostore-scraper-production.up.railway.app/scraper/run \
  -H "Content-Type: application/json" \
  -d '{"idsubrubro1": 5}'
```

### Configuración DB

**Importante:** La DB es `ecommerce` (no `technostore`).

Archivos modificados:
- `.env`: MONGO_URI + DB_NAME=ecommerce
- `src/lib/scraper/scraper.service.ts`: default DB_NAME
- `src/lib/scraper/incremental-scraper.service.ts`: default DB_NAME  
- `server.ts`: default DB_NAME

---

## 2. Sistema de Imágenes

### Flujo del Scraper

1. Scrapea productos de jotakp.dyndns.org
2. Extrae URLs de imágenes de la página de detalle
3. Sube cada imagen a Cloudinary:
   - Folder: `technostore/jotakp`
   - public_id: `jotakp_{externalId}_{index}` (ej: jotakp_21035_0)
4. Guarda URLs de Cloudinary en campo `cloudinaryUrls`
5. Mantiene URLs originales en campo `imageUrls` como fallback

### Campos en MongoDB

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `imageUrls` | URLs originales de jotakp (fallback) | `https://jotakp.dyndns.org/imagenes/000027606.PNG` |
| `cloudinaryUrls` | URLs de Cloudinary (prioridad) | `https://res.cloudinary.com/.../jotakp_21035_0.jpg` |

### Mapper del App (`product-to-presentation.ts`)

Prioridad:
1. Si existe `cloudinaryUrls` con URLs válidas (https://res.cloudinary.com) -> usa esas
2. Si no, usa `imageUrls` (fallback a jotakp.dyndns.org)
3. Si no hay ninguna -> placeholder `/images/placeholder-product.svg`

---

## 3. Scripts de Mantenimiento

### Ubicación
```
/home/kriq/mis-proyectos/TechnoStore/app/
```

### Scripts disponibles

```bash
# Verificar imágenes de una categoría
npx tsx check-images.ts

# Limpiar imágenes del logo (agenes0000)
npx tsx clean-all-logos.ts

# Corregir IDs incorrectos en cloudinaryUrls
npx tsx fix-mismatched-images.ts

# Migración Cloudinary
npx tsx migrate-cloudinary.ts
npx tsx migrate-cloudinary-phase2.ts
```

---

## 4. Problemas Conocidos y Soluciones

### Problema 1: Imágenes con ID incorrecto
- **Causa:** Bug en el scraper donde usaba índice en lugar de externalId
- **Solución:** Script `fix-mismatched-images.ts` limpia cloudinaryUrls incorrectos
- **Estado:** 110 productos corregidos

### Problema 2: Imágenes del logo (agenes0000)
- **Causa:** Scraper capturaba el placeholder de jotakp
- **Solución:** Script `clean-all-logos.ts` elimina y limpia
- **Estado:** 84 imágenes eliminadas

### Problema 3: Rate limit de Cloudinary
- **Límite:** 500 requests/hora
- **Impacto:** Scripts de migración limitados
- **Nota:** No afecta al scraper en producción

---

## 5. Build y Deploy

### App (Vercel)
```bash
cd /home/kriq/mis-proyectos/TechnoStore/app
npm run build
git add . && git commit -m "fix: clean mismatched images" && git push
```

### Scraper (Railway)
```bash
cd /home/kriq/mis-proyectos/railwey-scraping/scraper-server
git add . && git commit -m "fix: ..." && git push
```

---

## 6. Notas Importantes

- **SSG + ISR:** El sitio usa generación estática. Después defixes en DB, hacer rebuild.
- **Scraper tiempo real:** atomicUpsert actualiza DB mientras scrapea (no espera al final).
- **Fallback automático:** Si Cloudinary falla, usa imagenes de jotakp.
- **Pendrive test:** Primer categoría probada con imágenes correctas.

---

## 7. URLs de参考

- App: https://technostore-y3tl.vercel.app
- Scraper: https://technostore-scraper-production.up.railway.app
- Cloudinary: https://cloudinary.com/dfli0n64m
- MongoDB: cluster0.twowu9r.mongodb.net (ecommerce)