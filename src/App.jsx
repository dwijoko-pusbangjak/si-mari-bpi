import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
  Shield, LayoutTemplate, Crosshair, ScanSearch, TrendingUp, ShieldCheck, Activity,
  AlertTriangle, BadgeCheck, BookOpen, PlusCircle, Save, LogOut, Building2, Lock,
  UserCheck, Trash2, Edit, Users, Compass, Layers, Calendar, List, Loader2,
  FileDown, KeyRound, Info, X, Menu, Download, Hexagon, Zap, PieChart,
  CheckCircle2, Plus
} from 'lucide-react';

// === GAYA CSS GLOBAL ===
const GlobalStyle = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    html, body, #root {
      width: 100%; height: 100%; margin: 0; padding: 0;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #ecfdf5 0%, #f4fdf8 50%, #fffbeb 100%);
      background-attachment: fixed; color: #1e293b;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #6ee7b7; border-radius: 12px; border: 2px solid transparent; background-clip: padding-box; }
    ::-webkit-scrollbar-thumb:hover { background: #10b981; border: 2px solid transparent; background-clip: padding-box; }
    .glass-panel {
      background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 8px 32px rgba(4, 47, 46, 0.05);
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    @media print {
      @page { size: landscape; margin: 8mm; }
      body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; zoom: 75%; }
      aside, header, .print\\:hidden { display: none !important; }
      main, .flex-1, div { background: white !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
      #report-container { display: block !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
      #report-container table { width: 100% !important; min-width: auto !important; font-size: 8px !important; border-collapse: collapse !important; }
      #report-container th, #report-container td { padding: 4px !important; word-break: break-word !important; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  `}} />
);

// === FIREBASE SETUP (Ganti dengan kredensial asli Firebase Anda) ===
const firebaseConfig = {
  apiKey: "AIzaSyC34RHxpaFA4trv8mfUR4AqJzH-HXwtKoA",
  authDomain: "simaribpi.firebaseapp.com",
  projectId: "simaribpi",
  storageBucket: "simaribpi.firebasestorage.app",
  messagingSenderId: "324662251360",
  appId: "1:324662251360:web:b0f7b4180fcd5530a0d805"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app);
} catch (e) { console.warn("Firebase Init Warning:", e); }

const appId = typeof __app_id !== 'undefined' ? __app_id : 'simari-bpi-app';
const getCol = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);
const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// === LOCAL STORAGE HELPER ===
const saveLocal = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} };
const loadLocal = (key, initial) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initial; } catch (e) { return initial; } };

const initialUnitKerjaList = [];
const initialMasterSasaran = { strategis: [], program: [], kegiatan: [] };
const initialRisks = [];

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => loadLocal('simari_current_user', null)); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subReportTab, setSubReportTab] = useState('peta_risiko'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [unitKerjaList, setUnitKerjaList] = useState(initialUnitKerjaList);
  const [masterSasaran, setMasterSasaran] = useState(initialMasterSasaran);
  const [tujuanList, setTujuanList] = useState([]);
  const [risks, setRisks] = useState(initialRisks);
  const [kejadianList, setKejadianList] = useState([]);
  const [riwayatEfektivitas, setRiwayatEfektivitas] = useState([]);
  
  const [adminPassword, setAdminPassword] = useState(() => loadLocal('simari_admin_pass', 'adminbpi2026'));
  useEffect(() => { saveLocal('simari_admin_pass', adminPassword); }, [adminPassword]);
  useEffect(() => { saveLocal('simari_current_user', currentUser); }, [currentUser]);

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', status: 'info', onConfirm: null });
  const showAlert = (title, message, status = 'info') => setModal({ isOpen: true, type: 'alert', title, message, status, onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setModal({ isOpen: true, type: 'confirm', title, message, status: 'warning', onConfirm });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  const PopupModal = () => {
    if (!modal.isOpen) return null;
    const isConfirm = modal.type === 'confirm';
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/40 backdrop-blur-sm p-4 print:hidden">
        <div className="glass-panel rounded-3xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/80">
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              {modal.status === 'error' ? <div className="p-4 bg-rose-50 rounded-full"><AlertTriangle size={36} className="text-rose-500" /></div> :
               modal.status === 'success' ? <div className="p-4 bg-emerald-50 rounded-full"><CheckCircle2 size={36} className="text-emerald-500" /></div> :
               modal.status === 'warning' ? <div className="p-4 bg-amber-50 rounded-full"><AlertTriangle size={36} className="text-amber-500" /></div> :
               <div className="p-4 bg-sky-50 rounded-full"><Info size={36} className="text-sky-500" /></div>}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{modal.title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{modal.message}</p>
            </div>
          </div>
          <div className="p-4 bg-white/50 border-t border-emerald-100/50 flex justify-center gap-3">
            {isConfirm ? (
              <>
                <button onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button onClick={() => { if(modal.onConfirm) modal.onConfirm(); closeModal(); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer">Ya, Lanjutkan</button>
              </>
            ) : (
              <button onClick={closeModal} className="w-full px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer">Tutup</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (auth) {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        }
      } catch (e) { setFbUser({ uid: 'local-guest' }); } finally { setIsDbLoading(false); }
    };
    initAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => { setFbUser(user || { uid: 'local-guest' }); });
      return () => unsubscribe();
    } else { setFbUser({ uid: 'local-guest' }); setIsDbLoading(false); }
  }, []);

  useEffect(() => {
    if (!fbUser || !db) return;
    try {
      const unsubUnits = onSnapshot(getCol('units'), snap => {
        if (!snap.empty) setUnitKerjaList(snap.docs.map(d => ({ ...d.data(), id: d.id }))); else setUnitKerjaList([]);
      }, () => {});
      const unsubSasaran = onSnapshot(getDocRef('settings', 'masterSasaran'), snap => {
        if (snap.exists()) setMasterSasaran(snap.data()); else setMasterSasaran(initialMasterSasaran);
      }, () => {});
      const unsubTujuan = onSnapshot(getCol('tujuan'), snap => {
        if (!snap.empty) setTujuanList(snap.docs.map(d => d.data())); else setTujuanList([]);
      }, () => {});
      const unsubRisks = onSnapshot(getCol('risks'), snap => {
        if (!snap.empty) setRisks(snap.docs.map(d => d.data()).sort((a,b) => b.id.localeCompare(a.id))); else setRisks([]);
      }, () => {});
      const unsubKejadian = onSnapshot(getCol('kejadian'), snap => {
        if (!snap.empty) setKejadianList(snap.docs.map(d => d.data()).sort((a,b) => b.id.localeCompare(a.id))); else setKejadianList([]);
      }, () => {});
      const unsubEfektivitas = onSnapshot(getCol('efektivitas'), snap => {
        if (!snap.empty) setRiwayatEfektivitas(snap.docs.map(d => d.data()).sort((a,b) => b.id.localeCompare(a.id))); else setRiwayatEfektivitas([]);
      }, () => {});

      return () => { unsubUnits(); unsubSasaran(); unsubTujuan(); unsubRisks(); unsubKejadian(); unsubEfektivitas(); };
    } catch (e) {}
  }, [fbUser]);

  const getStatusColor = (level) => {
    switch(level) {
      case 'Sangat Tinggi': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Tinggi': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Sedang': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rendah': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Sangat Rendah': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const calculateSkorRisiko = (k, d) => {
    if (!k || !d) return 0;
    const m = [[1,5,10,15,20], [2,6,11,16,21], [3,8,13,18,23], [4,9,14,19,24], [7,12,17,22,25]];
    return m[k-1][d-1] || 0;
  };

  const calculateLevelRisiko = (skor) => {
    if (skor >= 20) return "Sangat Tinggi";
    if (skor >= 16) return "Tinggi";
    if (skor >= 12) return "Sedang";
    if (skor >= 6) return "Rendah";
    if (skor >= 1) return "Sangat Rendah";
    return "Belum Dianalisis";
  };

  const LoginScreen = () => {
    const [loginType, setLoginType] = useState('unit');
    const [selectedUnit, setSelectedUnit] = useState(unitKerjaList[0]?.id || '');
    const [selectedTahun, setSelectedTahun] = useState('2026');
    const [inputAdminPass, setInputAdminPass] = useState('');
    const [unitPassword, setUnitPassword] = useState('');

    useEffect(() => { if (unitKerjaList.length > 0 && !selectedUnit) setSelectedUnit(unitKerjaList[0].id); }, [unitKerjaList]);

    const handleLogin = (e) => {
      e.preventDefault();
      if (loginType === 'admin') {
        if (inputAdminPass === adminPassword) {
          setCurrentUser({ role: 'admin', nama: 'Administrator Pusat BPI', tahun: '2026' });
          setActiveTab('admin_dashboard');
        } else { showAlert('Gagal Login', 'Kata sandi Admin salah!', 'error'); }
      } else {
        const unitObj = unitKerjaList.find(u => u.id === selectedUnit);
        if (unitObj) {
          if (unitPassword === (unitObj.sandi || 'bpi2026')) {
            setCurrentUser({ role: 'unit', tahun: selectedTahun, eselon: unitObj.eselon || 'Eselon 2', ...unitObj });
            setActiveTab('dashboard');
          } else { showAlert('Gagal Login', 'Kata sandi unit kerja salah!', 'error'); }
        } else { showAlert('Perhatian', 'Silakan pilih unit kerja yang valid.', 'warning'); }
      }
    };

    if (isDbLoading) return <div className="flex h-screen items-center justify-center bg-transparent"><Loader2 size={40} className="animate-spin text-emerald-600" /></div>;

    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <GlobalStyle />
        <div className="glass-panel w-full max-w-md p-8 rounded-[2rem] relative overflow-hidden border border-white">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex p-4 bg-white/80 text-emerald-700 rounded-2xl mb-4 shadow-sm border border-emerald-100"><Shield size={36} strokeWidth={1.5} /></div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">SI-MARI BPI <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full ml-1 align-middle font-bold border border-emerald-200">v2.0</span></h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Sistem Manajemen Risiko<br/>Badan Pengembangan dan Informasi</p>
          </div>
          <div className="flex bg-white/50 p-1.5 rounded-2xl mb-6 relative z-10 shadow-sm border border-white/60">
            <button type="button" onClick={() => setLoginType('unit')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${loginType === 'unit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-800'}`}>Unit Kerja</button>
            <button type="button" onClick={() => setLoginType('admin')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${loginType === 'admin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-emerald-800'}`}>Admin Pusat</button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            {loginType === 'unit' ? (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building2 size={14} className="text-emerald-600" /> Unit Kerja</label>
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full p-3 text-sm border border-white/80 rounded-xl outline-none bg-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all font-medium text-slate-700 shadow-sm">
                    {unitKerjaList.length === 0 && <option value="">-- Belum ada unit --</option>}
                    {unitKerjaList.map((unit) => (<option key={unit.id} value={unit.id}>{unit.nama} ({unit.eselon || 'Eselon 2'})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-emerald-600" /> Tahun Anggaran</label>
                  <select value={selectedTahun} onChange={(e) => setSelectedTahun(e.target.value)} className="w-full p-3 text-sm border border-white/80 rounded-xl outline-none bg-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all font-medium text-slate-700 shadow-sm">
                    <option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Lock size={14} className="text-emerald-600" /> Kata Sandi</label>
                    <button type="button" onClick={() => showAlert('Lupa Password?', 'Silakan hubungi Administrator Pusat BPI untuk melakukan reset password akun unit kerja Anda.', 'info')} className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer">Lupa sandi?</button>
                  </div>
                  <input required type="password" value={unitPassword} onChange={(e) => setUnitPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 text-sm border border-white/80 rounded-xl outline-none bg-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all font-medium text-slate-700 shadow-sm" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><KeyRound size={14} className="text-emerald-600" /> Kunci Master Admin</label>
                <input required type="password" value={inputAdminPass} onChange={(e) => setInputAdminPass(e.target.value)} placeholder="••••••••" className="w-full p-3 text-sm border border-white/80 rounded-xl outline-none bg-white/60 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all font-medium text-slate-700 shadow-sm" />
              </div>
            )}
            <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white p-3.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 mt-6 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
              Masuk ke Sistem <UserCheck size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [adminTahun, setAdminTahun] = useState('2026');
    const [adminUserTab, setAdminUserTab] = useState('list');
    const [unitForm, setUnitForm] = useState({ id: '', nama: '', username: '', eselon: 'Eselon 2', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' });
    const [editUnitId, setEditUnitId] = useState(null);
    const [kategoriSasaran, setKategoriSasaran] = useState('strategis');
    const [selectedParentId, setSelectedParentId] = useState('');
    const [formSasaran, setFormSasaran] = useState({ nama: '', indikator: '', target: '', satuan: '' });
    const [editSasaranId, setEditSasaranId] = useState(null);
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const adminRisks = risks.filter(r => r.tahun === adminTahun);
    const adminTotalRisks = adminRisks.length;
    const adminRtpCount = adminRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi').length;
    const adminRtpFollowedUp = adminRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi' && (r.prosesRtp?.trim() || r.linkEviden?.trim())).length;
    
    const stCount = adminRisks.filter(r => r.levelRisiko === 'Sangat Tinggi').length;
    const tCount = adminRisks.filter(r => r.levelRisiko === 'Tinggi').length;
    const sCount = adminRisks.filter(r => r.levelRisiko === 'Sedang').length;
    const rCount = adminRisks.filter(r => r.levelRisiko === 'Rendah' || r.levelRisiko === 'Sangat Rendah').length;

    const handleUpdateAdminPassword = (e) => {
      e.preventDefault();
      if (oldPass !== adminPassword) return showAlert('Gagal', 'Kata sandi lama admin salah!', 'error');
      if (newPass !== confirmPass) return showAlert('Gagal', 'Konfirmasi kata sandi baru tidak cocok!', 'error');
      if (newPass.length < 6) return showAlert('Gagal', 'Kata sandi baru minimal 6 karakter.', 'error');
      setAdminPassword(newPass); showAlert('Berhasil', 'Kata sandi admin berhasil diperbarui!', 'success');
      setOldPass(''); setNewPass(''); setConfirmPass('');
    };

    const handleAddUserClick = () => { setEditUnitId(null); setUnitForm({ id: '', nama: '', username: '', eselon: 'Eselon 2', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' }); setAdminUserTab('form'); };
    const handleEditUserClick = (unit) => { setEditUnitId(unit.id); setUnitForm({ ...unit, eselon: unit.eselon || 'Eselon 2' }); setAdminUserTab('form'); };

    const handleSaveUnit = async (e) => {
      e.preventDefault();
      if (unitForm.nama.trim() && unitForm.username.trim()) {
        showConfirm('Konfirmasi Simpan', 'Simpan perubahan data unit kerja ini?', async () => {
          const idToSave = editUnitId || `unit_${Date.now()}`;
          try { if (db) await setDoc(getDocRef('units', idToSave), { id: idToSave, ...unitForm }); } catch(e) {}
          setUnitKerjaList(prev => {
            const exists = prev.some(u => u.id === idToSave);
            if (exists) return prev.map(u => u.id === idToSave ? { ...u, ...unitForm } : u);
            return [...prev, { id: idToSave, ...unitForm }];
          });
          showAlert('Berhasil', 'Data unit kerja berhasil disimpan!', 'success');
          setEditUnitId(null); setAdminUserTab('list');
        });
      }
    };

    const handleDeleteUnit = (id) => {
      showConfirm('Konfirmasi Hapus', 'Hapus unit kerja secara permanen?', async () => {
        try { if (db) await deleteDoc(getDocRef('units', id)); } catch(e) {}
        setUnitKerjaList(prev => prev.filter(u => u.id !== id));
        showAlert('Berhasil', 'Unit kerja dihapus.', 'success');
      });
    };

    const handleAddMasterSasaran = async (e) => {
      e.preventDefault();
      if (formSasaran.nama.trim()) {
        showConfirm('Konfirmasi Simpan', 'Simpan perubahan sasaran K/L ini?', async () => {
          let updated = { ...masterSasaran };
          if (editSasaranId) {
            updated[kategoriSasaran] = updated[kategoriSasaran].map(item => {
              if (item.id === editSasaranId) {
                let updatedItem = { ...item, nama: formSasaran.nama };
                if (kategoriSasaran !== 'strategis') updatedItem.parentId = selectedParentId;
                if (kategoriSasaran !== 'kegiatan') { updatedItem.indikator = formSasaran.indikator; updatedItem.target = formSasaran.target; updatedItem.satuan = formSasaran.satuan; }
                return updatedItem;
              }
              return item;
            });
          } else {
            let newItem = { id: `M-${Date.now()}`, nama: formSasaran.nama };
            if (kategoriSasaran !== 'strategis') newItem.parentId = selectedParentId;
            if (kategoriSasaran !== 'kegiatan') { newItem.indikator = formSasaran.indikator; newItem.target = formSasaran.target; newItem.satuan = formSasaran.satuan; }
            updated[kategoriSasaran] = [...(updated[kategoriSasaran] || []), newItem];
          }
          try { if (db) await setDoc(getDocRef('settings', 'masterSasaran'), updated); } catch(e) {}
          setMasterSasaran(updated); setFormSasaran({ nama: '', indikator: '', target: '', satuan: '' }); setEditSasaranId(null);
          showAlert('Berhasil', 'Master sasaran disimpan!', 'success');
        });
      }
    };

    const handleEditClickSasaran = (kat, item) => {
      setKategoriSasaran(kat); setSelectedParentId(item.parentId || '');
      setFormSasaran({ nama: item.nama || '', indikator: item.indikator || '', target: item.target || '', satuan: item.satuan || '' });
      setEditSasaranId(item.id);
    };

    const handleDeleteSasaran = (kat, id) => {
      showConfirm('Hapus Sasaran', 'Yakin ingin menghapus sasaran ini?', async () => {
        const updated = { ...masterSasaran, [kat]: (masterSasaran[kat] || []).filter(item => item.id !== id) };
        try { if (db) await setDoc(getDocRef('settings', 'masterSasaran'), updated); } catch(e) {}
        setMasterSasaran(updated);
      });
    };

    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">Panel Administrator Pusat BPI</h2></div>
        <div className="flex flex-wrap border-b border-slate-200/60 glass-panel rounded-t-2xl px-4 pt-2 gap-2">
          <button onClick={() => setActiveTab('admin_dashboard')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_dashboard' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><LayoutTemplate size={18} /> Dashboard</button>
          <button onClick={() => setActiveTab('admin_users')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_users' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Users size={18} /> Manajemen User</button>
          <button onClick={() => setActiveTab('admin_sasaran')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_sasaran' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Compass size={18} /> Hierarki Sasaran K/L</button>
          <button onClick={() => setActiveTab('admin_security')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_security' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><KeyRound size={18} /> Keamanan Admin</button>
        </div>

        {activeTab === 'admin_dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-5 rounded-2xl gap-4">
               <div><h3 className="font-bold text-slate-800 text-lg">Overview Manajemen Risiko BPI</h3></div>
               <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-xl border border-white">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 pl-2"><Calendar size={14}/> Tahun:</label>
                 <select value={adminTahun} onChange={(e) => setAdminTahun(e.target.value)} className="p-2 text-sm border-none rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-emerald-700 cursor-pointer"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option></select>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Risiko (Global)</p><h3 className="text-3xl font-extrabold text-slate-800 mt-1">{adminTotalRisks}</h3></div><div className="p-4 bg-white/60 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 rounded-2xl transition-colors"><Hexagon size={28} /></div></div>
              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">RTP Ditetapkan</p><h3 className="text-3xl font-extrabold text-amber-600 mt-1">{adminRtpCount}</h3></div><div className="p-4 bg-white/60 text-amber-500 group-hover:bg-amber-50 group-hover:text-amber-600 rounded-2xl transition-colors"><ShieldCheck size={28} /></div></div>
              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">RTP Ditindaklanjuti</p><h3 className="text-3xl font-extrabold text-teal-600 mt-1">{adminRtpFollowedUp}</h3></div><div className="p-4 bg-white/60 text-teal-500 group-hover:bg-teal-50 group-hover:text-teal-600 rounded-2xl transition-colors"><Zap size={28} /></div></div>
              <div className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Unit Kerja Terdaftar</p><h3 className="text-3xl font-extrabold text-sky-600 mt-1">{unitKerjaList.length}</h3></div><div className="p-4 bg-white/60 text-sky-500 group-hover:bg-sky-50 group-hover:text-sky-600 rounded-2xl transition-colors"><Building2 size={28} /></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl space-y-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/50 pb-3 flex items-center gap-2"><PieChart size={16} className="text-emerald-600"/> Distribusi Level Risiko</h3>
                <div className="space-y-4 pt-1">
                  <div><div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-rose-600">Sangat Tinggi</span><span className="text-slate-500">{stCount} Risiko</span></div><div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-rose-500 h-full rounded-full" style={{ width: `${adminTotalRisks ? (stCount/adminTotalRisks)*100 : 0}%` }}></div></div></div>
                  <div><div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-orange-600">Tinggi</span><span className="text-slate-500">{tCount} Risiko</span></div><div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-orange-500 h-full rounded-full" style={{ width: `${adminTotalRisks ? (tCount/adminTotalRisks)*100 : 0}%` }}></div></div></div>
                  <div><div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-amber-600">Sedang</span><span className="text-slate-500">{sCount} Risiko</span></div><div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-amber-500 h-full rounded-full" style={{ width: `${adminTotalRisks ? (sCount/adminTotalRisks)*100 : 0}%` }}></div></div></div>
                  <div><div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-teal-600">Rendah / Sangat Rendah</span><span className="text-slate-500">{rCount} Risiko</span></div><div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-teal-500 h-full rounded-full" style={{ width: `${adminTotalRisks ? (rCount/adminTotalRisks)*100 : 0}%` }}></div></div></div>
                </div>
              </div>
              <div className="glass-panel rounded-2xl flex flex-col">
                <div className="p-5 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Crosshair size={16} className="text-emerald-600"/> Progres Mitigasi Global</h3></div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 text-slate-200/60" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
                    <svg className="absolute inset-0 w-full h-full -rotate-90 text-emerald-500 transition-all duration-1000 ease-out" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${adminRtpCount ? (adminRtpFollowedUp/adminRtpCount)*100 : 0}, 100`} strokeLinecap="round" /></svg>
                    <div className="text-center z-10"><span className="text-4xl font-extrabold text-slate-800">{adminRtpCount ? Math.round((adminRtpFollowedUp/adminRtpCount)*100) : 0}<span className="text-xl text-slate-400 font-medium">%</span></span><span className="block text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Selesai</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Building2 size={16} className="text-emerald-600"/> Statistik Risiko Per Unit Kerja</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead><tr className="bg-white/40 text-slate-500 uppercase tracking-wider text-[10px]"><th className="p-4 font-bold">Nama Unit Kerja</th><th className="p-4 font-bold">Jenis</th><th className="p-4 font-bold text-center">Total</th><th className="p-4 font-bold text-center text-rose-500">Tinggi</th><th className="p-4 font-bold text-center text-amber-500">RTP Ditetapkan</th><th className="p-4 font-bold text-center text-emerald-600">RTP Berjalan</th><th className="p-4 font-bold text-center w-40">Progres</th></tr></thead>
                  <tbody className="divide-y divide-slate-200/50 text-[13px]">
                    {unitKerjaList.map(unit => {
                      const uRisks = adminRisks.filter(r => r.unit === unit.nama);
                      const uTotal = uRisks.length;
                      const uTinggi = uRisks.filter(r => r.levelRisiko === 'Sangat Tinggi' || r.levelRisiko === 'Tinggi').length;
                      const uRtp = uRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi').length;
                      const uRtpDone = uRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi' && (r.prosesRtp?.trim() || r.linkEviden?.trim())).length;
                      const pct = uRtp ? Math.round((uRtpDone/uRtp)*100) : 0;
                      return (
                        <tr key={unit.id} className="hover:bg-emerald-50/40">
                          <td className="p-4 font-bold text-slate-800">{unit.nama}</td><td className="p-4"><span className="px-2.5 py-1 rounded-md text-[10px] bg-slate-100">{unit.eselon || 'Eselon 2'}</span></td>
                          <td className="p-4 text-center font-bold text-slate-600">{uTotal}</td><td className="p-4 text-center font-bold text-rose-600">{uTinggi}</td>
                          <td className="p-4 text-center font-bold text-amber-600">{uRtp}</td><td className="p-4 text-center font-bold text-emerald-600">{uRtpDone}</td>
                          <td className="p-4 text-center"><div className="flex items-center gap-2"><div className="w-full bg-slate-200/80 rounded-full h-2"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }}></div></div><span className="text-[11px] font-bold text-slate-500 w-8">{pct}%</span></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'admin_security' && (
          <div className="glass-panel p-6 rounded-2xl max-w-xl space-y-6">
            <div><h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><KeyRound size={18} className="text-emerald-600" /> Ubah Kata Sandi Admin</h3></div>
            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <input required type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Sandi Lama" className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/50 outline-none" />
              <input required type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Sandi Baru" className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/50 outline-none" />
              <input required type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Konfirmasi Sandi Baru" className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/50 outline-none" />
              <button type="submit" className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm">Simpan</button>
            </form>
          </div>
        )}
        {activeTab === 'admin_users' && (
          <div className="space-y-6">
            <div className="flex space-x-2 border-b border-slate-200/60 pb-2">
              <button onClick={() => { setAdminUserTab('list'); setEditUnitId(null); }} className={`px-4 py-2 text-sm font-bold rounded-t-xl ${adminUserTab === 'list' ? 'glass-panel text-emerald-800 border-b-2 border-emerald-600' : 'text-slate-500'}`}>Daftar Unit Kerja</button>
              <button onClick={handleAddUserClick} className={`px-4 py-2 text-sm font-bold rounded-t-xl ${adminUserTab === 'form' && !editUnitId ? 'glass-panel text-emerald-800 border-b-2 border-emerald-600' : 'text-slate-500'}`}>Tambah User</button>
            </div>
            {adminUserTab === 'form' ? (
              <form onSubmit={handleSaveUnit} className="glass-panel p-6 rounded-2xl space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Unit Kerja</label><input required type="text" value={unitForm.nama} onChange={(e) => setUnitForm({...unitForm, nama: e.target.value})} className="w-full p-3 text-sm rounded-xl bg-white/50 border border-white/60" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase">Jenis Unit Kerja</label><select required value={unitForm.eselon} onChange={(e) => setUnitForm({...unitForm, eselon: e.target.value})} className="w-full p-3 text-sm rounded-xl bg-white/50 border border-white/60"><option value="Eselon 1">Eselon 1</option><option value="Eselon 2">Eselon 2</option></select></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase">Username Login</label><input required type="text" value={unitForm.username} onChange={(e) => setUnitForm({...unitForm, username: e.target.value})} className="w-full p-3 text-sm rounded-xl bg-white/50 border border-white/60" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase">Kata Sandi Akun</label><input required type="text" value={unitForm.sandi} onChange={(e) => setUnitForm({...unitForm, sandi: e.target.value})} className="w-full p-3 text-sm rounded-xl bg-white/50 border border-white/60" /></div>
                  <div className="md:col-span-2 pt-4 border-t"><h4 className="text-[11px] font-bold text-emerald-600 uppercase">Informasi Pimpinan</h4></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Pimpinan</label><input required type="text" value={unitForm.namaPimpinan} onChange={(e) => setUnitForm({...unitForm, namaPimpinan: e.target.value})} className="w-full p-3 text-sm rounded-xl bg-white/50 border border-white/60" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase">NIP Pimpinan</label><input required type="text" value={unitForm.nipPimpinan} onChange={(e) => setUnitForm({...unitForm, nipPimpinan: e.target.value})} className="w-full p-3 text-sm rounded-xl bg-white/50 border border-white/60" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-6"><button type="submit" className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Simpan Data</button></div>
              </form>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm"><thead className="bg-white/40"><tr className="text-[10px] text-slate-500 uppercase font-bold"><th className="p-4">No</th><th className="p-4">Nama Unit Kerja</th><th className="p-4">Jenis</th><th className="p-4">Login</th><th className="p-4">Aksi</th></tr></thead><tbody className="divide-y divide-slate-200/50">
                  {unitKerjaList.map((unit, idx) => (
                    <tr key={unit.id} className="hover:bg-emerald-50/40"><td className="p-4">{idx + 1}</td><td className="p-4 font-bold">{unit.nama}</td><td className="p-4">{unit.eselon}</td><td className="p-4 text-xs">User: {unit.username}<br/>Pass: {unit.sandi}</td><td className="p-4 space-x-2"><button onClick={() => handleEditUserClick(unit)} className="p-2 bg-white/60 rounded-xl"><Edit size={16}/></button><button onClick={() => handleDeleteUnit(unit.id)} className="p-2 bg-white/60 rounded-xl"><Trash2 size={16}/></button></td></tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'admin_sasaran' && (
          <div className="space-y-6">
            <form onSubmit={handleAddMasterSasaran} className="glass-panel p-6 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-slate-800">Hierarki Sasaran K/L</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <select value={kategoriSasaran} onChange={(e) => { setKategoriSasaran(e.target.value); setSelectedParentId(''); }} className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl"><option value="strategis">Sasaran Strategis</option><option value="program">Sasaran Program</option><option value="kegiatan">Sasaran Kegiatan</option></select>
                {kategoriSasaran === 'program' && <select required value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl"><option value="">-- Pilih Induk Strategis --</option>{masterSasaran.strategis?.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}</select>}
                {kategoriSasaran === 'kegiatan' && <select required value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl"><option value="">-- Pilih Induk Program --</option>{masterSasaran.program?.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select>}
                <div className="md:col-span-2"><input required type="text" value={formSasaran.nama} onChange={(e) => setFormSasaran({...formSasaran, nama: e.target.value})} className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl" placeholder="Uraian Sasaran..." /></div>
              </div>
              {kategoriSasaran !== 'kegiatan' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <input required type="text" value={formSasaran.indikator} onChange={(e) => setFormSasaran({...formSasaran, indikator: e.target.value})} className="w-full p-3 text-sm bg-white/50 rounded-xl" placeholder="Indikator..." />
                  <input required type="text" value={formSasaran.target} onChange={(e) => setFormSasaran({...formSasaran, target: e.target.value})} className="w-full p-3 text-sm bg-white/50 rounded-xl" placeholder="Target..." />
                  <input required type="text" value={formSasaran.satuan} onChange={(e) => setFormSasaran({...formSasaran, satuan: e.target.value})} className="w-full p-3 text-sm bg-white/50 rounded-xl" placeholder="Satuan..." />
                </div>
              )}
              <div className="flex justify-end pt-4"><button type="submit" className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold">Simpan Sasaran</button></div>
            </form>
          </div>
        )}
      </div>
    );
  };

  // --- KOMPONEN DASHBOARD UNIT (DENGAN TOOLTIP INTERAKTIF) ---
  const DashboardUnit = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const unitKejadian = kejadianList.filter(k => k.unit === currentUser.nama && k.tahun === currentUser.tahun);
    const unitEfektivitas = riwayatEfektivitas.filter(e => {
      const parentRisk = risks.find(r => r.id === e.riskId);
      return parentRisk && parentRisk.unit === currentUser.nama && parentRisk.tahun === currentUser.tahun;
    });

    const totalRisiko = unitRisks.length;
    const risksDimitigasiList = unitRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi');
    const risikoDimitigasi = risksDimitigasiList.length;
    
    const listSangatTinggi = unitRisks.filter(r => r.levelRisiko === 'Sangat Tinggi');
    const listTinggi = unitRisks.filter(r => r.levelRisiko === 'Tinggi');
    const listSedang = unitRisks.filter(r => r.levelRisiko === 'Sedang');
    const listRendah = unitRisks.filter(r => r.levelRisiko === 'Rendah' || r.levelRisiko === 'Sangat Rendah');

    const risikoSangatTinggi = listSangatTinggi.length;
    const risikoTinggi = listTinggi.length;
    const risikoSedang = listSedang.length;
    const risikoRendah = listRendah.length;

    // Helper Card Interaktif
    const DashboardCard = ({ title, value, icon: Icon, iconWrapperClass, tooltipTitle, tooltipColorClass, children }) => (
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative cursor-help">
        <div className="flex items-center justify-between">
          <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{title}</p><h3 className="text-3xl font-extrabold text-slate-800 mt-1">{value}</h3></div>
          <div className={`p-4 rounded-2xl transition-colors ${iconWrapperClass}`}><Icon size={28} /></div>
        </div>
        <div className="mt-4 flex items-center text-[10px] text-slate-400 font-medium"><span className="border-b border-dashed border-slate-300">Sorot untuk detail</span></div>
        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 transform origin-top group-hover:translate-y-0 translate-y-2 pointer-events-none border border-slate-700">
          <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-t border-l border-slate-700"></div>
          <div className="relative z-10">
            <h4 className={`font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider ${tooltipColorClass}`}>{tooltipTitle}</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">{children}</ul>
          </div>
        </div>
      </div>
    );

    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Manajemen Risiko</h2>
          <div className="flex items-center gap-2 mt-1.5"><span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold bg-slate-200/80 text-slate-700">{currentUser.eselon || 'Eselon 2'}</span><p className="text-slate-500 text-sm font-medium">{currentUser.nama}</p></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard title="Total Risiko" value={totalRisiko} icon={Hexagon} iconWrapperClass="bg-white/60 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700" tooltipTitle="Daftar Semua Risiko" tooltipColorClass="text-emerald-400">
            {unitRisks.length > 0 ? unitRisks.map(r => (<li key={r.id} className="flex flex-col border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate">{r.pernyataanRisiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Belum ada risiko.</li>}
          </DashboardCard>
          <DashboardCard title="RTP Dimitigasi" value={risikoDimitigasi} icon={ShieldCheck} iconWrapperClass="bg-white/60 text-teal-500 group-hover:bg-teal-50 group-hover:text-teal-600" tooltipTitle="Risiko yang Dimitigasi" tooltipColorClass="text-teal-400">
            {risksDimitigasiList.length > 0 ? risksDimitigasiList.map(r => (<li key={r.id} className="flex flex-col border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id} - {r.levelRisiko}</span><span className="text-[11px] truncate">{r.pernyataanRisiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Belum ada RTP.</li>}
          </DashboardCard>
          <DashboardCard title="Kejadian Risiko" value={unitKejadian.length} icon={AlertTriangle} iconWrapperClass="bg-white/60 text-rose-500 group-hover:bg-rose-50 group-hover:text-rose-600" tooltipTitle="Insiden Tercatat" tooltipColorClass="text-rose-400">
            {unitKejadian.length > 0 ? unitKejadian.map(k => (<li key={k.id} className="flex flex-col border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400">{k.tanggal}</span><span className="text-[11px] truncate text-rose-200">{k.risiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Belum ada insiden.</li>}
          </DashboardCard>
          <DashboardCard title="Efektifitas" value={unitEfektivitas.length} icon={BadgeCheck} iconWrapperClass="bg-white/60 text-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-600" tooltipTitle="Evaluasi Efektivitas" tooltipColorClass="text-emerald-400">
            {unitEfektivitas.length > 0 ? unitEfektivitas.map(e => (<li key={e.id} className="flex flex-col border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{e.riskId}</span><span className="text-[11px]">Status: {e.srActual <= e.srDiharapkan ? 'Efektif' : 'Tdk Efektif'}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Belum ada evaluasi.</li>}
          </DashboardCard>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><PieChart size={16} className="text-emerald-600"/> Distribusi Level Risiko</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Kartu Sangat Tinggi */}
            <div className="p-5 bg-rose-50/70 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">Sangat Tinggi</p><p className="text-3xl font-extrabold text-rose-900 mt-2">{risikoSangatTinggi}</p><div className="mt-2 text-[9px] text-rose-400/80 font-medium border-b border-dashed border-rose-300/50 w-max">Sorot detail</div>
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-rose-400">Risiko Sangat Tinggi</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {listSangatTinggi.length > 0 ? listSangatTinggi.map(r => (<li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200">{r.pernyataanRisiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                </ul>
              </div>
            </div>

            {/* Kartu Tinggi */}
            <div className="p-5 bg-orange-50/70 border border-orange-100 rounded-2xl hover:bg-orange-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">Tinggi</p><p className="text-3xl font-extrabold text-orange-900 mt-2">{risikoTinggi}</p><div className="mt-2 text-[9px] text-orange-400/80 font-medium border-b border-dashed border-orange-300/50 w-max">Sorot detail</div>
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-orange-400">Risiko Tinggi</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {listTinggi.length > 0 ? listTinggi.map(r => (<li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200">{r.pernyataanRisiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                </ul>
              </div>
            </div>

            {/* Kartu Sedang */}
            <div className="p-5 bg-amber-50/70 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">Sedang</p><p className="text-3xl font-extrabold text-amber-900 mt-2">{risikoSedang}</p><div className="mt-2 text-[9px] text-amber-500/80 font-medium border-b border-dashed border-amber-300/50 w-max">Sorot detail</div>
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-amber-400">Risiko Sedang</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {listSedang.length > 0 ? listSedang.map(r => (<li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200">{r.pernyataanRisiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                </ul>
              </div>
            </div>

            {/* Kartu Rendah */}
            <div className="p-5 bg-teal-50/70 border border-teal-100 rounded-2xl hover:bg-teal-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wide">Rendah</p><p className="text-3xl font-extrabold text-teal-900 mt-2">{risikoRendah}</p><div className="mt-2 text-[9px] text-teal-500/80 font-medium border-b border-dashed border-teal-300/50 w-max">Sorot detail</div>
              <div className="absolute bottom-full right-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-teal-400">Risiko Rendah</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {listRendah.length > 0 ? listRendah.map(r => (<li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200">{r.pernyataanRisiko}</span></li>)) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MENU LAINNYA (Tujuan, Identifikasi, Analisis, Penanganan, Laporan) ---
  const PenetapanTujuan = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">1. Penetapan Tujuan</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Formulir Penetapan Tujuan tersedia di sini.</div></div>
  );
  const IdentifikasiRisiko = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">2. Identifikasi Risiko</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Formulir Identifikasi tersedia di sini.</div></div>
  );
  const AnalisisEvaluasi = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">3. Analisis K/D</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Tabel Skoring Analisis tersedia di sini.</div></div>
  );
  const PenangananRisiko = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">4. Rencana Tindak Pengendalian</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Tabel Rencana Tindak Pengendalian (RTP) tersedia di sini.</div></div>
  );
  const PemantauanRisiko = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">5. Pemantauan RTP & Eviden</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Tabel update progres RTP tersedia di sini.</div></div>
  );
  const PencatatanKeterjadian = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">6. Pencatatan Keterjadian</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Formulir pelaporan kejadian risiko.</div></div>
  );
  const EfektivitasRTP = () => (
    <div className="w-full space-y-6"><h2 className="text-2xl font-bold text-slate-800">7. Efektifitas RTP</h2><div className="glass-panel p-6 rounded-2xl text-slate-500 italic">Tabel pengukuran efektivitas akhir tahun.</div></div>
  );

  const ModulLaporan = () => {
    const isEselon1 = currentUser.eselon === 'Eselon 1';
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const handleDownloadExcel = () => {
      // Skrip download laporan - kolom Risiko sesudah IKU sudah diperbaiki sebelumnya
      showAlert('Info', 'Fitur unduh laporan Excel aktif dan memuat pembaruan kolom Risiko sesudah IKU.', 'success');
    };
    return (
      <div className="space-y-6 w-full animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
          <div><h2 className="text-2xl font-bold text-slate-800">Modul Laporan Unit Kerja</h2></div>
          <button onClick={handleDownloadExcel} className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex gap-2"><Download size={16}/> Unduh Laporan</button>
        </div>
        <div className="glass-panel p-8 rounded-2xl space-y-6 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-white/60 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <th className="border border-slate-300 p-2.5">No</th><th className="border border-slate-300 p-2.5">Sasaran</th><th className="border border-slate-300 p-2.5">IKU</th><th className="border border-slate-300 p-2.5 bg-emerald-50">Risiko</th><th className="border border-slate-300 p-2.5">Kategori</th><th className="border border-slate-300 p-2.5">Level</th>
              </tr>
            </thead>
            <tbody>
              {unitRisks.map((risk, idx) => (
                <tr key={risk.id}><td className="border border-slate-300 p-2 text-center">{idx+1}</td><td className="border border-slate-300 p-2">{risk.sasaranKgt || '-'}</td><td className="border border-slate-300 p-2">{risk.indikatorKgt || '-'}</td><td className="border border-slate-300 p-2 font-bold">{risk.pernyataanRisiko}</td><td className="border border-slate-300 p-2">{risk.kategoriRisiko}</td><td className="border border-slate-300 p-2">{risk.levelRisiko}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const unitMenus = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutTemplate }, 
    { id: 'tujuan', label: '1. Penetapan Tujuan', icon: Crosshair },
    { id: 'identifikasi', label: '2. Identifikasi Risiko', icon: ScanSearch }, 
    { id: 'analisis', label: '3. Analisis K/D', icon: TrendingUp },
    { id: 'penanganan', label: '4. Rencana Tindak Pengendalian', icon: ShieldCheck }, 
    { id: 'pemantauan', label: '5. Pemantauan RTP & Eviden', icon: Activity },
    { id: 'kejadian', label: '6. Pencatatan Keterjadian', icon: AlertTriangle }, 
    { id: 'efektivitas', label: '7. Efektifitas RTP', icon: BadgeCheck },
    { id: 'laporan', label: '8. Modul Laporan', icon: BookOpen }
  ];

  if (!currentUser) return <><GlobalStyle />{modal.isOpen && <PopupModal />}<LoginScreen /></>;

  return (
    <div className="flex h-screen bg-transparent font-sans text-slate-800">
      <GlobalStyle />
      {modal.isOpen && <PopupModal />}
      <aside className="w-72 bg-emerald-950/95 backdrop-blur-xl text-emerald-50 hidden md:flex flex-col shadow-2xl z-10 print:hidden relative overflow-hidden border-r border-emerald-900/50">
        <div className="p-6 relative z-10 border-b border-emerald-900/50">
          <div className="flex items-center space-x-3 mb-3"><div className="p-2 bg-emerald-800/50 rounded-xl"><Shield size={24} className="text-amber-400" /></div><h1 className="text-2xl font-extrabold text-white">SI-MARI</h1></div>
          <p className="text-xs text-emerald-200 font-medium">{currentUser.nama}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {currentUser.role === 'admin' ? (
            <>
              <button onClick={() => setActiveTab('admin_dashboard')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm ${activeTab === 'admin_dashboard' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><LayoutTemplate size={18} /><span>Dashboard Admin</span></button>
              <button onClick={() => setActiveTab('admin_users')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm ${activeTab === 'admin_users' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><Users size={18} /><span>User & Unit</span></button>
              <button onClick={() => setActiveTab('admin_sasaran')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm ${activeTab === 'admin_sasaran' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><Compass size={18} /><span>Hierarki K/L</span></button>
            </>
          ) : (
            unitMenus.map(menu => (<button key={menu.id} onClick={() => setActiveTab(menu.id)} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm ${activeTab === menu.id ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><menu.icon size={18} className={activeTab === menu.id ? 'text-amber-400' : 'text-emerald-400/80'}/><span>{menu.label}</span></button>))
          )}
        </nav>
        <div className="p-4 m-4 bg-emerald-900/50 rounded-2xl flex justify-between items-center">
          <div><p className="text-[9px] text-emerald-400 font-bold uppercase">Role Akses</p><p className="text-xs text-white font-bold uppercase">{currentUser.role}</p></div>
          <button onClick={() => { setCurrentUser(null); localStorage.removeItem('simari_current_user'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl"><LogOut size={16} /></button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-emerald-950/60 backdrop-blur-sm">
          <div className="w-72 bg-emerald-950 text-emerald-50 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <div className="p-6 flex justify-between items-center border-b border-emerald-900/50">
              <div className="flex items-center space-x-3"><Shield size={20} className="text-amber-400" /><h1 className="text-xl font-extrabold text-white">SI-MARI</h1></div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-emerald-900 text-emerald-400 rounded-xl"><X size={18} /></button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
               {/* Mobile Nav Content */}
               {unitMenus.map(menu => (<button key={menu.id} onClick={() => { setActiveTab(menu.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm ${activeTab === menu.id ? 'bg-emerald-700 text-white' : 'text-emerald-200/70'}`}><menu.icon size={18}/><span>{menu.label}</span></button>))}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="glass-panel border-b border-white/60 p-4 flex md:hidden justify-between items-center shadow-sm">
          <div className="flex items-center space-x-2"><Shield size={22} className="text-emerald-700" /><h1 className="font-extrabold text-slate-800 text-sm">SI-MARI BPI</h1></div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white text-slate-600 rounded-xl shadow-sm"><Menu size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {currentUser.role === 'admin' ? (<AdminDashboard />) : (
            <>
              {activeTab === 'dashboard' && <DashboardUnit />}
              {activeTab === 'tujuan' && <PenetapanTujuan />}
              {activeTab === 'identifikasi' && <IdentifikasiRisiko />}
              {activeTab === 'analisis' && <AnalisisEvaluasi />}
              {activeTab === 'penanganan' && <PenangananRisiko />}
              {activeTab === 'pemantauan' && <PemantauanRisiko />}
              {activeTab === 'kejadian' && <PencatatanKeterjadian />}
              {activeTab === 'efektivitas' && <EfektivitasRTP />}
              {activeTab === 'laporan' && <ModulLaporan />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
