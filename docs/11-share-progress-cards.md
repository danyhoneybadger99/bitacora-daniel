# Tarjetas sociales / Compartir progreso

Sistema local para generar tarjetas visuales desde el Dashboard y compartirlas manualmente como imagen o texto. En Dashboard funciona como accion secundaria: aparece despues de las metricas principales, metas y resumen operativo con el copy `Comparte un avance`.

## Alcance

- La tarjeta se genera en el navegador.
- No publica automaticamente en redes.
- No envia correos ni datos a servicios externos.
- No modifica calculos de nutricion, ayuno, hidratacion, ejercicio, Krav Maga ni check-in.
- No cambia la logica de guardado ni persistencia.
- No usa librerias externas.

## Flujo del modal

El modal muestra primero `Elige que quieres compartir`.

Grupos:

- Logros y avances: Disciplina diaria, Hito fisico, Krav Maga, Sobriedad y Resumen mensual.
- Post del dia: Alimentacion y Ejercicio.

Estados:

- `ready`: hay datos reales suficientes para compartir.
- `in_progress`: hay datos parciales reales, pero el dia o logro no esta completo.
- `no_record_today`: la fuente existe, pero no hay registro hoy.
- `missing_data_source`: falta conectar una fuente estructurada real.

Diferencia importante:

- `no_record_today` no es un bug; indica que el usuario todavia no registro comida o ejercicio hoy.
- `missing_data_source` significa que la app aun no tiene una fuente real conectada, por ejemplo sobriedad o resumen mensual.

Despues de elegir tarjeta, el usuario puede seleccionar:

- Modo: Publico / Personal.
- Estilo: solo aparece cuando hay mas de una plantilla real para ese tipo.

## Contrato de tarjeta

Cada resumen derivado produce:

- `type`
- `availability`
- `eyebrow`
- `headline`
- `heroValue`
- `heroUnit`
- `contextLine`
- `title`
- `subtitle`
- `primaryMetric`
- `primaryMetricLines` opcional, maximo 2 lineas grandes controladas
- `primaryLabel`
- `badges` maximo 4
- `footerPhrase`
- `storyLine`
- `privacyLevel`
- `textToCopy`

La tarjeta visual usa estructura fija 9:16 sin scroll interno:

- Eyebrow pequeno.
- Fecha o periodo.
- Headline emocional.
- Hero numerico o frase corta.
- Contexto humano breve.
- 3 a 4 badges.
- Frase final.
- Footer publico discreto: `Bitácora Daniel`.

Reglas visuales:

- Titulo principal maximo 2 lineas.
- Metrica principal maximo 2 lineas.
- Badges maximo 4.
- Footer y frase final siempre visibles.
- Textos largos se envuelven de forma segura y, si hace falta, se truncan con `...`.
- Si una metrica grande puede romperse, se define manualmente en `primaryMetricLines`, por ejemplo `AVANCE / CONSTANTE`, `COMIDA / COMPLETA`, `SIN / REGISTRO` o `CINTA / NARANJA`.
- No se muestra texto tecnico dentro de la imagen publica, por ejemplo `Generado localmente` o `Compartir manual`.
- Cada categoria tiene direccion visual propia: sobriedad azul profundo, alimentacion tipo post de comida, ejercicio oscuro/deportivo y Krav Maga naranja/negro.
- V9 prioriza hook, numero fuerte y mini historia para que la tarjeta no parezca reporte tecnico.

## Tarjetas principales

Tipos listos:

- Disciplina diaria.
- Hito fisico.
- Krav Maga.
- Sobriedad.
- Alimentacion, cuando existe comida registrada hoy.

Tipos condicionados:

- Ejercicio depende de tener una sesion registrada hoy.

Tipos en preparacion:

- Resumen mensual.

Tipo promocional:

- Invitar a Bitacora.
- No usa datos personales.
- Vive en el grupo `Comparte la app`.
- Caption sugerido: `Estoy usando Bitacora Daniel para registrar nutricion, entrenamiento, ayuno y progreso fisico con ayuda de IA. Si tambien estas trabajando en tus habitos, pruebala aqui: https://bitacora-daniel.vercel.app`

## V10: enfoque de redes sociales

La afinacion visual usa una direccion mas viva para historias de Instagram, Facebook y TikTok:

- Paleta base: fondo oscuro, rojo vino, rojo acento, dorado, crema y blanco calido.
- Alimentacion con foto usa layout editorial: foto arriba y contenido abajo para evitar que texto y comida compitan.
- El overlay de foto es oscuro para mantener contraste.
- Alimentacion sin foto usa fondo oliva/crema/dorado sin ilustraciones genericas.
- Ejercicio usa azul oscuro/negro con acento cian.
- Krav Maga conserva naranja/negro con mas contraste.
- Sobriedad mantiene azul profundo y numero fuerte.
- La tarjeta promocional muestra `HABITOS / CON DIRECCION`, CTA `Pruebala gratis` y el footer `bitacora-daniel.vercel.app`.
- No se muestran textos tecnicos dentro de la imagen publica.

### Disciplina diaria

- `ready` si cumple 5 a 6 habitos.
- `under_construction` si cumple 0 a 4 habitos.
- Descargar y Compartir se bloquean mientras este en construccion.

Habitos evaluados:

- Calorias.
- Proteina.
- Grasa.
- Ayuno.
- Hidratacion.
- Actividad.

Modo publico no muestra gramos ni calorias exactas.

### Hito fisico

- `ready` si existen peso actual y peso objetivo.
- `missing_data_source` si falta peso actual u objetivo.

Usa numeros reales cuando existen: peso actual, peso objetivo, distancia a meta, grasa corporal y musculo. No usa `AVANCE CONSTANTE` como dato principal.

### Krav Maga

- `ready` si existe snapshot real de Krav Maga.
- `missing_data_source` si no existe curriculo o snapshot activo.

Muestra cinta actual, objetivo, avance y proxima tecnica si existen en el perfil activo.

Regla profile-aware:

- Debe usar Krav Maga del perfil activo.
- Daniel ve su Krav Maga.
- Jesus/Krav 360 ve su propio Krav Maga si existe.
- Si faltan datos reales, muestra `Por registrar` o `Sin dato`.
- No copia cinta naranja, avance ni tecnicas de Daniel a otros perfiles.

### Sobriedad

Estado actual: `ready`.

- Usa fuente interna local fija: `2023-12-28`.
- Es exclusiva del perfil Daniel.
- No aparece para Jesus, Krav 360, fitness-basic ni modo local publico.
- No crea pestaña nueva.
- No crea formulario.
- No guarda nada en perfil ni snapshot.
- No toca Supabase.
- Texto humano: `Desde el 28 de diciembre de 2023`.
- Contexto confirmado: jueves 28 de diciembre de 2023.
- Resultado esperado al 2026-05-22: 876 dias.
- Resultado esperado al 2026-05-26: 880 dias.

El calculo usa diferencia entre fechas locales por dia calendario, no horas exactas, para evitar errores por timezone.

### Resumen mensual

Estado actual sin agregados: `missing_data_source`.

TODO:

- Conectar metricas mensuales reales antes de mostrar numeros acumulados.

## Tarjeta Alimentacion

Fuente:

- Registros reales de comida del dia.
- No usa bebidas como comida principal.
- Si hay varias comidas, el modal muestra selector `Comida para compartir`.
- Si no hay comida hoy, usa `no_record_today` y muestra: `No hay comida registrada hoy. Ve a Alimentacion, registra una comida y vuelve para compartirla.`

Como compartir una comida:

1. Registrar una comida del dia en la pestaña Alimentos.
2. Usar el boton `Compartir comida` en el registro visible.
3. La app abre `Compartir progreso`, selecciona Alimentacion y usa esa comida como fuente.
4. Tambien se puede abrir desde Dashboard > `Ver tarjeta` y elegir Alimentacion manualmente.
5. Siempre usa registros del perfil activo; no mezcla alimentos entre perfiles.

Modo Publico:

- Discreto: no muestra calorias exactas ni gramos exactos.
- Con macros: muestra kcal, proteina, carbs y grasa si el usuario elige ese nivel de detalle.
- No muestra datos sensibles.
- El nombre visible del platillo se trunca a maximo 80 caracteres.
- Usa maximo 3 chips en discreto: alto en proteina, comida completa y hecho en casa solo si el registro lo sugiere.
- En `Con macros`, el hero puede cambiar a proteina o kcal y los chips muestran macros reales del registro seleccionado.

Nivel de detalle:

- `Discreto`: muestra calidad, tipo de comida y señales generales.
- `Con macros`: muestra energia, proteina, carbohidratos y grasa del registro seleccionado.

Modo Personal:

- Puede mostrar calorias, proteina, grasa, carbohidratos, nombre y notas si ya existen.
- Aun asi, las notas largas se truncan visualmente para no romper la tarjeta.

Foto local:

- Boton propio: `Agregar foto del platillo`.
- El input nativo queda oculto.
- Si hay foto, se muestra mini preview.
- El usuario puede cambiar o quitar la foto.
- La foto entra en la imagen exportada.
- No se persiste.
- No se sube a servidor.
- No se guarda en snapshot.

Inferencia `Whole foods`:

- Es basica y local.
- Usa nombre, categoria o notas cuando hay palabras simples como pollo, pescado, ensalada, verduras, casero, etc.
- Si no hay informacion suficiente, muestra `Comida registrada`.

## Tarjeta Ejercicio

Fuente:

- Registros reales de ejercicio del dia.
- Si hay varias sesiones, el modal muestra selector `Sesion para compartir`.
- Si no hay ejercicio hoy, usa `no_record_today` y muestra: `No hay ejercicio registrado hoy. Registra una sesion de entrenamiento y vuelve para compartirla.`

Como compartir una sesion:

1. Registrar una sesion del dia en la pestaña Ejercicio.
2. Usar el boton `Compartir sesion` en el registro visible.
3. La app abre `Compartir progreso`, selecciona Ejercicio y usa esa sesion como fuente.
4. Tambien se puede abrir desde Dashboard > `Ver tarjeta` y elegir Ejercicio manualmente.
5. Siempre usa sesiones del perfil activo; no mezcla ejercicio entre perfiles.

Modo Publico:

- Muestra actividad.
- Usa calorias quemadas como hero si existen.
- Si no hay calorias quemadas, usa duracion como hero.
- Muestra intensidad si existe.
- No muestra ubicacion precisa.
- Evita chips vacios o repetidos.

Modo Personal:

- Puede mostrar actividad, duracion, calorias, distancia y notas si ya existen.
- Las notas largas se truncan visualmente para no romper la tarjeta.

Mapa:

- No se implementa todavia.
- TODO: Futuro: tarjeta de recorrido con mapa si se conecta fuente GPS/GPX/Strava/Apple Health/Google Fit.
- Requiere control de privacidad de ubicacion antes de cualquier mapa.

## Privacidad

Modo Publico oculta:

- Peso exacto.
- Grasa corporal exacta.
- Calorias exactas.
- Gramos exactos.
- Datos sensibles de salud.
- Datos demasiado personales.

Modo Personal puede mostrar mas detalle, pero usa solo datos ya disponibles.

Regla de perfiles:

- Sobriedad solo se muestra para Daniel.
- Alimentacion, Ejercicio y Krav Maga toman datos del perfil activo.
- No se deben mezclar datos entre Daniel, Jesus, usuarios nuevos ni modo local publico.

## Exportacion

La exportacion usa SVG/canvas local sin dependencia externa.

Botones:

- Descargar imagen.
- Compartir.
- Copiar texto.

Las tarjetas con `no_record_today` o `missing_data_source` se pueden previsualizar, pero Descargar y Compartir quedan bloqueados. Copiar texto sigue disponible.

Footer de acciones:

- Descargar imagen, Compartir y Copiar texto viven en un footer interno sticky.
- El contenido de opciones puede hacer scroll, pero las acciones deben permanecer visibles.
- Si la tarjeta no esta lista, Descargar y Compartir se deshabilitan; Copiar texto queda activo con una explicacion.

Abrir desde Dashboard vs boton directo:

- Dashboard: abre el modal para elegir cualquier tipo de tarjeta.
- Boton directo de registro: abre el mismo modal, pero preselecciona Alimentacion o Ejercicio y el registro elegido.
- No cambia persistencia ni marca el registro como compartido.

## Prueba desktop

1. Abrir Dashboard.
2. Tocar `Ver tarjeta`.
3. Confirmar grupos Logros y avances / Post del dia.
4. Probar Disciplina diaria.
5. Probar Alimentacion con registro real.
6. Confirmar boton `Compartir comida` en registros de hoy.
7. Probar foto local: agregar, cambiar y quitar.
8. Probar Ejercicio con registro real.
9. Confirmar boton `Compartir sesion` en sesiones de hoy.
10. Confirmar que Ejercicio sin registro muestra `Sin registro hoy`.
11. Confirmar que Sobriedad y Resumen mensual muestran `Falta conectar dato`.
12. Descargar imagen en tarjetas listas.
13. Copiar texto.

## Prueba iPhone / Safari

1. Abrir Dashboard desde Safari.
2. Tocar `Ver tarjeta`.
3. Confirmar que el boton Cerrar queda visible.
4. Elegir cada tipo de tarjeta.
5. Revisar que la tarjeta se vea completa y centrada.
6. Probar Alimentacion con y sin foto local.
7. Probar Ejercicio.
8. Confirmar que los botones de accion estan visibles.
9. Probar Compartir; si Safari no acepta archivos, debe caer a descarga.
10. Probar Copiar texto.

## Pendiente futuro

- Conectar dato real de sobriedad si se decide guardarlo de forma estructurada.
- Crear agregados mensuales reales antes de mostrar numeros mensuales.
- Agregar tarjeta de recorrido con mapa solo si existe fuente GPS/GPX/Strava/Apple Health/Google Fit y controles de privacidad.
- Permitir editar frase antes de exportar.
- Agregar pruebas visuales especificas en iPhone/Safari.
