
import React, { useState, useEffect, useRef } from 'react';
import { DB } from '../db';
import { ClinicalCase, CaseStage } from '../types';
import { ArrowLeft, Plus, Search, Trash2, Edit2, Upload, X, FileText, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react';

interface CaseManagementProps {
  onBack: () => void;
}

const CaseManagement: React.FC<CaseManagementProps> = ({ onBack }) => {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<ClinicalCase | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Correctly handle asynchronous DB call to fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      const data = await DB.getCases();
      setCases(data);
    };
    fetchCases();
  }, []);

  // Fix: Make handleDelete asynchronous and await DB operations
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este caso definitivamente?')) {
      await DB.deleteCase(id);
      const updatedCases = await DB.getCases();
      setCases(updatedCases);
    }
  };

  // Fix: Make handleSave asynchronous and await DB operations
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCase: ClinicalCase = editingCase ? { ...editingCase } : {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      theme: '',
      difficulty: 'Médio',
      tags: [],
      stages: [],
      createdAt: Date.now()
    };

    newCase.title = formData.get('title') as string;
    newCase.theme = formData.get('theme') as string;
    newCase.difficulty = formData.get('difficulty') as any;
    
    if (!editingCase) {
        newCase.stages = [
        { id: 0, title: 'Etapa 1', content: formData.get('s1_c') as string, question: formData.get('s1_q') as string },
        { id: 1, title: 'Etapa 2', content: formData.get('s2_c') as string, question: formData.get('s2_q') as string },
        { id: 2, title: 'Etapa 3', content: formData.get('s3_c') as string, question: formData.get('s3_q') as string },
        { id: 3, title: 'Etapa 4', content: formData.get('s4_c') as string, question: formData.get('s4_q') as string },
        { id: 4, title: 'Etapa 5', content: formData.get('s5_c') as string, question: formData.get('s5_q') as string }
        ];
    }

    await DB.saveCase(newCase);
    const updatedCases = await DB.getCases();
    setCases(updatedCases);
    setIsModalOpen(false);
    setEditingCase(null);
  };

  const parseStructuredText = (text: string): ClinicalCase[] => {
    const blocks = text.split(/={3,}/).filter(b => b.trim().length > 0);
    
    return blocks.map(block => {
      const tags = ['TITULO:', 'TEMA:', 'DIFICULDADE:', 'E1C:', 'E1Q:', 'E2C:', 'E2Q:', 'E3C:', 'E3Q:', 'E4C:', 'E4Q:', 'E5C:', 'E5Q:'];
      const data: Record<string, string> = {};

      tags.forEach((tag, index) => {
        const nextTag = tags[index + 1];
        const escapedTag = tag.replace(':', '\\:');
        const pattern = nextTag 
          ? new RegExp(`${escapedTag}([\\s\\S]*?)(?=${nextTag.replace(':', '\\:')})`, 'i')
          : new RegExp(`${escapedTag}([\\s\\S]*)`, 'i');
        
        const match = block.match(pattern);
        data[tag] = match ? match[1].trim() : '';
      });

      return {
        id: Math.random().toString(36).substr(2, 9),
        title: data['TITULO:'] || 'Caso sem título',
        theme: data['TEMA:'] || 'Geral',
        difficulty: (data['DIFICULDADE:'] as any) || 'Médio',
        tags: [],
        createdAt: Date.now(),
        stages: [1, 2, 3, 4, 5].map(i => ({
          id: i - 1,
          title: `Etapa ${i}`,
          content: data[`E${i}C:`] || '',
          question: data[`E${i}Q:`] || ''
        }))
      };
    });
  };

  // Fix: Make handleFileUpload reader callback asynchronous to await saving operations
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        let importedCases: ClinicalCase[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          const rawArray = Array.isArray(parsed) ? parsed : [parsed];
          importedCases = rawArray.map(c => ({
            ...c,
            id: c.id || Math.random().toString(36).substr(2, 9),
            createdAt: c.createdAt || Date.now(),
            stages: c.stages || []
          }));
        } else {
          importedCases = parseStructuredText(content);
        }

        const validCases = importedCases.filter(c => 
          c.title && 
          c.stages.length === 5 && 
          c.stages.every(s => s.content && s.question)
        );

        if (validCases.length === 0) {
          throw new Error("Nenhum caso válido encontrado. Verifique o formato do arquivo.");
        }

        // Fix: Await all asynchronous save operations before updating state
        for (const c of validCases) {
          await DB.saveCase(c);
        }
        const updatedCases = await DB.getCases();
        setCases(updatedCases);
        setImportFeedback({ type: 'success', message: `${validCases.length} casos importados com sucesso!` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setImportFeedback({ type: 'error', message: err.message || "Falha ao processar arquivo." });
      }
    };
    reader.readAsText(file);
  };

  const downloadExampleFile = () => {
    const content = `TITULO: Exemplo de Caso
TEMA: Córnea
DIFICULDADE: Médio
E1C: Descrição da etapa 1...
E1Q: Pergunta da etapa 1...
E2C: Descrição da etapa 2...
E2Q: Pergunta da etapa 2...
E3C: Descrição da etapa 3...
E3Q: Pergunta da etapa 3...
E4C: Descrição da etapa 4...
E4Q: Pergunta da etapa 4...
E5C: Descrição da etapa 5...
E5Q: Pergunta da etapa 5...
===
TITULO: Próximo Caso aqui...`;
    
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "template_importacao.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.theme.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Banco de Casos</h2>
            <p className="text-slate-500 text-sm">Gerencie o conteúdo didático da plataforma</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-grow sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
          >
            <Upload size={18} />
            Importar em Massa
          </button>
          <button 
            onClick={() => { setEditingCase(null); setIsModalOpen(true); }}
            className="flex-grow sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Novo Caso
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex-grow flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título ou tema..." 
            className="bg-transparent outline-none w-full text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCases.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">Nenhum caso encontrado.</p>
          </div>
        ) : (
          filteredCases.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between transition-all hover:border-slate-300 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                  {c.title.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{c.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{c.theme}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      c.difficulty === 'Fácil' ? 'bg-green-50 text-green-600' : 
                      c.difficulty === 'Médio' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {c.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setEditingCase(c); setIsModalOpen(true); }}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => { setIsImportModalOpen(false); setImportFeedback(null); }} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Upload size={20} className="text-indigo-600" />
              Importação em Massa
            </h3>
            <p className="text-sm text-slate-500 mb-6">Importe múltiplos casos a partir de um arquivo estruturado.</p>

            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                />
                <FileText size={40} className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-2" />
                <p className="text-sm font-medium text-slate-600">Clique para selecionar seu arquivo .txt ou .json</p>
                <p className="text-xs text-slate-400 mt-1">Use === para separar múltiplos casos em arquivos .txt</p>
              </div>

              {importFeedback && (
                <div className={`p-4 rounded-lg flex items-start gap-3 animate-in zoom-in-95 duration-200 ${importFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {importFeedback.type === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                  <p className="text-sm font-medium leading-tight">{importFeedback.message}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button 
                  onClick={downloadExampleFile}
                  className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  <Download size={16} />
                  Baixar Template de Importação
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Regras:</p>
                </div>
                <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4">
                  <li>Use os prefixos <b>TITULO:, TEMA:, DIFICULDADE:</b></li>
                  <li>Use <b>E1C:</b> para Conteúdo e <b>E1Q:</b> para Pergunta (até E5)</li>
                  <li>Separe casos diferentes com <b>===</b></li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportFeedback(null); }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-6">{editingCase ? 'Editar Caso' : 'Cadastrar Novo Caso'}</h3>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Título do Caso</label>
                  <input name="title" defaultValue={editingCase?.title} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tema</label>
                  <input name="theme" defaultValue={editingCase?.theme} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Retina, Glaucoma" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Dificuldade</label>
                  <select name="difficulty" defaultValue={editingCase?.difficulty} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>

              {!editingCase && (
                <div className="space-y-6">
                  <h4 className="font-bold text-indigo-600 uppercase tracking-widest text-xs border-b pb-2">Configuração das Etapas (1 a 5)</h4>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <p className="font-bold text-sm text-slate-700">Etapa {i}</p>
                      <textarea 
                        name={`s${i}_c`} 
                        required 
                        placeholder="Conteúdo (informações apresentadas ao aluno)" 
                        className="w-full p-3 text-sm border rounded-lg min-h-[80px]"
                      />
                      <input 
                        name={`s${i}_q`} 
                        required 
                        placeholder="Pergunta norteadora para o aluno" 
                        className="w-full p-3 text-sm border rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-lg font-medium text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">Salvar Caso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
