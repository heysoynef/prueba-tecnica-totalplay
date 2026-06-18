# Prueba técnica Frontend

Se requiere desarrollar un portal web que implemente un CRUD para la gestión de libros.

## Pantallas

Se deberán incluir las siguientes pantallas:

- Inicio de sesión
- Pantalla de libros
- Pantalla de autores

Al final viene una liga con una propuesta de diseño.

## Campos requeridos

### Libros

- ID
- Título
- ISBN
- ID de autor
- Número de páginas
- URL de la portada

### Autores

- ID
- Nombre
- Fecha de nacimiento

## Requerimientos

- Deberá estar React JS a partir de la versión 17.
- Deberá utilizar archivos JSON para simular las bases de datos de usuarios, libros y autores.
- Deberá utilizar JWT para manejar las sesiones del usuario.
- Deberá terminar la sesión pasada 1 hora y mostrar un mensaje de aviso.
- Deberá utilizar un API de tipo SOAP para validar el ISBN *(adjunto al final)*.
- Deberá utilizar un API de tipo REST para obtener la URL de la portada *(adjunto al final)*.
- La consulta de libros y autores deberá estar paginada.
- La consulta de libros deberá permitir opcionalmente la búsqueda en los campos título y autor.
- En la creación de libros no se deberá pedir la URL de la portada, ya que debe obtenerse mediante el API REST.
- En la creación de libros y autores no deberá pedir el ID, ya que se deberá generar en automático como un UUID.
- Todos los formularios deberán estar validados y resaltar el campo con errores.
- Los campos deberán tener validaciones de cadenas vacías y de tamaño. El tamaño queda a consideración del desarrollador.
- Para la carga masiva de libros se deberá cargar y procesar un archivo con extensión CSV.
- No habrá carga masiva de autores.
- Cuando se elimine un autor, se deberán eliminar todos los libros asociados a él.
- El título del libro y el nombre del autor deberán estar normalizados en mayúsculas, no permitir números ni espacios en blanco seguidos y deberán convertir caracteres especiales. *(e.g. ñ -> N, á -> A, ü -> U, etc.)*

## Deseable

- Deberá contar con una versión responsive.

## Entrega

El tiempo límite para entregar el desarrollo es de **3 días naturales**. El proyecto deberá subirse a un repositorio de Git de acceso público **(todos excepto GitHub)**.

## APIs

### API REST: Carátula de libros

```text
https://openlibrary.org/api/books?bibkeys=ISBN%3A0201558025&format=json
```

### API SOAP: Validación de ISBN

```text
webservices.daehosting.com/services/isbnservice.wso?wsdl
```

## Diseño base

```text
https://www.figma.com/design/27K07tMM6S3m6tGtFYuNEu/Untitled?node-id=0-1&t=5TpxUcqgSP0VYFlB-1
```

> Puede utilizar estas APIs públicas o cualquier otra.
