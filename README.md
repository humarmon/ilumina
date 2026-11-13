# ilumina

Lector de braille (signografía ONCE, español) a partir de fotos o escaneos de hojas en relieve.
Detecta los puntos, los agrupa en celdas y líneas, decodifica y dibuja la letra sobre cada celda
(sin tapar los puntos) para que lo pueda leer quien no sabe braille.

## Estado
Prototipo. Funciona con los escáneres de los libros con que se desarrolló; las rutas usan /tmp
y hay que adaptarlas. No está probado de principio a fin tras reordenar los archivos.

## Piezas
- `src/core.js`: detección de puntos, líneas, decodificación ONCE.
- `src/run_basic.js`, `src/run3.js`, `src/refine.js`: ejecución y recuperación de puntos tenues.
- `src/render.py`: imagen anotada (letras rojas, naranja = dudoso).
- `src/ejemplo_correccion_cabeceras.py`: ejemplo de corrección manual de números de página.

## Requisitos
Node.js, Python 3 con Pillow y OpenCV.

## Nota
No incluye páginas de libros ni resultados, por derechos de autor.
