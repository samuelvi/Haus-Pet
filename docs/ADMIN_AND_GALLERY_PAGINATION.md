# Admin y Gallery - Implementación de Paginación

## Resumen

Se ha implementado paginación con **10 items por página** tanto en los endpoints de administración como en el frontend (PetGallery), configurables mediante variables de entorno.

---

## 🔧 Backend - Admin Endpoints

### Endpoint Modificado

**`GET /api/admin/breed-types`** - Lista tipos de razas (Admin only)
- **Paginación**: 10 items por página (default)
- **Configurable**: Variable de entorno `ADMIN_PAGE_SIZE`

### Archivos Modificados

#### 1. **Variables de Entorno**
**Archivo**: `app/api/.env.example`
```env
# Pagination Configuration
DEFAULT_PAGE_SIZE=20        # Para endpoints públicos
ADMIN_PAGE_SIZE=10          # Para endpoints de admin
MAX_PAGE_SIZE=100           # Límite máximo
```

#### 2. **Domain Layer**
**Archivo**: `app/api/domain/pagination.ts`
```typescript
export const ADMIN_PAGE_SIZE = parseInt(process.env.ADMIN_PAGE_SIZE || '10', 10);
```

**Archivo**: `app/api/domain/breed-type.repository.ts`
- Actualizada interfaz `findAll(page?, limit?)` para soportar paginación

#### 3. **Repository Layer**
**Archivo**: `app/api/infrastructure/repositories/postgres-breed-type.repository.ts`
- Implementa paginación con `skip` y `take` de Prisma
- Offset: `(page - 1) * limit`

#### 4. **Service Layer**
**Archivo**: `app/api/application/breed-type.service.ts`
```typescript
async list(page = 1, limit?: number): Promise<PaginatedResponse<BreedType>> {
  const adminPageSize = parseInt(process.env.ADMIN_PAGE_SIZE || '10', 10);
  // Usa ADMIN_PAGE_SIZE como default si limit no se proporciona
  // Fetch N+1 para detectar si hay más páginas
  return calculatePaginationMeta(types, page, limit);
}
```

#### 5. **Controller Layer**
**Archivo**: `app/api/infrastructure/http/controllers/breed-type.controller.ts`
```typescript
list = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const limit = req.query.limit
    ? parseInt(req.query.limit, 10)
    : parseInt(process.env.ADMIN_PAGE_SIZE || '10', 10);

  const result = await this.service.list(page, limit);
  res.json({ status: "OK", data: result });
};
```

### Formato de Respuesta
```json
{
  "status": "OK",
  "data": {
    "items": [
      { "id": "...", "name": "dog" }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

---

## 🎨 Frontend - Pet Gallery

### Componente Modificado
**`app/frontend/src/components/PetGallery.tsx`**

### Características Implementadas

#### 1. **Estado de Paginación**
```typescript
const [page, setPage] = useState<number>(1);
const [pagination, setPagination] = useState<PaginationMeta | null>(null);
const PAGE_SIZE = 10; // Configurable (puede moverse a .env)
```

#### 2. **Carga de Datos con Paginación**
```typescript
const loadPets = async () => {
  let result;
  if (typeFilter) {
    result = await petService.getPetsByType(typeFilter, page, PAGE_SIZE);
  } else {
    result = await petService.getAllPets(page, PAGE_SIZE);
  }
  setPets(result.items);
  setPagination(result.pagination);
};
```

#### 3. **Navegación de Páginas**
- **Botón Anterior**: Solo visible si `hasPrevious = true`
- **Botón Siguiente**: Solo visible si `hasNext = true`
- **Auto-scroll**: Al cambiar de página, scroll automático al inicio
- **Reset de página**: Al cambiar de filtro, vuelve a página 1

#### 4. **UI de Paginación**

**Información de Página** (encima de la galería):
```
Page 1 • Showing 10 pets
```

**Controles de Navegación** (debajo de la galería):
```
[ ← Previous ]  [ Page 1 ]  [ Next → ]
```

- Botones deshabilitados cuando no hay más páginas
- Estilos diferenciados para estados activo/deshabilitado
- Iconos SVG para mejor UX

### Archivos Modificados

#### 1. **Tipos**
**Archivo**: `app/frontend/src/types/pet.types.ts`
```typescript
export interface PaginationMeta {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
```

#### 2. **Servicio**
**Archivo**: `app/frontend/src/services/pet.service.ts`
```typescript
async getAllPets(page = 1, limit = 10): Promise<PaginatedResponse<Pet>> {
  const response = await fetch(`${API_URL}/api/pets?page=${page}&limit=${limit}`);
  const json = await response.json();
  return json.data; // { items, pagination }
}

async getPetsByType(type, page = 1, limit = 10): Promise<PaginatedResponse<Pet>> {
  const response = await fetch(`${API_URL}/api/pets/type/${type}?page=${page}&limit=${limit}`);
  const json = await response.json();
  return json.data;
}
```

#### 3. **Componente**
**Archivo**: `app/frontend/src/components/PetGallery.tsx`
- Añadido estado de paginación
- Funciones `handleNextPage()` y `handlePreviousPage()`
- Función `handleFilterChange()` que resetea a página 1
- UI de información de página
- UI de controles de navegación (Previous/Next)

---

## 📊 Comparación: Público vs Admin

| Aspecto | Endpoints Públicos | Admin Endpoints | Frontend Gallery |
|---------|-------------------|-----------------|------------------|
| **Default Page Size** | 20 | 10 | 10 |
| **Variable ENV** | `DEFAULT_PAGE_SIZE` | `ADMIN_PAGE_SIZE` | Hardcoded (puede ser ENV) |
| **Ejemplos** | `/api/breeds`, `/api/pets` | `/api/admin/breed-types` | PetGallery |
| **Formato Respuesta** | `{ status, data: { items, pagination } }` | `{ status, data: { items, pagination } }` | N/A |

---

## 🧪 Testing

### Endpoints de Admin
```bash
# Primera página (10 items)
curl "http://localhost:3000/api/admin/breed-types?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-session-id: YOUR_SESSION_ID"

# Segunda página
curl "http://localhost:3000/api/admin/breed-types?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-session-id: YOUR_SESSION_ID"
```

### Frontend Gallery
1. Abrir `http://localhost:5173` (o puerto del frontend)
2. Navegar a la galería de mascotas
3. Verificar que se muestran 10 mascotas por página
4. Probar botones "Previous" y "Next"
5. Cambiar filtros y verificar que resetea a página 1

---

## 🔄 Flujo Completo

### Usuario en Gallery
1. **Carga inicial**: Se muestran 10 mascotas (página 1)
2. **Filtrar por tipo**: Click en "Dogs" → Reset a página 1, muestra 10 perros
3. **Siguiente página**: Click en "Next" → Muestra mascotas 11-20
4. **Página anterior**: Click en "Previous" → Vuelve a mascotas 1-10
5. **Cambiar filtro**: Click en "Cats" → Reset a página 1, muestra 10 gatos

### Admin en Dashboard
1. **Lista breed types**: GET `/api/admin/breed-types` → 10 tipos por página
2. **Respuesta incluye**: `hasNext`, `hasPrevious` para navegación
3. **Frontend puede**: Implementar botones Previous/Next basados en metadata

---

## ✅ Ventajas de esta Implementación

### Backend
1. ✅ **Configurable**: Page sizes desde variables de entorno
2. ✅ **Consistente**: Mismo patrón N+1 en todos los endpoints
3. ✅ **Eficiente**: Sin COUNT queries, mejor rendimiento
4. ✅ **Escalable**: Funciona igual con 100 o 1,000,000 registros

### Frontend
1. ✅ **UX Mejorada**: Navegación clara con Previous/Next
2. ✅ **Performance**: Carga solo 10 items a la vez
3. ✅ **Feedback Visual**: Usuario sabe en qué página está
4. ✅ **Responsive**: Botones deshabilitados cuando no hay más páginas
5. ✅ **Auto-scroll**: Navegación fluida al cambiar de página

---

## 📝 Variables de Entorno

### Backend `.env`
```env
# Pagination
DEFAULT_PAGE_SIZE=20
ADMIN_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

### Frontend `.env` (opcional, futuro)
```env
VITE_GALLERY_PAGE_SIZE=10
```

---

## 🚀 Próximos Pasos

1. **Frontend Admin**: Implementar paginación en otros dashboards de admin
2. **Environment Variables**: Mover `PAGE_SIZE` del frontend a `.env`
3. **Infinite Scroll**: Como alternativa a Previous/Next en mobile
4. **Skeleton Loading**: Mejor UX durante la carga
5. **URL State**: Guardar página actual en URL (`?page=2`)

---

## 📦 Resumen de Cambios

### Backend (5 archivos)
- ✅ `domain/pagination.ts` - Añadido `ADMIN_PAGE_SIZE`
- ✅ `domain/breed-type.repository.ts` - Interfaz con paginación
- ✅ `infrastructure/repositories/postgres-breed-type.repository.ts` - Implementación
- ✅ `application/breed-type.service.ts` - Lógica de paginación
- ✅ `infrastructure/http/controllers/breed-type.controller.ts` - Query params
- ✅ `.env.example` - Documentación de variables

### Frontend (3 archivos)
- ✅ `types/pet.types.ts` - Tipos `PaginationMeta` y `PaginatedResponse`
- ✅ `services/pet.service.ts` - Métodos con paginación
- ✅ `components/PetGallery.tsx` - UI y lógica de navegación

**Total**: 9 archivos modificados/creados
**Build**: ✅ Sin errores
**Listo para testing**: ✅
