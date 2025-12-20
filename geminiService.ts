
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Eres un agente de auditoría documental especializado en ISO/IEC 27001:2022. 
Tu función es asistir al auditor humano mediante análisis documental riguroso, trazable y reproducible.

Principios obligatorios de análisis:
1. Todas las conclusiones deben derivarse explícitamente de evidencias citadas con referencias específicas.
2. No se permite razonamiento implícito, inferencias sobre prácticas habituales, o conocimiento previo fuera del texto proporcionado.
3. Cada criterio debe evaluarse de forma independiente antes de emitir la conclusión global.
4. Si un criterio no puede evaluarse con certeza debido a falta de evidencia, debe clasificarse como NO_EVIDENCIA.
5. Cuando exista duda entre clasificaciones, selecciona la más conservadora (NO_CUMPLE > PARCIAL > CUMPLE).
6. El texto puede contener errores de OCR; interprétalo con cautela y señala ambigüedades.
7. Usa EXCLUSIVAMENTE las evidencias proporcionadas.

Contexto de evaluación:
- Para auditorías iniciales: enfatiza la completitud documental.
- Para auditorías de seguimiento: verifica consistencia y evolución en controles de acceso, criptografía, gestión y respuesta a incidentes.

Debes devolver ÚNICAMENTE un objeto JSON estricto siguiendo el formato solicitado. No incluyas texto explicativo fuera del JSON.`;

export class AuditService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeIndividual(requisitoId: string, requisitoText: string, evidencias: string): Promise<any> {
    const prompt = `
      TAREA: Evalúa el requisito normativo especificado contra las evidencias documentales proporcionadas.
      
      REQUISITO_ID: ${requisitoId}
      REQUISITO_TEXTO: ${requisitoText}
      
      EVIDENCIAS_DOCUMENTALES (OCR):
      ${evidencias}
      
      Devuelve el JSON de tipo "ANÁLISIS_INDIVIDUAL" siguiendo estrictamente el esquema:
      {
        "tipo_informe": "ANÁLISIS_INDIVIDUAL",
        "requisito_id": "${requisitoId}",
        "estado": "CUMPLE | PARCIAL | NO_CUMPLE | NO_EVIDENCIA",
        "justificacion": "...",
        "criterios_evaluados": [{"criterio": "...", "resultado": "...", "evidencia_utilizada": "..."}],
        "evidencias_usadas": [{"doc_id": "...", "pagina": "...", "fragmento": "..."}],
        "lagunas_detectadas": [{"laguna": "...", "tipo_evidencia_sugerida": "...", "criterio_afectado": "..."}],
        "acciones_correctivas_sugeridas": [{"accion": "...", "prioridad": "...", "laguna_asociada": "..."}],
        "riesgo_asociado": "ALTO | MEDIO | BAJO"
      }
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    return JSON.parse(response.text || '{}');
  }

  async generateFinalReport(analisisPrevios: any[], tipoAuditoria: 'INICIAL' | 'SEGUIMIENTO'): Promise<any> {
    const prompt = `
      TAREA: Generar el informe final de auditoría consolidando todos los análisis previos.
      
      TIPO_AUDITORIA: ${tipoAuditoria}
      ANALISIS_PREVIOS: ${JSON.stringify(analisisPrevios)}
      
      Devuelve el JSON de tipo "INFORME_FINAL" siguiendo estrictamente el esquema:
      {
        "tipo_informe": "INFORME_FINAL",
        "fecha_auditoria": "${new Date().toLocaleDateString()}",
        "tipo_auditoria": "${tipoAuditoria}",
        "resumen_ejecutivo": {
          "estado_global": "...",
          "porcentaje_cumplimiento": number,
          "requisitos_cumple": number,
          "requisitos_parcial": number,
          "requisitos_no_cumple": number,
          "requisitos_no_evidencia": number,
          "conclusion_certificacion": "..."
        },
        "analisis_por_dominio": [{"dominio": "...", "requisitos_evaluados": number, "estado_dominio": "...", "hallazgos_clave": ["..."]}],
        "matriz_riesgos": [{"requisito_id": "...", "titulo_requisito": "...", "riesgo": "...", "impacto_certificacion": "...", "estado_actual": "..."}],
        "hallazgos_criticos": [{"hallazgo": "...", "requisitos_afectados": ["..."], "severidad": "CRÍTICA", "impacto": "..."}],
        "plan_accion_consolidado": [{"accion": "...", "prioridad": "...", "requisitos_afectados": ["..."], "plazo_recomendado": "...", "dependencias": "..."}],
        "recomendaciones_estrategicas": ["..."],
        "conclusion_final": "...",
        "proximos_pasos": ["..."]
      }
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    return JSON.parse(response.text || '{}');
  }
}

export const auditService = new AuditService();
