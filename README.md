# Agente de auditoría ISO/IEC 27001 · prototipo con Gemini

Primer prototipo, de diciembre de 2025, de un **agente que evalúa el cumplimiento de requisitos de la ISO/IEC 27001:2022** a partir de fragmentos de documentos. Por cada requisito devuelve un análisis estructurado con estado, criterios, evidencias, lagunas y acciones correctivas.

> Autor: **Heyder Medrano Olier** · Estado: prototipo (diciembre de 2025). La versión que siguió, con OCR y modelo local, es [Agente-de-auditor-a-27001](https://github.com/hmotecnologico-create/Agente-de-auditor-a-27001).

## Qué hace

- El auditor escribe el control que va a evaluar (por ejemplo `A.8.10`) y pega el fragmento documental que sirve de evidencia.
- El modelo responde en JSON con un esquema fijo (`types.ts`):
  - **Estado:** `CUMPLE`, `PARCIAL`, `NO_CUMPLE` o `NO_EVIDENCIA`.
  - Criterios evaluados, cada uno con su resultado.
  - Evidencias usadas: documento, página y fragmento.
  - Lagunas detectadas y la evidencia que se sugiere aportar.
  - Acciones correctivas sugeridas.
- **Dos tipos de informe:** análisis individual por requisito e informe final consolidado.

## Stack

React 19 · TypeScript · Vite · Recharts · SDK `@google/genai` (Gemini).

## Ejecutar en local

Requisito: Node.js.

```bash
npm install
# crea .env.local con tu clave:  GEMINI_API_KEY=...
npm run dev
```

> Por seguridad, `.env.local` no se sube al repositorio. Nunca escribas la clave en el código.

## Estructura

```
App.tsx            Interfaz: entrada del requisito y la evidencia, resultados y gráficos
geminiService.ts   Llamadas al modelo con instrucción de sistema y salida JSON
types.ts           Esquema del análisis (estados, riesgos, evidencias, lagunas)
```

## Limitaciones

- Envía el texto a un servicio en la nube (Gemini). Por eso la versión siguiente pasó a un **modelo local**, para no sacar documentos sensibles del equipo.
- Es un prototipo: no tiene pruebas automatizadas ni persistencia.
