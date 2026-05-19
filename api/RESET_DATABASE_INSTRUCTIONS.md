# Instrucciones para Reiniciar la Base de Datos

## Opción 1: Usar un cliente MySQL remoto (Recomendado)

Puedes usar cualquier cliente MySQL para conectarte y ejecutar el script:

### Usando MySQL Workbench, DBeaver, o similar:
1. Conecta a la base de datos:
   - Host: `64.225.35.43`
   - Puerto: `3306`
   - Usuario: `tech`
   - Contraseña: `7VDhO87JEpzaM79b`
   - Base de datos: `my_strategee`

2. Ejecuta el script `reset-database.sql`

### Usando terminal si instalas MySQL client:
```bash
# Instalar MySQL client en macOS
brew install mysql-client

# Agregar al PATH
echo 'export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Ejecutar el script
mysql -h 64.225.35.43 -P 3306 -u tech -p my_strategee < reset-database.sql
# Cuando solicite password: 7VDhO87JEpzaM79b
```

## Opción 2: Usar Node.js para ejecutar el script

Ejecuta el siguiente comando desde el proyecto:

```bash
npm run ts-node reset-database-node.ts
```

## Opción 3: Desactivar DB_SYNC temporalmente

Si no puedes acceder a la base de datos directamente:

1. En `.env`, cambia `DB_SYNC=false`
2. Contacta al administrador de la base de datos para que ejecute el script `reset-database.sql`
3. Una vez limpia la BD, vuelve a cambiar `DB_SYNC=true`

## Después de limpiar la base de datos

Una vez ejecutado el script de limpieza:

```bash
# Iniciar el servidor - TypeORM creará las tablas automáticamente
npm run start:dev
```

TypeORM detectará que no hay tablas y las creará automáticamente con la estructura correcta de nuestra entidad User.
