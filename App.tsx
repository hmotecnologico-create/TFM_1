
import React, { useState, useRef } from 'react';
import { auditService } from './geminiService';
import { 
  ReportType, 
  IndividualAnalysis, 
  FinalReport, 
  ComplianceStatus, 
  RiskLevel 
} from './types';
import { 
  ShieldCheck, 
  FileSearch, 
  UploadCloud, 
  Settings, 
  LayoutDashboard, 
  ClipboardList, 
  AlertOctagon,
  ChevronRight,
  Loader2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Info
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = {
  CUMPLE: '#10b981',
  PARCIAL: '#f59e0b',
  NO_CUMPLE: '#ef4444',
  NO_EVIDENCIA: '#64748b'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'matrix' | 'evaluation'>('pipeline');
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [auditType, setAuditType] = useState<'INICIAL' | 'SEGUIMIENTO'>('INICIAL');
  
  // Pipeline Inputs
  const [reqId, setReqId] = useState('A.8.10');
  const [reqText, setReqText] = useState('Gestión de activos. La organización debe identificar los activos de información y definir los requisitos de protección.');
  const [extractedText, setExtractedText] = useState('');
  
  // Data Storage
  const [analyses, setAnalyses] = useState<IndividualAnalysis[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setOcrStatus('Iniciando OCR Local...');
    setOcrProgress(0);

    try {
      // @ts-ignore
      const worker = await Tesseract.createWorker('spa', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100));
            setOcrStatus(`OCR: ${Math.floor(m.progress * 100)}%`);
          }
        }
      });

      const imageUrl = URL.createObjectURL(file);
      const { data: { text } } = await worker.recognize(imageUrl);
      setExtractedText(prev => prev + "\n" + text);
      setOcrStatus('Procesado con éxito.');
      await worker.terminate();
    } catch (error) {
      console.error(error);
      alert("Error en procesamiento OCR.");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!extractedText || !reqId) return;
    setLoading(true);
    setOcrStatus('Agente analizando cumplimiento...');
    try {
      const result = await auditService.analyzeIndividual(reqId, reqText, extractedText);
      setAnalyses(prev => [result, ...prev]);
      setActiveTab('matrix');
    } catch (error) {
      console.error(error);
      alert("Error en el razonamiento del agente.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const result = await auditService.generateFinalReport(analyses, auditType);
      setFinalReport(result);
      setActiveTab('evaluation');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.CUMPLE: return <CheckCircle2 className="text-emerald-500 w-4 h-4" />;
      case ComplianceStatus.NO_CUMPLE: return <XCircle className="text-rose-500 w-4 h-4" />;
      case ComplianceStatus.PARCIAL: return <AlertTriangle className="text-amber-500 w-4 h-4" />;
      default: return <Info className="text-slate-400 w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sidebar Navigation */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 text-white mb-2">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
              <h1 className="text-sm font-black tracking-tighter uppercase leading-none">
                AuditGuard <br/><span className="text-[10px] text-indigo-400 font-mono">ISO 27001 Agent</span>
              </h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'pipeline', label: 'Estudio & Ingestión', icon: UploadCloud },
              { id: 'matrix', label: 'Matriz de Hallazgos', icon: ClipboardList },
              { id: 'evaluation', label: 'Evaluación TFM', icon: LayoutDashboard }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
             <div className="bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase">Tipo de Auditoría</p>
                <div className="flex gap-2">
                   <button onClick={() => setAuditType('INICIAL')} className={`flex-1 text-[9px] font-bold py-1 rounded ${auditType === 'INICIAL' ? 'bg-indigo-500 text-white' : 'bg-slate-700'}`}>INICIAL</button>
                   <button onClick={() => setAuditType('SEGUIMIENTO')} className={`flex-1 text-[9px] font-bold py-1 rounded ${auditType === 'SEGUIMIENTO' ? 'bg-indigo-500 text-white' : 'bg-slate-700'}`}>TRIMESTRAL</button>
                </div>
             </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          
          {/* TAB: PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">ESTUDIO DEL MARCO NORMATIVO</h2>
                  <p className="text-slate-500 font-medium">Modelado de requisitos y digitalización de corpus documental.</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Configuración del Requisito</h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">ID de Norma</label>
                    <input 
                      value={reqId}
                      onChange={(e) => setReqId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Ej: A.8.10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Texto de la Regla</label>
                    <textarea 
                      value={reqText}
                      onChange={(e) => setReqText(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Copie aquí el fragmento de la ISO 27001..."
                    />
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileSearch className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Corpus Documental (OCR)</h3>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                    >
                      <UploadCloud className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
                  </div>
                  <div className="flex-1 min-h-[160px] bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-emerald-400 overflow-y-auto leading-relaxed relative">
                     {loading && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse" />}
                     <pre className="whitespace-pre-wrap">{extractedText || "// Cargue documentos para digitalizar evidencia..."}</pre>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setExtractedText('')}
                      className="px-4 py-2 text-slate-400 hover:text-rose-500 transition-all text-xs font-bold"
                    >
                      Limpiar
                    </button>
                    <button 
                      onClick={runAnalysis}
                      disabled={loading || !extractedText}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      EJECUTAR AGENTE
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB: MATRIX */}
          {activeTab === 'matrix' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">MATRIZ DE HALLAZGOS</h2>
                  <p className="text-slate-500 font-medium text-sm">Registro trazable de la evaluación documental individual.</p>
                </div>
                <button 
                  onClick={generateReport}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs shadow-xl flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> CONSOLIDAR INFORME FINAL
                </button>
              </header>

              <div className="space-y-4">
                {analyses.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay análisis registrados</p>
                  </div>
                ) : (
                  analyses.map((a, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-md">
                       <div className={`md:w-3 ${
                         a.estado === ComplianceStatus.CUMPLE ? 'bg-emerald-500' :
                         a.estado === ComplianceStatus.PARCIAL ? 'bg-amber-500' :
                         'bg-rose-500'
                       }`} />
                       <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                <span className="text-sm font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{a.requisito_id}</span>
                                <h4 className="font-bold text-slate-800">Resultado de Auditoría</h4>
                             </div>
                             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                {getStatusIcon(a.estado)}
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{a.estado}</span>
                             </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic mb-6 pl-4 border-l-2 border-slate-100">
                            "{a.justificacion}"
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Evidencia Identificada</h5>
                                <div className="space-y-2">
                                   {a.evidencias_usadas.map((ev, ei) => (
                                     <div key={ei} className="text-[10px] font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="font-black text-indigo-600 mr-2">DOC: {ev.doc_id}</span>
                                        <span className="text-slate-400 italic">"{ev.fragmento}"</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                             <div>
                                <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Lagunas Detectadas</h5>
                                <div className="space-y-2">
                                   {a.lagunas_detectadas.map((lg, li) => (
                                     <div key={li} className="text-[10px] font-bold bg-rose-50 text-rose-700 p-2 rounded-lg border border-rose-100 flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                        <span>{lg.laguna} <br/><em className="font-medium opacity-70">Sug: {lg.tipo_evidencia_sugerida}</em></span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: EVALUATION (INFORME FINAL TFM) */}
          {activeTab === 'evaluation' && finalReport && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
               <section className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full -mr-40 -mt-40 pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                     <div className="space-y-6 max-w-2xl">
                        <div>
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg shadow-indigo-200">INFORME_FINAL_CONSOLIDADO</span>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-4 uppercase">Estado Global de Cumplimiento</h2>
                          <p className="text-slate-500 font-medium leading-relaxed">Síntesis estratégica de hallazgos, riesgos y hoja de ruta para la certificación ISO/IEC 27001:2022.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Resultado de Auditoría</p>
                              <p className={`text-xl font-black ${finalReport.resumen_ejecutivo.estado_global === 'CUMPLE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {finalReport.resumen_ejecutivo.estado_global}
                              </p>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Conformidad Médica</p>
                              <p className="text-xl font-black text-indigo-600">{finalReport.resumen_ejecutivo.porcentaje_cumplimiento}%</p>
                           </div>
                        </div>
                     </div>

                     <div className="w-full md:w-64 space-y-4">
                        <div className="h-64 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'C', value: finalReport.resumen_ejecutivo.requisitos_cumple, color: COLORS.CUMPLE },
                                    { name: 'P', value: finalReport.resumen_ejecutivo.requisitos_parcial, color: COLORS.PARCIAL },
                                    { name: 'NC', value: finalReport.resumen_ejecutivo.requisitos_no_cumple, color: COLORS.NO_CUMPLE },
                                    { name: 'SE', value: finalReport.resumen_ejecutivo.requisitos_no_evidencia, color: COLORS.NO_EVIDENCIA }
                                  ]}
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {(entry: any, index: number) => <Cell key={index} fill={entry.color} />}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> CUMPLE</div>
                           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> PARCIAL</div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl">
                     <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" /> Conclusión de Viabilidad
                     </h3>
                     <p className="text-lg font-medium leading-relaxed italic opacity-90">
                       "{finalReport.conclusion_final}"
                     </p>
                  </div>
               </section>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                     <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Matriz de Riesgos Críticos</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="text-[10px] font-black text-slate-400 border-b border-slate-100">
                                    <th className="pb-4">REQUISITO</th>
                                    <th className="pb-4">RIESGO</th>
                                    <th className="pb-4">ESTADO</th>
                                    <th className="pb-4">IMPACTO EN CERTIFICACIÓN</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {finalReport.matriz_riesgos.map((r, ri) => (
                                    <tr key={ri} className="text-xs">
                                       <td className="py-4 font-mono font-bold text-indigo-600">{r.requisito_id}</td>
                                       <td className="py-4">
                                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${
                                            r.riesgo === RiskLevel.ALTO ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                                          }`}>{r.riesgo}</span>
                                       </td>
                                       <td className="py-4 font-bold text-slate-700">{r.estado_actual}</td>
                                       <td className="py-4 text-slate-500">{r.impacto_certificacion}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </section>

                     <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Hallazgos Críticos</h3>
                        <div className="space-y-4">
                           {finalReport.hallazgos_criticos.map((h, hi) => (
                              <div key={hi} className="p-5 bg-rose-50 border border-rose-100 rounded-3xl">
                                 <div className="flex items-center gap-3 mb-2">
                                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                                    <h4 className="font-black text-rose-900 text-sm uppercase">{h.hallazgo}</h4>
                                 </div>
                                 <p className="text-xs text-rose-700 font-medium mb-3 opacity-80">{h.impacto}</p>
                                 <div className="flex gap-2">
                                    {h.requisitos_afectados.map((ra, rai) => (
                                      <span key={rai} className="bg-white text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-rose-200 text-rose-500">{ra}</span>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </section>
                  </div>

                  <div className="space-y-8">
                     <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Plan de Acción Consolidado</h3>
                        <div className="space-y-6">
                           {finalReport.plan_accion_consolidado.map((p, pi) => (
                              <div key={pi} className="relative pl-6 border-l border-slate-700 pb-4 last:pb-0">
                                 <div className={`absolute left-[-4px] top-0 w-2 h-2 rounded-full ${p.prioridad === RiskLevel.ALTO ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                 <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Prioridad: {p.prioridad} | Plazo: {p.plazo_recomendado}</p>
                                 <h4 className="text-xs font-bold mb-2 text-slate-100">{p.accion}</h4>
                                 <p className="text-[10px] text-slate-400 leading-relaxed italic">Dependencias: {p.dependencias}</p>
                              </div>
                           ))}
                        </div>
                     </section>

                     <section className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm">
                        <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">Recomendaciones Estratégicas</h3>
                        <ul className="space-y-4">
                           {finalReport.recomendaciones_estrategicas.map((re, rei) => (
                              <li key={rei} className="flex gap-3 text-xs font-medium text-indigo-900 leading-relaxed">
                                 <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                                 {re}
                              </li>
                           ))}
                        </ul>
                     </section>
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>

      {/* Global Status Bar */}
      <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-black text-slate-400 tracking-widest uppercase z-50">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
               {loading ? ocrStatus : 'Agente Listo para Inspección'}
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
               <History className="w-3 h-3" /> {analyses.length} ANÁLISIS EN MEMORIA
            </div>
         </div>
         <div className="flex items-center gap-4">
            <span>ISO/IEC 27001:2022 ENGINE</span>
            <div className="w-px h-4 bg-slate-200" />
            <span className="text-indigo-400">TFM v3.0 PIPELINE</span>
         </div>
      </footer>

      {/* OCR/Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center animate-fadeIn">
           <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Procesando Pipeline</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">El agente está digitalizando evidencias y cruzando requisitos contra la norma operacionalizada.</p>
              {ocrProgress > 0 && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="bg-indigo-600 h-full transition-all duration-300 shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ width: `${ocrProgress}%` }} />
                </div>
              )}
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
