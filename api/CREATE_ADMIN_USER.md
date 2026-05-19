# Crear Usuario Administrador

Ya que no tienes el cliente MySQL instalado, aquí tienes **3 opciones** para crear el usuario administrador:

## Opción 1: Usar el Endpoint de Sign-Up (MÁS RÁPIDO) ⚡

Puedes usar el endpoint público de registro y luego actualizar el rol:

### Paso 1: Registrar el usuario
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@strategee.com",
    "password": "Admin123!"
  }'
```

Esto te dará un `accessToken`. **Copia el accessToken de la respuesta.**

### Paso 2: Actualizar el rol a ADMIN

Necesitarás ejecutar SQL directamente en la base de datos para cambiar el rol:

```sql
UPDATE users 
SET roles = '["ADMIN"]' 
WHERE email = 'admin@strategee.com';
```

**Credenciales finales:**
- 📧 Email: `admin@strategee.com`
- 🔑 Password: `Admin123!`
- 👑 Rol: `ADMIN`

---

## Opción 2: Usar Cliente MySQL GUI (RECOMENDADO) 🎯

Usa DBeaver, MySQL Workbench, TablePlus, o cualquier cliente MySQL:

1. Conecta a:
   - Host: `64.225.35.43`
   - Puerto: `3306`
   - Usuario: `tech`
   - Password: `7VDhO87JEpzaM79b`
   - Base de datos: `my_strategee`

2. Ejecuta el archivo `create-admin.sql`

---

## Opción 3: Usar Postman/Thunder Client 🚀

### 1. Registrar usuario
```
POST http://localhost:3000/api/v1/auth/sign-up
Content-Type: application/json

{
  "email": "admin@strategee.com",
  "password": "Admin123!"
}
```

### 2. Actualiza el rol en la base de datos
Conéctate a la BD y ejecuta:
```sql
UPDATE users 
SET roles = '["ADMIN"]' 
WHERE email = 'admin@strategee.com';
```

---

## Verificar que funciona

### 1. Iniciar sesión
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@strategee.com",
    "password": "Admin123!"
  }'
```

Deberías recibir:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@strategee.com",
    "roles": ["ADMIN"]
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 2. Probar endpoint protegido (crear otro usuario)
```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

---

## Credenciales del Administrador

```
📧 Email:    admin@strategee.com
🔑 Password: Admin123!
👑 Rol:      ADMIN
```

Con estas credenciales podrás:
- ✅ Crear otros usuarios
- ✅ Listar todos los usuarios
- ✅ Actualizar cualquier usuario
- ✅ Eliminar usuarios
- ✅ Acceder a todos los endpoints protegidos

---

## Swagger UI (Interfaz Visual)

La forma más fácil de probar los endpoints es usando Swagger:

1. Abre en tu navegador: **http://localhost:3000/api**
2. Haz clic en **"Authorize"** (botón con candado)
3. Primero usa `/auth/sign-in` para obtener el `accessToken`
4. Copia el token y pégalo en el modal de autorización: `Bearer tu_token_aqui`
5. ¡Ahora puedes probar todos los endpoints!
