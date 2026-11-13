# Datos: correcciones

Cada `pNN.json` es una página: líneas con `celdas` ([patrón de puntos, letra]), `leido` (lo que sacó el
programa), `correcto` (texto tras la corrección por contexto) y `estado` (ok, pie, ilegible).
`libro3/correcciones.json` guarda las correcciones manuales por página y línea (con sus marcas).

Sirven para: medir el acierto (`herramientas/evaluar.py`), ajustar umbrales y, más adelante, entrenar un modelo.

Aviso: contienen texto de libros del colegio. Mantén el repositorio **privado**.
Notas: en `libro3` las páginas 1–5 se corrigieron a mano aparte (no están en correcciones.json).
En `mates` solo se corrigieron las cabeceras, así que su "acierto" no es significativo.
