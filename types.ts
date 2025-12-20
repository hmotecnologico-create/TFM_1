
export enum ReportType {
  INDIVIDUAL = 'ANÁLISIS_INDIVIDUAL',
  FINAL = 'INFORME_FINAL'
}

export enum ComplianceStatus {
  CUMPLE = 'CUMPLE',
  PARCIAL = 'PARCIAL',
  NO_CUMPLE = 'NO_CUMPLE',
  NO_EVIDENCIA = 'NO_EVIDENCIA'
}

export enum RiskLevel {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAJO = 'BAJO'
}

export interface IndividualAnalysis {
  tipo_informe: ReportType.INDIVIDUAL;
  requisito_id: string;
  estado: ComplianceStatus;
  justificacion: string;
  criterios_evaluados: Array<{
    criterio: string;
    resultado: ComplianceStatus;
    evidencia_utilizada: string;
  }>;
  evidencias_usadas: Array<{
    doc_id: string;
    pagina: string;
    fragmento: string;
  }>;
  lagunas_detectadas: Array<{
    laguna: string;
    tipo_evidencia_sugerida: string;
    criterio_afectado: string;
  }>;
  acciones_correctivas_sugeridas: Array<{
    accion: string;
    prioridad: RiskLevel;
    laguna_asociada: string;
  }>;
  riesgo_asociado: RiskLevel;
}

export interface FinalReport {
  tipo_informe: ReportType.FINAL;
  fecha_auditoria: string;
  tipo_auditoria: 'INICIAL' | 'SEGUIMIENTO';
  resumen_ejecutivo: {
    estado_global: ComplianceStatus;
    porcentaje_cumplimiento: number;
    requisitos_cumple: number;
    requisitos_parcial: number;
    requisitos_no_cumple: number;
    requisitos_no_evidencia: number;
    conclusion_certificacion: string;
  };
  analisis_por_dominio: Array<{
    dominio: string;
    requisitos_evaluados: number;
    estado_dominio: ComplianceStatus;
    hallazgos_clave: string[];
  }>;
  matriz_riesgos: Array<{
    requisito_id: string;
    titulo_requisito: string;
    riesgo: RiskLevel;
    impacto_certificacion: string;
    estado_actual: ComplianceStatus;
  }>;
  hallazgos_criticos: Array<{
    hallazgo: string;
    requisitos_afectados: string[];
    severidad: 'CRÍTICA';
    impacto: string;
  }>;
  plan_accion_consolidado: Array<{
    accion: string;
    prioridad: RiskLevel;
    requisitos_afectados: string[];
    plazo_recomendado: string;
    dependencias: string;
  }>;
  recomendaciones_estrategicas: string[];
  conclusion_final: string;
  proximos_pasos: string[];
}
