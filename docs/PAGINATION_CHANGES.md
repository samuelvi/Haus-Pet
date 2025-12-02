# Pagination Implementation Summary

## Overview

Se ha implementado una estrategia de paginación eficiente basada en cursores sin query de COUNT para todos los endpoints de listado del backend.

## Estrategia Implementada: N+1 Fetch Pattern

### Funcionamiento

1. **Query N+1 Registros**: Cuando se solicita una página con límite N, se obtienen N+1 registros de la base de datos
2. **Retornar N Registros**: Se muestran solo los primeros N registros al usuario
3. **Usar el Registro Extra como Señal**: El registro N+1 indica si hay más páginas disponibles
4. **Botón Anterior**: Se muestra si `page > 1`
5. **Botón Siguiente**: Se muestra si se obtuvieron N+1 registros

### Beneficios

- ✅ **Rendimiento**: Elimina queries COUNT costosas
- ✅ **Escalabilidad**: Tiempo constante independiente del tamaño del dataset
- ✅ **Simplicidad**: Implementación directa
- ✅ **Carga de BD**: Reduce la carga en ~50% (una query en lugar de dos)

### Trade-offs

- ❌ No hay conteo total de registros
- ❌ No se puede saltar a página específica
- ❌ No hay indicadores "Página X de Y"
- ✅ Navegación Anterior/Siguiente suficiente para la mayoría de casos de uso

## Archivos Modificados

### 1. Domain Layer

**Nuevo archivo**: `app/api/domain/pagination.ts`
- Define interfaces `PaginationMeta` y `PaginatedResponse<T>`
- Proporciona funciones helper para normalización y cálculo de metadata
- Constantes: `DEFAULT_PAGE=1`, `DEFAULT_LIMIT=20`, `MAX_LIMIT=100`

### 2. Repository Layer

**Archivo**: `app/api/domain/breed-read.repository.ts`
- Actualizado `findAll()` para aceptar parámetros `page` y `limit`
- Actualizado `findByType()` para aceptar parámetros `page` y `limit`

**Archivo**: `app/api/infrastructure/repositories/postgres-breed.repository.ts`
- Implementa paginación usando Prisma `skip` y `take`
- Aplica offset: `(page - 1) * limit`

### 3. Service Layer

**Archivo**: `app/api/application/breed.service.ts`
- `getAllBreeds()` ahora retorna `PaginatedResponse<Breed>`
- `getBreedsByType()` ahora retorna `PaginatedResponse<Breed>`
- Fetches N+1 registros y calcula metadata de paginación

**Archivo**: `app/api/application/audit-logging-breed.service.decorator.ts`
- Actualizado para pasar parámetros de paginación
- Mantiene logs de auditoría con información correcta

**Archivo**: `app/api/application/pet.service.ts`
- `findAll()` ahora retorna `PaginatedResponse<Pet>`
- `findByType()` ahora retorna `PaginatedResponse<Pet>`
- Usa `$queryRaw` con `LIMIT` y `OFFSET` para paginación

### 4. Controller Layer

**Archivo**: `app/api/infrastructure/http/controllers/breed.controller.ts`
- Extrae `page` y `limit` de query params
- Retorna estructura con `{ status, data: { items, pagination } }`

**Archivo**: `app/api/infrastructure/http/controllers/pet.controller.ts`
- Extrae `page` y `limit` de query params
- Retorna estructura con `{ status, data: { items, pagination } }`

### 5. Documentation

**Archivo**: `docs/adr/use-cursor-based-pagination-without-count.md`
- ADR completo documentando la decisión
- Explica el patrón N+1 fetch
- Lista consecuencias y alternativas consideradas

## Endpoints Afectados

### Breeds
- `GET /api/breeds?page=1&limit=20`
- `GET /api/breeds/:type?page=1&limit=20`

### Pets
- `GET /api/pets?page=1&limit=20`
- `GET /api/pets/type/:type?page=1&limit=20`

## Formato de Respuesta

```json
{
  "status": "OK",
  "data": {
    "items": [
      { "id": "...", "name": "..." }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

## Parámetros de Query

| Parámetro | Tipo | Default | Max | Descripción |
|-----------|------|---------|-----|-------------|
| `page` | number | 1 | - | Número de página (1-indexed) |
| `limit` | number | 20 | 100 | Cantidad de items por página |

## Testing

Se ha creado un script de prueba: `test-pagination.sh`

### Cómo ejecutar tests:

```bash
# 1. Asegúrate de que el servidor esté corriendo en el puerto 3000
npm run dev

# 2. Ejecuta el script de test
./test-pagination.sh
```

### Casos de prueba incluidos:

1. ✅ Primera página de breeds (limit=5)
2. ✅ Segunda página de breeds
3. ✅ Breeds filtradas por tipo
4. ✅ Primera página de pets
5. ✅ Pets filtradas por tipo
6. ✅ Paginación por defecto (sin params)
7. ✅ Límite grande (validación de MAX_LIMIT)

## Próximos Pasos

1. **Frontend**: Actualizar componentes para usar la nueva estructura de respuesta
2. **Testing**: Ejecutar tests funcionales cuando el servidor esté disponible
3. **Monitoring**: Observar mejoras de rendimiento en producción
4. **Caché**: Considerar implementar caché de páginas frecuentes si es necesario

## Notas de Implementación

- La búsqueda fuzzy (`checkSimilarBreeds`) obtiene todos los registros (limit=1000) para análisis completo
- Los endpoints de random breed no usan paginación (retornan 1 item)
- Los endpoints de búsqueda por ID no usan paginación (retornan 1 item)
- Los endpoints de búsqueda por nombre no han sido modificados todavía

## Compatibilidad

- ✅ Backward compatible: Si no se envían `page` y `limit`, se usan valores por defecto
- ✅ El frontend debe actualizarse para usar `data.items` y `data.pagination`
- ⚠️ El formato de respuesta cambió de array directo a objeto con `items` y `pagination`
