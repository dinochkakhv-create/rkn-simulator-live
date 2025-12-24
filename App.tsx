
import React, { useState, useEffect, useRef } from 'react';
import Roulette from './components/Roulette';
import StatsBoard from './components/StatsBoard';
import { Service, BanRecord, SimulationState } from './types';
import { generateBlockAndReplacement } from './services/geminiService';
import { 
  ShieldAlert, History, Terminal, XCircle, ArrowRight, Edit3, 
  ShieldX, CloudUpload, Check, ExternalLink, Globe, Cpu, ShieldCheck, User, Download, FileCode
} from 'lucide-react';

// Эта переменная управляет отображением кнопок деплоя. 
// В версии на GitHub она принудительно устанавливается в true.
const IS_PUBLISHED = true;

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    isSpinning: false,
    selectedService: null,
    history: [],
    isGeneratingReason: false,
    generatedReason: null,
    isGeneratingReplacement: false,
    generatedReplacement: null,
  });

  const [decision, setDecision] = useState<'approved' | 'refused' | null>(null);
  const [editedName, setEditedName] = useState('');
  
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStep, setDeployStep] = useState<'choice' | 'github' | 'download'>('choice');
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('rkn-simulator-live');
  const [deployLogs, setDeployLogs] = useState<{msg: string, status: 'info' | 'success' | 'error'}[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [deployLogs]);

  const addLog = (msg: string, status: 'info' | 'success' | 'error' = 'info') => {
    setDeployLogs(prev => [...prev, { msg, status }]);
  };

  const utf8ToBase64 = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const handleSpinStart = () => {
    if (state.isSpinning) return;
    setDecision(null);
    setEditedName('');
    setState(prev => ({
      ...prev,
      isSpinning: true,
      selectedService: null,
      generatedReason: null,
      generatedReplacement: null
    }));
  };

  const handleSpinEnd = async (service: Service) => {
    setState(prev => ({ ...prev, isSpinning: false, selectedService: service, isGeneratingReason: true }));
    const result = await generateBlockAndReplacement(service.name);
    setEditedName(result.replacement.name);
    setState(prev => ({
      ...prev,
      isGeneratingReason: false,
      generatedReason: result.reason,
      generatedReplacement: result.replacement,
    }));
  };

  const handleApproveReplacement = () => {
    if (!state.generatedReplacement || !state.selectedService) return;
    setDecision('approved');
    const newRecord: BanRecord = {
      id: Date.now().toString(),
      serviceName: state.selectedService.name,
      date: new Date().toLocaleString('ru-RU'),
      reason: state.generatedReason || '',
      caseNumber: `РКН-${Math.floor(Math.random() * 90000) + 10000}-ФЗ`,
      replacement: {
        ...state.generatedReplacement,
        name: editedName || state.generatedReplacement.name
      }
    };
    setState(prev => ({ ...prev, history: [newRecord, ...prev.history].slice(0, 10) }));
  };

  const handleRefuseReplacement = () => {
    if (!state.selectedService) return;
    setDecision('refused');
    const newRecord: BanRecord = {
      id: Date.now().toString(),
      serviceName: state.selectedService.name,
      date: new Date().toLocaleString('ru-RU'),
      reason: state.generatedReason || '',
      caseNumber: `РКН-${Math.floor(Math.random() * 90000) + 10000}-ФЗ`,
      replacement: undefined
    };
    setState(prev => ({ ...prev, history: [newRecord, ...prev.history].slice(0, 10) }));
  };

  const startRealDeploy = async () => {
    if (!githubToken) return addLog("ОШИБКА: Токен не введен", "error");
    setIsDeploying(true);
    setDeployLogs([]);
    addLog("Инициализация протокола связи с GitHub...");
    
    try {
      const headers = { 
        'Authorization': `token ${githubToken}`, 
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // 1. Проверка пользователя
      const userRes = await fetch('https://api.github.com/user', { headers });
      if (!userRes.ok) throw new Error("Неверный токен GitHub");
      const { login: username } = await userRes.json();
      addLog(`Оператор идентифицирован: ${username}`, "success");

      // 2. Создание репозитория
      addLog(`Подготовка узла "${repoName}"...`);
      let repoCheck = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
      if (repoCheck.status === 404) {
        addLog("Создание нового пространства в облаке...");
        const createRepo = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: repoName, auto_init: true, description: "🛡️ RKN Simulator Sovereign Node" })
        });
        if (!createRepo.ok) throw new Error("Не удалось создать репозиторий");
        addLog("Пространство создано успешно.", "success");
      }

      // 3. Загрузка файлов
      const filesToPush = [
        { path: 'index.html', url: './index.html' },
        { path: 'index.tsx', url: './index.tsx' },
        { path: 'App.tsx', url: './App.tsx' },
        { path: 'types.ts', url: './types.ts' },
        { path: 'constants.tsx', url: './constants.tsx' },
        { path: 'services/geminiService.ts', url: './services/geminiService.ts' },
        { path: 'components/Roulette.tsx', url: './components/Roulette.tsx' },
        { path: 'components/StatsBoard.tsx', url: './components/StatsBoard.tsx' }
      ];

      for (const file of filesToPush) {
        addLog(`Синхронизация: ${file.path}...`);
        const res = await fetch(file.url);
        let content = await res.text();

        // Модифицируем App.tsx для опубликованной версии
        if (file.path === 'App.tsx') {
          content = content.replace('const IS_PUBLISHED = false', 'const IS_PUBLISHED = true');
        }

        const fileCheck = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`, { headers });
        let sha = undefined;
        if (fileCheck.ok) {
          sha = (await fileCheck.json()).sha;
        }

        const upload = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `🚀 Sovereign Sync: ${file.path}`,
            content: utf8ToBase64(content),
            sha
          })
        });
        if (!upload.ok) throw new Error(`Ошибка загрузки ${file.path}`);
      }

      // 4. Включение GitHub Pages
      addLog("Активация вещания на мир...");
      await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ source: { branch: 'main', path: '/' } })
      });

      addLog("СИСТЕМА РАЗВЕРНУТА В ГЛОБАЛЬНОЙ СЕТИ!", "success");
      setDeployedUrl(`https://${username}.github.io/${repoName}/`);

    } catch (err: any) {
      addLog(`КРИТИЧЕСКИЙ СБОЙ: ${err.message}`, "error");
    } finally {
      setIsDeploying(false);
    }
  };

  const isHidden = IS_PUBLISHED || (typeof window !== 'undefined' && (window as any).IS_PUBLISHED_OVERRIDE);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto">
      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900 border-2 border-red-900 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="bg-red-900/20 p-6 border-b border-red-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <CloudUpload className="text-red-500" />
                   <h2 className="text-xl font-black uppercase tracking-widest text-white">Управление узлом</h2>
                </div>
                <button onClick={() => setShowDeployModal(false)} className="text-gray-500 hover:text-white transition-colors">
                   <XCircle size={24} />
                </button>
             </div>
             
             <div className="p-8 space-y-6">
                {deployedUrl ? (
                  <div className="text-center py-8 space-y-6 animate-in zoom-in-95">
                     <div className="w-20 h-20 bg-green-600/20 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                        <Check size={40} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Узел активен</h3>
                        <p className="text-gray-500 text-sm">Все компоненты синхронизированы с облаком GitHub.</p>
                     </div>
                     <div className="space-y-4">
                        <div className="bg-black p-4 rounded-xl border border-gray-800 font-mono text-xs break-all text-green-400">{deployedUrl}</div>
                        <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-green-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-green-500 transition-all flex items-center justify-center gap-2">
                           ОТКРЫТЬ САЙТ <ExternalLink size={16} />
                        </a>
                        <p className="text-[10px] text-yellow-500 uppercase">Примечание: Обновление GitHub Pages может занять до 2-х минут.</p>
                     </div>
                  </div>
                ) : deployStep === 'choice' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setDeployStep('github')} className="group bg-gray-950 border border-red-900/30 p-8 rounded-2xl hover:border-red-500 transition-all text-left space-y-4">
                       <Globe size={24} className="text-red-500" />
                       <h4 className="text-white font-black uppercase tracking-widest">GitHub Деплой</h4>
                       <p className="text-gray-500 text-[10px] uppercase">Публикация полноценной версии на GitHub Pages.</p>
                    </button>
                    <button onClick={() => setDeployStep('download')} className="group bg-gray-950 border border-red-900/30 p-8 rounded-2xl hover:border-red-500 transition-all text-left space-y-4">
                       <Download size={24} className="text-red-500" />
                       <h4 className="text-white font-black uppercase tracking-widest">Скачать Локально</h4>
                       <p className="text-gray-500 text-[10px] uppercase">Получить исходный код одним архивом (в разработке).</p>
                    </button>
                  </div>
                ) : deployStep === 'github' ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="GitHub Personal Access Token" className="w-full bg-black border border-red-900/50 rounded-xl py-4 px-4 text-white font-mono text-sm focus:border-red-500 outline-none" />
                      <input type="text" value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="Название репозитория" className="w-full bg-black border border-red-900/50 rounded-xl py-4 px-4 text-white font-mono text-sm focus:border-red-500 outline-none" />
                    </div>
                    <div ref={terminalRef} className="h-40 bg-black rounded-xl border border-gray-800 p-4 font-mono text-[11px] overflow-y-auto scrollbar-hide space-y-1">
                       {deployLogs.map((log, i) => (
                         <div key={i} className={log.status === 'success' ? 'text-green-500' : log.status === 'error' ? 'text-red-500' : 'text-blue-400'}>
                           [{log.status === 'success' ? '✓' : log.status === 'error' ? '!' : 'i'}] {log.msg}
                         </div>
                       ))}
                       {deployLogs.length === 0 && <span className="text-gray-700 italic">Ожидание команд...</span>}
                    </div>
                    <button onClick={startRealDeploy} disabled={isDeploying || !githubToken} className="w-full py-5 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg active:scale-95">
                      {isDeploying ? 'ВЫПОЛНЯЕТСЯ СИНХРОНИЗАЦИЯ...' : 'ЗАПУСТИТЬ ПРОЦЕСС'}
                    </button>
                    <button onClick={() => setDeployStep('choice')} className="w-full text-gray-600 text-[10px] uppercase font-bold hover:text-white">ОТМЕНА</button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 uppercase text-xs">Данный метод временно недоступен. Используйте GitHub.</div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8 md:mb-12 border-b-2 border-red-900 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-900/30 rounded-lg border border-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            <ShieldAlert className="text-red-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
              БАН-О-МАТИК 3000
            </h1>
            <p className="text-red-700 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Симулятор федеральной службы по надзору (v4.5)
            </p>
          </div>
        </div>
        {!isHidden ? (
          <button 
            onClick={() => setShowDeployModal(true)}
            className="px-4 py-2 border border-red-900 rounded-lg text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/20 transition-all flex items-center gap-2 group"
          >
            <Cpu size={14} className="group-hover:rotate-180 transition-transform duration-500" /> ВЫПУСТИТЬ САЙТ
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase border border-green-900/50 px-3 py-1 bg-green-950/20 rounded shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <ShieldCheck size={14} /> УЗЕЛ АВТОНОМЕН
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <StatsBoard blockedCount={state.history.length} />
          
          <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-6 md:p-14 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <Roulette isSpinning={state.isSpinning} onSpinEnd={handleSpinEnd} />
            <div className="mt-14 text-center">
              <button
                onClick={handleSpinStart}
                disabled={state.isSpinning}
                className={`
                  px-10 md:px-20 py-5 rounded-full font-black text-2xl tracking-[0.2em] uppercase transition-all
                  ${state.isSpinning 
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed scale-95 opacity-50' 
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_50px_rgba(220,38,38,0.5)] border-b-8 border-red-900 active:translate-y-2 active:border-b-2'
                  }
                `}
              >
                {state.isSpinning ? 'АНАЛИЗ...' : 'ВЫБРАТЬ ЖЕРТВУ'}
              </button>
            </div>
          </div>

          {(state.selectedService || state.isGeneratingReason) && (
            <div className="space-y-6">
              <div className={`bg-black/95 border-2 p-8 rounded-2xl transition-all duration-700 relative overflow-hidden shadow-xl ${decision === 'refused' ? 'border-gray-600 grayscale' : 'border-red-600'}`}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Terminal className={`${decision === 'refused' ? 'text-gray-500' : 'text-red-500'} w-6 h-6`} />
                    <h3 className={`font-bold uppercase tracking-widest text-lg ${decision === 'refused' ? 'text-gray-500' : 'text-red-500'}`}>
                      {decision === 'refused' ? 'ЛИКВИДАЦИЯ' : `ДЕКРЕТ №${state.history[0]?.caseNumber || '---'}`}
                    </h3>
                  </div>
                  <div className={`px-3 py-1 text-[12px] font-black text-white rounded skew-x-[-12deg] ${decision === 'refused' ? 'bg-gray-800' : 'bg-red-600'}`}>
                    {decision === 'refused' ? 'VOID' : 'SECRET'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-gray-900 rounded-2xl border border-gray-800 relative group">
                     <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 transition-all duration-1000 ${decision === 'approved' ? 'opacity-0 scale-50' : ''}`}
                       style={{ backgroundColor: state.selectedService?.color || '#333' }}>
                       <img src={`https://cdn.simpleicons.org/${state.selectedService?.icon}/white`} alt={state.selectedService?.name} className="w-full h-full p-4 object-contain" />
                     </div>
                     {decision === 'approved' && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-50">
                          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl shadow-lg border-4 border-white mb-4">🇷🇺</div>
                       </div>
                     )}
                     <span className="font-black text-center uppercase text-base text-white truncate w-full px-2">
                       {decision === 'approved' ? editedName : (state.selectedService?.name || '---')}
                     </span>
                  </div>
                  <div className="md:col-span-3 space-y-6">
                    <div className="bg-gray-950 p-6 rounded-xl font-mono text-sm leading-relaxed border border-gray-800 min-h-[120px] shadow-inner">
                      {state.isGeneratingReason ? (
                        <div className="animate-pulse flex flex-col gap-2">
                          <div className="h-4 bg-red-900/20 rounded w-3/4"></div>
                          <div className="h-4 bg-red-900/20 rounded w-full"></div>
                          <div className="h-4 bg-red-900/20 rounded w-1/2"></div>
                        </div>
                      ) : state.generatedReason}
                    </div>
                  </div>
                </div>
              </div>

              {!state.isGeneratingReason && state.generatedReplacement && !decision && (
                <div className="bg-blue-950/20 border-2 border-blue-600/50 p-8 rounded-2xl animate-in slide-in-from-top-4 shadow-lg">
                   <h3 className="font-black text-blue-400 uppercase tracking-widest text-lg mb-6 flex items-center gap-2">
                     <Edit3 size={20} /> ИМПОРТОЗАМЕЩЕНИЕ
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-5 space-y-2">
                         <label className="text-[10px] text-blue-500 font-bold uppercase">НОВОЕ НАЗВАНИЕ</label>
                         <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full bg-black border border-blue-800 rounded-xl px-4 py-3 text-white font-black uppercase outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="md:col-span-7 flex gap-4">
                         <button onClick={handleApproveReplacement} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-sm rounded-xl hover:bg-blue-500 transition-all shadow-lg active:scale-95">УТВЕРДИТЬ</button>
                         <button onClick={handleRefuseReplacement} className="flex-1 py-4 bg-gray-800 text-gray-400 font-black uppercase text-sm rounded-xl hover:bg-gray-700 transition-all active:scale-95">ПОЛНЫЙ БАН</button>
                      </div>
                   </div>
                   <p className="mt-4 text-[10px] text-blue-300 italic opacity-60">"{state.generatedReplacement.description}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col h-[600px] lg:h-auto bg-black/80 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="bg-gray-900/80 px-8 py-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-red-600" />
              <span className="text-sm font-black text-gray-200 uppercase tracking-widest">Архив решений</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 font-mono scrollbar-hide">
            {state.history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-center">
                 <ShieldX size={48} className="mb-2" />
                 РЕЕСТР ПУСТ
              </div>
            )}
            {state.history.map((record) => (
              <div key={record.id} className={`border-l-4 pl-4 py-2 transition-all ${record.replacement ? 'border-blue-600 bg-blue-900/5' : 'border-red-900 bg-red-900/5'}`}>
                <div className="text-[10px] text-gray-600 uppercase mb-1">[{record.caseNumber}]</div>
                <div className="text-white font-black uppercase text-sm leading-tight flex flex-wrap items-center gap-1">
                  <span className={record.replacement ? 'line-through opacity-50' : ''}>{record.serviceName}</span>
                  {record.replacement && (
                    <>
                      <ArrowRight size={12} className="text-blue-500" />
                      <span className="text-blue-400">{record.replacement.name}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-auto py-12 border-t border-gray-900 flex flex-col items-center gap-4">
        <div className="flex items-center gap-8 opacity-40">
           <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white">
             <User size={12} className="text-blue-500" /> Powered by МАРК
           </div>
           <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white">
             <Globe size={12} className="text-red-500" /> GLOBAL_NODE_V4.5
           </div>
        </div>
        <p className="font-black tracking-[0.5em] uppercase opacity-20 text-[9px] text-gray-500">СИСТЕМА КОНТРОЛЯ ЦИФРОВОГО ПЕРИМЕТРА</p>
      </footer>
    </div>
  );
};

export default App;
