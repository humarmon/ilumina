# ilumina

Lector de braille (signografía ONCE, español) a partir de fotos o escaneos de hojas en relieve.
Pone la letra sobre cada celda, sin tapar los puntos, para quien no sabe braille.

## Fases
1. `fase1_puntos/`: detectar y recuperar puntos (incluidos los tenues, usando la rejilla regular Perkins).
   - `preparar.py`: PDF -> páginas en gris; detecta el lado de las anillas y borra esa franja (ahí no hay braille); salta páginas que no son braille.
   - `detectar_basico.js`: detección directa. `candidatos.js` + `recuperar.js`: recuperación guiada por rejilla, iterable.
2. `fase2_analisis/core.js`: líneas, celdas y decodificación ONCE.
3. `fase3_contexto/corregir.py`: corrección por contexto a partir de `datos/*/correcciones.json`.
   `fase3_contexto/reglas.py`: reglas automáticas (la celda 2-3-5 `¡` entre números y antes de `=` es el signo `+`).
4. `render/render.py`: imagen anotada (rojo = leído, naranja = dudoso).
- `datos/`: correcciones guardadas. `herramientas/`: `exportar_datos.py`, `evaluar.py`.

## Uso rápido
`python herramientas/iluminar.py entrada.pdf salida.pdf` hace todo el proceso (necesita poppler, node, numpy, scipy, Pillow).
En el PDF final, rojo = leído, naranja = dudoso. Arriba a la derecha: nº de página braille (y a su izquierda el nº de página del libro impreso).

## Uso (resumen)
Variable `WORK` = carpeta de trabajo con `n{i}.raw/.dim/.png` (escala de grises, uint8).
`node fase1_puntos/detectar_basico.js i` → `python fase3_contexto/corregir.py ...` → `python render/render.py carpeta i salida.jpg`.

## Estado
Prototipo. La fase 3 se ha comprobado: reproduce las correcciones del Libro 3 (25 de 25 páginas
idénticas). El resto de fases se ha reordenado y parametrizado sin repetir la ejecución completa
con imágenes. Fase 1 pendiente: realzar la imagen con la rejilla Perkins *antes* de decodificar.
Acierto medido sin corrección en el Libro 3: ver `herramientas/evaluar.py`.
Sin páginas de libros ni imágenes en el repositorio.
