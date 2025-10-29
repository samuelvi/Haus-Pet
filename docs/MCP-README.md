# HausPet MCP Server

Un servidor MCP (Model Context Protocol) para interactuar con la API de HausPet desde Claude Desktop.

## Características

El MCP expone 4 herramientas para interactuar con mascotas:

- **list_all_pets**: Lista todas las razas de mascotas disponibles
- **list_pets_by_type**: Lista mascotas filtradas por tipo (cat, dog, bird)
- **get_random_pet**: Obtiene una mascota aleatoria (opcionalmente por tipo)
- **add_pet**: Agrega una nueva raza de mascota a la base de datos

## Instalación

### 1. Construir el proyecto

```bash
npm install
npm run build
```

### 2. Configurar Claude Desktop

Edita el archivo de configuración de Claude Desktop:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Agrega la siguiente configuración (ajusta la ruta según tu sistema):

```json
{
  "mcpServers": {
    "hauspet": {
      "command": "node",
      "args": [
        "/ruta/completa/a/HausPet/dist/mcp-server.js"
      ],
      "env": {
        "HAUSPET_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### 3. Iniciar los servicios

Antes de usar el MCP, asegúrate de que la API de HausPet esté corriendo:

```bash
# Terminal 1: Iniciar servicios con Docker
make up

# Terminal 2: Iniciar el servidor API
npm run dev

# Terminal 3: Iniciar el worker de auditoría
npm run start:worker
```

### 4. Reiniciar Claude Desktop

Cierra y vuelve a abrir Claude Desktop para que cargue el MCP.

## Uso

Una vez configurado, puedes hacer preguntas a Claude como:

### Consultas (Read)
- "¿Puedes listarme todas las mascotas disponibles?"
- "Muéstrame todos los perros"
- "Dame una mascota aleatoria"
- "¿Qué gatos tienes en la base de datos?"
- "Dame un pájaro aleatorio"

### Operaciones de escritura (Write)
- "Agrega un Beagle a la base de datos"
- "Añade un gato de raza Siamese"
- "Crea una nueva mascota: Golden Retriever, tipo perro"

Claude automáticamente usará las herramientas del MCP para interactuar con tu API local.

## Verificación

Para verificar que el MCP está funcionando correctamente:

1. Abre Claude Desktop
2. Busca el ícono de herramientas (🔧) o plugins
3. Deberías ver "hauspet" listado con 4 herramientas disponibles

## Variables de entorno

- `HAUSPET_API_URL`: URL base de la API (default: `http://localhost:3000`)

## Troubleshooting

**El MCP no aparece en Claude Desktop:**
- Verifica que la ruta en `claude_desktop_config.json` sea absoluta y correcta
- Revisa los logs de Claude Desktop en la sección de desarrollador
- Asegúrate de haber reiniciado Claude Desktop después de editar la config

**Error de conexión al hacer consultas:**
- Verifica que la API esté corriendo en `http://localhost:3000`
- Comprueba que los servicios de Docker (Postgres, MongoDB, Redis) estén activos: `docker ps`
- Revisa los logs del servidor: `npm run dev`

**El build falla:**
- Asegúrate de tener todas las dependencias: `npm install`
- Verifica la versión de Node.js (requiere >= 22)
