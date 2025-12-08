# Breed Filtering and Pagination Tests

Este archivo contiene tests funcionales completos para verificar el comportamiento de filtrado y paginación en la página `/admin/breeds`.

## Prerequisitos

Instalar los navegadores de Playwright (solo la primera vez):

```bash
npx playwright install
```

## Ejecutar los tests

### Modo headless (sin interfaz gráfica)
```bash
npx playwright test tests/functional/breed-filtering-pagination.spec.ts
```

### Modo headed (con navegador visible)
```bash
npx playwright test tests/functional/breed-filtering-pagination.spec.ts --headed
```

### Modo debug (paso a paso)
```bash
npx playwright test tests/functional/breed-filtering-pagination.spec.ts --debug
```

### Ejecutar un test específico
```bash
npx playwright test tests/functional/breed-filtering-pagination.spec.ts -g "should filter breeds by dog type"
```

## Cobertura de tests

El test suite incluye 12 tests que verifican:

### 1. Filtros de Breed Types
- ✅ Mostrar todos los tipos de breed como botones (dog, cat, bird, fish, rabbit, etc.)
- ✅ Filtrar breeds por tipo "dog"
- ✅ Filtrar breeds por tipo "cat"
- ✅ Volver a mostrar todos los breeds al hacer clic en "All"

### 2. Búsqueda
- ✅ Buscar breeds por nombre
- ✅ Combinar búsqueda con filtro de tipo
- ✅ Limpiar búsqueda con botón "Clear"

### 3. Paginación
- ✅ Mantener filtros activos al cambiar de página (Next/Previous)
- ✅ Resetear a página 1 al cambiar de filtro
- ✅ Mostrar información correcta de paginación
- ✅ Deshabilitar botón "Previous" en la primera página

### 4. Navegación del Navegador
- ✅ Mantener filtros al usar el botón "atrás" del navegador
- ✅ URL correcta con parámetros: `?page=2&petType=dog&search=beagle`

## Estructura del Test

```typescript
test.describe('Breed Filtering and Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin y navegar a /admin/breeds
  });

  test('should display all breed types as filter buttons', async ({ page }) => {
    // Verifica que se muestren todos los tipos de breed
  });

  test('should filter breeds by dog type', async ({ page }) => {
    // Verifica filtrado por tipo
  });

  test('should maintain filter when paginating', async ({ page }) => {
    // Verifica que los filtros se mantengan al paginar
  });

  // ... más tests
});
```

## Casos de Prueba Detallados

### Filtrado por Tipo
1. Usuario hace clic en botón "Dog"
2. URL se actualiza a `?page=1&petType=dog`
3. Solo se muestran breeds de tipo "dog"
4. Al hacer clic en "Next", la URL mantiene `petType=dog`

### Búsqueda por Nombre
1. Usuario escribe "beagle" en el campo de búsqueda
2. Usuario presiona Enter o hace clic en "Search"
3. URL se actualiza a `?page=1&search=beagle`
4. Se muestran resultados que coinciden con "beagle"

### Filtros Combinados
1. Usuario filtra por "dog"
2. Usuario busca "beagle"
3. URL contiene ambos parámetros: `?page=1&petType=dog&search=beagle`
4. Se muestran solo beagles (dogs que coinciden con la búsqueda)

### Navegación con Historial
1. Usuario filtra por "dog" (página 1)
2. Usuario hace clic en "Next" (página 2)
3. Usuario hace clic en botón "atrás" del navegador
4. Vuelve a página 1 con filtro "dog" activo

## Datos de Prueba

El test asume que la base de datos tiene al menos:
- Breeds de tipo "dog" (ej: Beagle, Labrador, etc.)
- Breeds de tipo "cat" (ej: Persian, Siamese, etc.)
- Breeds de tipo "bird", "fish", "rabbit"
- Suficientes breeds para tener múltiples páginas (más de 4 por tipo)

## Solución de Problemas

### Error: "Executable doesn't exist"
Ejecutar: `npx playwright install`

### Tests fallan en CI/CD
Asegurarse de instalar navegadores en el pipeline:
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps
```

### Timeout en login
Verificar que:
- El servidor está corriendo en `http://localhost`
- Las credenciales de admin son correctas: `admin@hauspet.com` / `admin123`
- La base de datos está inicializada con datos de seed

## Mantenimiento

Si se agregan nuevos tipos de breed:
1. El test automáticamente los detectará (carga dinámica)
2. No es necesario actualizar el test
3. Solo verificar que el test "should display all breed types as filter buttons" pase

Si se cambia el diseño de la UI:
- Actualizar los selectores en el test (ej: `button:has-text("Dog")`)
- Verificar que los class names de Tailwind sigan siendo los mismos
