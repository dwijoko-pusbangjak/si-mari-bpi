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

// === GAYA CSS GLOBAL (TEMA KEMENDES PDT - HIJAU & EMAS) ===
const GlobalStyle = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    html, body, #root {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #ecfdf5 0%, #f4fdf8 50%, #fffbeb 100%);
      background-attachment: fixed;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #6ee7b7; border-radius: 12px; border: 2px solid transparent; background-clip: padding-box; }
    ::-webkit-scrollbar-thumb:hover { background: #10b981; border: 2px solid transparent; background-clip: padding-box; }

    .glass-panel {
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 8px 32px rgba(4, 47, 46, 0.05);
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
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase Init Warning:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'simari-bpi-app';
const getCol = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);
const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// === LOCAL STORAGE HELPER ===
const saveLocal = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};
const loadLocal = (key, initial) => {
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initial; } catch (e) { return initial; }
};

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

  const showAlert = (title, message, status = 'info') => {
    setModal({ isOpen: true, type: 'alert', title, message, status, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({ isOpen: true, type: 'confirm', title, message, status: 'warning', onConfirm });
  };

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
      } catch (e) { 
        setFbUser({ uid: 'local-guest' });
      } finally {
        setIsDbLoading(false);
      }
    };
    initAuth();
    
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFbUser(user || { uid: 'local-guest' });
      });
      return () => unsubscribe();
    } else {
      setFbUser({ uid: 'local-guest' });
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fbUser || !db) {
      setIsDbLoading(false);
      return;
    }

    try {
      const unsubUnits = onSnapshot(getCol('units'), snap => {
        if (!snap.empty) setUnitKerjaList(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        else setUnitKerjaList([]);
      }, () => {});
      
      const unsubSasaran = onSnapshot(getDocRef('settings', 'masterSasaran'), snap => {
        if (snap.exists()) setMasterSasaran(snap.data());
        else setMasterSasaran(initialMasterSasaran);
      }, () => {});

      const unsubTujuan = onSnapshot(getCol('tujuan'), snap => {
        if (!snap.empty) setTujuanList(snap.docs.map(d => d.data()));
        else setTujuanList([]);
      }, () => {});

      const unsubRisks = onSnapshot(getCol('risks'), snap => {
        if (!snap.empty) setRisks(snap.docs.map(d => d.data()).sort((a,b) => b.id.localeCompare(a.id)));
        else setRisks([]);
      }, () => {});

      const unsubKejadian = onSnapshot(getCol('kejadian'), snap => {
        if (!snap.empty) setKejadianList(snap.docs.map(d => d.data()).sort((a,b) => b.id.localeCompare(a.id)));
        else setKejadianList([]);
      }, () => {});

      const unsubEfektivitas = onSnapshot(getCol('efektivitas'), snap => {
        if (!snap.empty) setRiwayatEfektivitas(snap.docs.map(d => d.data()).sort((a,b) => b.id.localeCompare(a.id)));
        else setRiwayatEfektivitas([]);
      }, () => {});

      return () => { 
        if (unsubUnits) unsubUnits(); 
        if (unsubSasaran) unsubSasaran(); 
        if (unsubTujuan) unsubTujuan(); 
        if (unsubRisks) unsubRisks(); 
        if (unsubKejadian) unsubKejadian(); 
        if (unsubEfektivitas) unsubEfektivitas(); 
      };
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

    useEffect(() => {
      if (unitKerjaList.length > 0 && !selectedUnit) {
        setSelectedUnit(unitKerjaList[0].id);
      }
    }, [unitKerjaList]);

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
      if (oldPass !== adminPassword) {
        return showAlert('Gagal', 'Kata sandi lama admin salah!', 'error');
      }
      if (newPass !== confirmPass) {
        return showAlert('Gagal', 'Konfirmasi kata sandi baru tidak cocok!', 'error');
      }
      if (newPass.length < 6) {
        return showAlert('Gagal', 'Kata sandi baru minimal 6 karakter.', 'error');
      }
      setAdminPassword(newPass);
      showAlert('Berhasil', 'Kata sandi admin berhasil diperbarui!', 'success');
      setOldPass(''); setNewPass(''); setConfirmPass('');
    };

    const handleAddUserClick = () => {
      setEditUnitId(null);
      setUnitForm({ id: '', nama: '', username: '', eselon: 'Eselon 2', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' });
      setAdminUserTab('form');
    };

    const handleEditUserClick = (unit) => {
      setEditUnitId(unit.id);
      setUnitForm({ ...unit, eselon: unit.eselon || 'Eselon 2' });
      setAdminUserTab('form');
    };

    const handleSaveUnit = async (e) => {
      e.preventDefault();
      if (unitForm.nama.trim() && unitForm.username.trim()) {
        showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan perubahan data unit kerja ini?', async () => {
          const idToSave = editUnitId || `unit_${Date.now()}`;
          try {
            if (db) await setDoc(getDocRef('units', idToSave), { id: idToSave, ...unitForm });
          } catch(e) {}
          
          setUnitKerjaList(prev => {
            const exists = prev.some(u => u.id === idToSave);
            if (exists) return prev.map(u => u.id === idToSave ? { ...u, ...unitForm } : u);
            return [...prev, { id: idToSave, ...unitForm }];
          });

          showAlert('Berhasil', 'Data unit kerja berhasil disimpan!', 'success');
          setEditUnitId(null);
          setUnitForm({ id: '', nama: '', username: '', eselon: 'Eselon 2', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' });
          setAdminUserTab('list');
        });
      }
    };

    const handleDeleteUnit = (id) => {
      const unitTarget = unitKerjaList.find(u => u.id === id);
      showConfirm('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus unit kerja "${unitTarget ? unitTarget.nama : id}" secara permanen?`, async () => {
        try { if (db) await deleteDoc(getDocRef('units', id)); } catch(e) {}
        setUnitKerjaList(prev => prev.filter(u => u.id !== id));
        showAlert('Berhasil', 'Unit kerja berhasil dihapus.', 'success');
      });
    };

    const handleAddMasterSasaran = async (e) => {
      e.preventDefault();
      if (formSasaran.nama.trim()) {
        showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan perubahan sasaran K/L ini?', async () => {
          let updated = { ...masterSasaran };

          if (editSasaranId) {
            updated[kategoriSasaran] = updated[kategoriSasaran].map(item => {
              if (item.id === editSasaranId) {
                let updatedItem = { ...item, nama: formSasaran.nama };
                if (kategoriSasaran !== 'strategis') updatedItem.parentId = selectedParentId;
                if (kategoriSasaran !== 'kegiatan') {
                  updatedItem.indikator = formSasaran.indikator; 
                  updatedItem.target = formSasaran.target; 
                  updatedItem.satuan = formSasaran.satuan;
                }
                return updatedItem;
              }
              return item;
            });
            showAlert('Berhasil', 'Master sasaran berhasil diperbarui!', 'success');
          } else {
            let newItem = { id: `M-${Date.now()}`, nama: formSasaran.nama };
            if (kategoriSasaran !== 'strategis') newItem.parentId = selectedParentId;
            if (kategoriSasaran !== 'kegiatan') {
              newItem.indikator = formSasaran.indikator; 
              newItem.target = formSasaran.target; 
              newItem.satuan = formSasaran.satuan;
            }
            updated[kategoriSasaran] = [...(updated[kategoriSasaran] || []), newItem];
            showAlert('Berhasil', 'Master sasaran berhasil ditambahkan!', 'success');
          }

          try { if (db) await setDoc(getDocRef('settings', 'masterSasaran'), updated); } catch(e) {}
          setMasterSasaran(updated);
          setFormSasaran({ nama: '', indikator: '', target: '', satuan: '' });
          setEditSasaranId(null);
        });
      }
    };

    const handleEditClickSasaran = (kat, item) => {
      setKategoriSasaran(kat);
      setSelectedParentId(item.parentId || '');
      setFormSasaran({
        nama: item.nama || '',
        indikator: item.indikator || '',
        target: item.target || '',
        satuan: item.satuan || ''
      });
      setEditSasaranId(item.id);
    };

    const handleDeleteSasaran = (kat, id) => {
      showConfirm('Hapus Sasaran', 'Apakah Anda yakin ingin menghapus sasaran ini?', async () => {
        const updated = {
          ...masterSasaran,
          [kat]: (masterSasaran[kat] || []).filter(item => item.id !== id)
        };
        try { if (db) await setDoc(getDocRef('settings', 'masterSasaran'), updated); } catch(e) {}
        setMasterSasaran(updated);
      });
    };

    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Panel Administrator Pusat BPI</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola manajemen akun unit kerja, hierarki Sasaran K/L, dan keamanan sandi admin.</p>
        </div>

        <div className="flex flex-wrap border-b border-slate-200/60 glass-panel rounded-t-2xl px-4 pt-2 gap-2">
          <button onClick={() => setActiveTab('admin_dashboard')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_dashboard' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><LayoutTemplate size={18} /> Dashboard</button>
          <button onClick={() => setActiveTab('admin_users')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_users' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Users size={18} /> Manajemen User</button>
          <button onClick={() => setActiveTab('admin_sasaran')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_sasaran' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Compass size={18} /> Hierarki Sasaran K/L</button>
          <button onClick={() => setActiveTab('admin_security')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_security' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><KeyRound size={18} /> Keamanan Admin</button>
        </div>

        {activeTab === 'admin_dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-5 rounded-2xl gap-4">
               <div>
                 <h3 className="font-bold text-slate-800 text-lg">Overview Manajemen Risiko BPI</h3>
                 <p className="text-xs text-slate-500 mt-1">Agregasi data identifikasi dan mitigasi risiko seluruh unit kerja.</p>
               </div>
               <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-xl border border-white">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 pl-2"><Calendar size={14}/> Tahun:</label>
                 <select value={adminTahun} onChange={(e) => setAdminTahun(e.target.value)} className="p-2 text-sm border-none rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-emerald-700 cursor-pointer">
                    <option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option>
                 </select>
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
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-rose-600">Sangat Tinggi</span><span className="text-slate-500">{stCount} Risiko</span></div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-rose-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${adminTotalRisks ? (stCount/adminTotalRisks)*100 : 0}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-orange-600">Tinggi</span><span className="text-slate-500">{tCount} Risiko</span></div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-orange-500 h-full rounded-full transition-all duration-700 ease-out delay-75" style={{ width: `${adminTotalRisks ? (tCount/adminTotalRisks)*100 : 0}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-amber-600">Sedang</span><span className="text-slate-500">{sCount} Risiko</span></div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-amber-500 h-full rounded-full transition-all duration-700 ease-out delay-150" style={{ width: `${adminTotalRisks ? (sCount/adminTotalRisks)*100 : 0}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-bold"><span className="text-teal-600">Rendah / Sangat Rendah</span><span className="text-slate-500">{rCount} Risiko</span></div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden"><div className="bg-teal-500 h-full rounded-full transition-all duration-700 ease-out delay-200" style={{ width: `${adminTotalRisks ? (rCount/adminTotalRisks)*100 : 0}%` }}></div></div>
                  </div>
                </div>
              </div>
              
              <div className="glass-panel rounded-2xl flex flex-col">
                <div className="p-5 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Crosshair size={16} className="text-emerald-600"/> Progres Mitigasi Global</h3></div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 text-slate-200/60" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <svg className="absolute inset-0 w-full h-full -rotate-90 text-emerald-500 transition-all duration-1000 ease-out" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${adminRtpCount ? (adminRtpFollowedUp/adminRtpCount)*100 : 0}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-4xl font-extrabold text-slate-800">{adminRtpCount ? Math.round((adminRtpFollowedUp/adminRtpCount)*100) : 0}<span className="text-xl text-slate-400 font-medium">%</span></span>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Selesai</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-6 text-center max-w-sm leading-relaxed">Dari total <span className="font-bold text-slate-700 bg-white/60 px-1.5 py-0.5 rounded-md border border-white">{adminRtpCount} RTP</span> yang ditetapkan, sebanyak <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">{adminRtpFollowedUp} RTP</span> telah dilengkapi dengan progres dan pengisian tautan eviden.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Building2 size={16} className="text-emerald-600"/> Statistik Risiko Per Unit Kerja</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-white/40 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="p-4 border-b border-slate-200/50 font-bold">Nama Unit Kerja</th>
                      <th className="p-4 border-b border-slate-200/50 font-bold">Jenis Unit Kerja</th>
                      <th className="p-4 border-b border-slate-200/50 font-bold text-center">Total Risiko</th>
                      <th className="p-4 border-b border-slate-200/50 font-bold text-center text-rose-500">Risiko Tinggi</th>
                      <th className="p-4 border-b border-slate-200/50 font-bold text-center text-amber-500">RTP Ditetapkan</th>
                      <th className="p-4 border-b border-slate-200/50 font-bold text-center text-emerald-600">RTP Berjalan</th>
                      <th className="p-4 border-b border-slate-200/50 font-bold text-center w-40">Progres RTP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 text-[13px]">
                    {unitKerjaList.map(unit => {
                      const uRisks = adminRisks.filter(r => r.unit === unit.nama);
                      const uTotal = uRisks.length;
                      const uTinggi = uRisks.filter(r => r.levelRisiko === 'Sangat Tinggi' || r.levelRisiko === 'Tinggi').length;
                      const uRtp = uRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi').length;
                      const uRtpDone = uRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi' && (r.prosesRtp?.trim() || r.linkEviden?.trim())).length;
                      const pct = uRtp ? Math.round((uRtpDone/uRtp)*100) : 0;
                      
                      return (
                        <tr key={unit.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{unit.nama}</td>
                          <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${unit.eselon === 'Eselon 1' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200/60'}`}>{unit.eselon || 'Eselon 2'}</span></td>
                          <td className="p-4 text-center font-bold text-slate-600 bg-white/30">{uTotal}</td>
                          <td className="p-4 text-center font-bold text-rose-600">{uTinggi}</td>
                          <td className="p-4 text-center font-bold text-amber-600 bg-amber-50/30">{uRtp}</td>
                          <td className="p-4 text-center font-bold text-emerald-600">{uRtpDone}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full ${pct === 100 ? 'bg-emerald-500' : (pct > 50 ? 'bg-emerald-400' : 'bg-amber-400')}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-500 w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {unitKerjaList.length === 0 && (
                      <tr><td colSpan="7" className="p-6 text-center text-slate-400 italic font-medium">Belum ada data unit kerja terdaftar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin_security' && (
          <div className="glass-panel p-6 rounded-2xl max-w-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={18} className="text-emerald-600" /> Ubah Kata Sandi Admin
              </h3>
              <p className="text-xs text-slate-500 mt-1">Perbarui kata sandi administrator pusat secara berkala untuk keamanan sistem.</p>
            </div>
            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi Lama</label>
                <input required type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Masukkan sandi lama..." className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi Baru</label>
                <input required type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 6 karakter..." className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Konfirmasi Kata Sandi Baru</label>
                <input required type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Ulangi sandi baru..." className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" />
              </div>
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95">
                <Save size={16} /> Simpan Kata Sandi Baru
              </button>
            </form>
          </div>
        )}

        {activeTab === 'admin_users' && (
          <div className="space-y-6">
            <div className="flex space-x-2 border-b border-slate-200/60 pb-2">
              <button onClick={() => { setAdminUserTab('list'); setEditUnitId(null); }} className={`px-4 py-2 text-sm font-bold rounded-t-xl flex items-center gap-2 cursor-pointer transition-colors text-left ${adminUserTab === 'list' ? 'glass-panel text-emerald-800 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}><List size={16} /> Daftar Unit Kerja</button>
              <button onClick={handleAddUserClick} className={`px-4 py-2 text-sm font-bold rounded-t-xl flex items-center gap-2 cursor-pointer transition-colors text-left ${adminUserTab === 'form' && !editUnitId ? 'glass-panel text-emerald-800 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}><PlusCircle size={16} /> Tambah User</button>
              {adminUserTab === 'form' && editUnitId && (<button className="px-4 py-2 text-sm font-bold rounded-t-xl glass-panel text-emerald-800 border-b-2 border-emerald-600 flex items-center gap-2 text-left"><Edit size={16} /> Edit User</button>)}
            </div>

            {adminUserTab === 'form' ? (
              <div className="glass-panel p-6 rounded-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <form onSubmit={handleSaveUnit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Unit Kerja</label><input required type="text" value={unitForm.nama} onChange={(e) => setUnitForm({...unitForm, nama: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Contoh: Sekretariat Badan / Direktorat..." /></div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis Unit Kerja</label>
                      <select required value={unitForm.eselon} onChange={(e) => setUnitForm({...unitForm, eselon: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all font-semibold text-emerald-800">
                        <option value="Eselon 1">Eselon 1</option>
                        <option value="Eselon 2">Eselon 2</option>
                      </select>
                    </div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Username Login</label><input required type="text" value={unitForm.username} onChange={(e) => setUnitForm({...unitForm, username: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kata Sandi Akun</label><input required type="text" value={unitForm.sandi} onChange={(e) => setUnitForm({...unitForm, sandi: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" /></div>
                    <div className="md:col-span-2 pt-4 border-t border-slate-200/50"><h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Informasi Pimpinan</h4></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Pimpinan</label><input required type="text" value={unitForm.namaPimpinan} onChange={(e) => setUnitForm({...unitForm, namaPimpinan: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">NIP Pimpinan</label><input required type="text" value={unitForm.nipPimpinan} onChange={(e) => setUnitForm({...unitForm, nipPimpinan: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50">
                    <button type="button" onClick={() => { setAdminUserTab('list'); setEditUnitId(null); }} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>
                    <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> Simpan Data</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in duration-300">
                <div className="p-3 bg-emerald-50/80 border-b border-emerald-100/50 text-[11px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Info size={14} className="text-emerald-600" /> Tip: Klik pada nama unit kerja atau ikon Edit untuk mengubah data.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-white/40 border-b border-slate-200/60 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        <th className="p-4 w-12 text-center">No</th>
                        <th className="p-4">Nama Unit Kerja</th>
                        <th className="p-4">Jenis Unit Kerja</th>
                        <th className="p-4">Login</th>
                        <th className="p-4">Pimpinan</th>
                        <th className="p-4 w-24 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 text-[13px]">
                      {unitKerjaList.map((unit, idx) => (
                        <tr key={unit.id} className="hover:bg-emerald-50/40 transition-colors group">
                          <td className="p-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-4">
                            <button 
                              type="button"
                              onClick={() => handleEditUserClick(unit)}
                              className="font-bold text-slate-800 hover:text-emerald-700 text-left cursor-pointer flex items-center gap-2 transition-colors"
                            >
                              <span>{unit.nama}</span>
                              <Edit size={13} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </button>
                          </td>
                          <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${unit.eselon === 'Eselon 1' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200/60'}`}>{unit.eselon || 'Eselon 2'}</span></td>
                          <td className="p-4"><p className="text-slate-500">User: <span className="font-bold text-emerald-800">{unit.username}</span></p><p className="text-slate-500 text-[11px] mt-0.5">Pass: {unit.sandi}</p></td>
                          <td className="p-4"><p className="font-bold text-slate-800">{unit.namaPimpinan}</p><p className="text-[11px] text-slate-500 mt-0.5">NIP: {unit.nipPimpinan}</p></td>
                          <td className="p-4 text-center space-x-2">
                            <button onClick={() => handleEditUserClick(unit)} className="p-2 bg-white/60 text-slate-500 border border-white rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer" title="Edit"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteUnit(unit.id)} className="p-2 bg-white/60 text-slate-500 border border-white rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                      {unitKerjaList.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-medium">Belum ada unit kerja terdaftar.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin_sasaran' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <form onSubmit={handleAddMasterSasaran} className="glass-panel p-6 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200/50 pb-4">
                <Layers size={16} className="text-emerald-600" /> 
                {editSasaranId ? "Edit Hierarki Sasaran K/L" : "Tambah Hierarki Sasaran K/L"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Level Sasaran</label>
                  <select value={kategoriSasaran} onChange={(e) => { setKategoriSasaran(e.target.value); setSelectedParentId(''); }} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-semibold text-slate-700">
                    <option value="strategis">Sasaran Strategis</option>
                    <option value="program">Sasaran Program</option>
                    <option value="kegiatan">Sasaran Kegiatan</option>
                  </select>
                </div>
                {kategoriSasaran === 'program' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Induk Strategis</label>
                    <select required value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50">
                      <option value="">-- Pilih --</option>
                      {(masterSasaran.strategis || []).map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                    </select>
                  </div>
                )}
                {kategoriSasaran === 'kegiatan' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Induk Program</label>
                    <select required value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50">
                      <option value="">-- Pilih --</option>
                      {(masterSasaran.program || []).map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                )}
                <div className={kategoriSasaran === 'kegiatan' ? "md:col-span-2" : "md:col-span-1"}>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Uraian Sasaran</label>
                  <input required type="text" value={formSasaran.nama} onChange={(e) => setFormSasaran({...formSasaran, nama: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Masukkan uraian..." />
                </div>
              </div>
              {kategoriSasaran !== 'kegiatan' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Indikator (IKU)</label><input required type="text" value={formSasaran.indikator} onChange={(e) => setFormSasaran({...formSasaran, indikator: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Indikator..." /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Target</label><input required type="text" value={formSasaran.target} onChange={(e) => setFormSasaran({...formSasaran, target: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Target..." /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Satuan</label><input required type="text" value={formSasaran.satuan} onChange={(e) => setFormSasaran({...formSasaran, satuan: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Satuan..." /></div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
                {editSasaranId && (
                  <button type="button" onClick={() => { setEditSasaranId(null); setFormSasaran({ nama: '', indikator: '', target: '', satuan: '' }); }} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">
                    Batal
                  </button>
                )}
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all">
                  {editSasaranId ? <Save size={16} /> : <Plus size={16} />} {editSasaranId ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>

            <div className="glass-panel rounded-2xl overflow-hidden mt-6">
              <div className="p-4 bg-white/40 border-b border-slate-200/50">
                <h3 className="font-bold text-slate-800 text-sm">Daftar Hierarki Sasaran K/L <span className="font-medium text-slate-500 text-xs ml-1">(Dikelompokkan Berdasarkan Nama Sasaran)</span></h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-white/30 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/60">
                      <th className="p-4 w-1/2">Level & Uraian Sasaran</th>
                      <th className="p-4">Indikator (IKU) & Target</th>
                      <th className="p-4 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 text-[13px]">
                    {Array.from(new Set((masterSasaran.strategis || []).map(s => s.nama))).map(stratNama => {
                      const stratItems = (masterSasaran.strategis || []).filter(s => s.nama === stratNama);
                      return (
                        <React.Fragment key={`strat_${stratNama}`}>
                          <tr className="bg-emerald-50/40 hover:bg-emerald-50/70 align-top transition-colors">
                            <td className="p-4 font-bold text-slate-900 border-l-4 border-emerald-600">
                              <span className="inline-block bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md mr-2 text-[10px] font-bold uppercase tracking-wide">Strategis</span>
                              <span className="leading-relaxed">{stratNama}</span>
                            </td>
                            <td className="p-4 space-y-2">
                              {stratItems.map(strat => (
                                <div key={strat.id} className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-emerald-100/50 shadow-sm backdrop-blur-sm">
                                  <div className="space-y-1">
                                    <p className="text-emerald-900 font-bold text-xs"><span className="text-emerald-600/80 mr-1">IKU:</span> {strat.indikator}</p>
                                    <p className="text-slate-500 text-xs font-medium"><span className="text-slate-400 mr-1">Target:</span> {strat.target} <span className="bg-slate-100/80 px-1.5 rounded">{strat.satuan}</span></p>
                                  </div>
                                  <div className="flex gap-1.5 ml-3">
                                    <button onClick={() => handleEditClickSasaran('strategis', strat)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer" title="Edit"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteSasaran('strategis', strat.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                                  </div>
                                </div>
                              ))}
                            </td>
                            <td className="p-4 text-center text-slate-300 italic">-</td>
                          </tr>

                          {Array.from(new Set(
                            (masterSasaran.program || [])
                              .filter(p => stratItems.some(s => s.id === p.parentId))
                              .map(p => p.nama)
                          )).map(progNama => {
                            const progItems = (masterSasaran.program || []).filter(p => p.nama === progNama && stratItems.some(s => s.id === p.parentId));
                            return (
                              <React.Fragment key={`prog_${progNama}`}>
                                <tr className="bg-teal-50/30 hover:bg-teal-50/60 align-top transition-colors">
                                  <td className="p-4 pl-10 font-bold text-slate-800 border-l-4 border-teal-500">
                                    <span className="inline-block bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md mr-2 text-[10px] font-bold uppercase tracking-wide">Program</span>
                                    <span className="leading-relaxed">{progNama}</span>
                                  </td>
                                  <td className="p-4 space-y-2">
                                    {progItems.map(prog => (
                                      <div key={prog.id} className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-teal-100/50 shadow-sm backdrop-blur-sm">
                                        <div className="space-y-1">
                                          <p className="text-teal-900 font-bold text-xs"><span className="text-teal-600/80 mr-1">IKU:</span> {prog.indikator}</p>
                                          <p className="text-slate-500 text-xs font-medium"><span className="text-slate-400 mr-1">Target:</span> {prog.target} <span className="bg-slate-100/80 px-1.5 rounded">{prog.satuan}</span></p>
                                        </div>
                                        <div className="flex gap-1.5 ml-3">
                                          <button onClick={() => handleEditClickSasaran('program', prog)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer" title="Edit"><Edit size={14}/></button>
                                          <button onClick={() => handleDeleteSasaran('program', prog.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                                        </div>
                                      </div>
                                    ))}
                                  </td>
                                  <td className="p-4 text-center text-slate-300 italic">-</td>
                                </tr>

                                {Array.from(new Set(
                                  (masterSasaran.kegiatan || [])
                                    .filter(k => progItems.some(p => p.id === k.parentId))
                                    .map(k => k.nama)
                                )).map(kegNama => {
                                  const kegItems = (masterSasaran.kegiatan || []).filter(k => k.nama === kegNama && progItems.some(p => p.id === k.parentId));
                                  return (
                                    <tr key={`keg_${kegNama}`} className="hover:bg-slate-50/60 align-top transition-colors">
                                      <td className="p-4 pl-16 text-slate-700 border-l-4 border-slate-300 font-semibold">
                                        <span className="inline-block bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md mr-2 text-[10px] font-bold uppercase tracking-wide">Kegiatan</span>
                                        <span className="leading-relaxed">{kegNama}</span>
                                      </td>
                                      <td className="p-4 space-y-2">
                                        {kegItems.map(keg => (
                                          <div key={keg.id} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-slate-200/50 shadow-sm">
                                            <span className="text-slate-500 text-xs font-medium italic">Sasaran Kegiatan Aktif</span>
                                            <div className="flex gap-1.5 ml-3">
                                              <button onClick={() => handleEditClickSasaran('kegiatan', keg)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer" title="Edit"><Edit size={14}/></button>
                                              <button onClick={() => handleDeleteSasaran('kegiatan', keg.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                                            </div>
                                          </div>
                                        ))}
                                      </td>
                                      <td className="p-4 text-center text-slate-300 italic">-</td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}

                    {(!masterSasaran.strategis || masterSasaran.strategis.length === 0) && (
                      <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic font-medium">Belum ada hierarki sasaran terdaftar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
    
    // Memisahkan list berdasarkan level untuk keperluan tooltip detail
    const listSangatTinggi = unitRisks.filter(r => r.levelRisiko === 'Sangat Tinggi');
    const listTinggi = unitRisks.filter(r => r.levelRisiko === 'Tinggi');
    const listSedang = unitRisks.filter(r => r.levelRisiko === 'Sedang');
    const listRendah = unitRisks.filter(r => r.levelRisiko === 'Rendah' || r.levelRisiko === 'Sangat Rendah');

    const risikoSangatTinggi = listSangatTinggi.length;
    const risikoTinggi = listTinggi.length;
    const risikoSedang = listSedang.length;
    const risikoRendah = listRendah.length;

    // Komponen Kartu Internal dengan Tooltip interaktif
    const DashboardCard = ({ title, value, icon: Icon, iconWrapperClass, tooltipTitle, tooltipColorClass, children }) => {
      return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative cursor-help">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{title}</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl transition-colors ${iconWrapperClass}`}>
              <Icon size={28} />
            </div>
          </div>
          
          {/* Indikator Tooltip */}
          <div className="mt-4 flex items-center text-[10px] text-slate-400 font-medium">
            <span className="border-b border-dashed border-slate-300">Sorot untuk detail</span>
          </div>

          {/* Konten Tooltip */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 transform origin-top group-hover:translate-y-0 translate-y-2 pointer-events-none border border-slate-700">
            <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-t border-l border-slate-700"></div>
            <div className="relative z-10">
              <h4 className={`font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider ${tooltipColorClass}`}>
                {tooltipTitle}
              </h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {children}
              </ul>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Manajemen Risiko</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold ${currentUser.eselon === 'Eselon 1' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-700'}`}>{currentUser.eselon || 'Eselon 2'}</span>
            <p className="text-slate-500 text-sm font-medium">{currentUser.nama}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Kartu 1: Total Risiko */}
          <DashboardCard 
            title="Total Risiko" 
            value={totalRisiko} 
            icon={Hexagon} 
            iconWrapperClass="bg-white/60 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700"
            tooltipTitle="Daftar Risiko Teridentifikasi"
            tooltipColorClass="text-emerald-400"
          >
            {unitRisks.length > 0 ? unitRisks.map(r => (
              <li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0">
                <span className="text-[11px] text-slate-300 font-mono">{r.id}</span>
                <span className="text-[12px] truncate" title={r.pernyataanRisiko}>{r.pernyataanRisiko}</span>
                <span className={`text-[9px] w-max px-1.5 rounded ${r.levelRisiko.includes('Tinggi') ? 'bg-rose-500/20 text-rose-300' : r.levelRisiko === 'Sedang' ? 'bg-amber-500/20 text-amber-300' : 'bg-teal-500/20 text-teal-300'}`}>
                  {r.levelRisiko}
                </span>
              </li>
            )) : <li className="text-[11px] text-slate-500 italic">Belum ada risiko.</li>}
          </DashboardCard>

          {/* Kartu 2: RTP Dimitigasi */}
          <DashboardCard 
            title="RTP Dimitigasi" 
            value={risikoDimitigasi} 
            icon={ShieldCheck} 
            iconWrapperClass="bg-white/60 text-teal-500 group-hover:bg-teal-50 group-hover:text-teal-600"
            tooltipTitle="Risiko yang Dimitigasi"
            tooltipColorClass="text-teal-400"
          >
            {risksDimitigasiList.length > 0 ? risksDimitigasiList.map(r => (
              <li key={r.id} className="flex justify-between items-start gap-2 text-[11px] border-b border-slate-700/50 pb-1.5 last:border-0">
                <span className="truncate flex-1 font-mono text-slate-300" title={r.pernyataanRisiko}>{r.id}</span>
                <span className={r.rtp ? 'text-teal-400' : 'text-rose-400'}>{r.rtp ? 'Ada RTP' : 'RTP Kosong'}</span>
              </li>
            )) : <li className="text-[11px] text-slate-500 italic">Belum ada RTP.</li>}
          </DashboardCard>

          {/* Kartu 3: Kejadian Risiko */}
          <DashboardCard 
            title="Kejadian Risiko" 
            value={unitKejadian.length} 
            icon={AlertTriangle} 
            iconWrapperClass="bg-white/60 text-rose-500 group-hover:bg-rose-50 group-hover:text-rose-600"
            tooltipTitle="Insiden Tercatat"
            tooltipColorClass="text-rose-400"
          >
            {unitKejadian.length > 0 ? unitKejadian.map(k => (
              <li key={k.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0">
                <span className="text-[10px] text-slate-400">{k.tanggal}</span>
                <span className="text-[11px] truncate text-rose-200" title={k.risiko}>{k.risiko}</span>
              </li>
            )) : <li className="text-[11px] text-slate-500 italic">Belum ada insiden.</li>}
          </DashboardCard>

          {/* Kartu 4: Efektifitas */}
          <DashboardCard 
            title="Efektifitas" 
            value={unitEfektivitas.length} 
            icon={BadgeCheck} 
            iconWrapperClass="bg-white/60 text-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
            tooltipTitle="Evaluasi Efektivitas"
            tooltipColorClass="text-emerald-400"
          >
            {unitEfektivitas.length > 0 ? unitEfektivitas.map(e => (
              <li key={e.id} className="flex justify-between items-start gap-2 text-[11px] border-b border-slate-700/50 pb-1.5 last:border-0">
                <span className="truncate flex-1 font-mono text-slate-300">{e.riskId}</span>
                <span className={e.srActual <= e.srDiharapkan ? 'text-emerald-400' : 'text-amber-400'}>
                  {e.srActual <= e.srDiharapkan ? 'Efektif' : 'Tdk Efektif'}
                </span>
              </li>
            )) : <li className="text-[11px] text-slate-500 italic">Belum ada evaluasi.</li>}
          </DashboardCard>

        </div>
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><PieChart size={16} className="text-emerald-600"/> Distribusi Level Risiko</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Kartu Sangat Tinggi */}
            <div className="p-5 bg-rose-50/70 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">Sangat Tinggi</p>
              <p className="text-3xl font-extrabold text-rose-900 mt-2">{risikoSangatTinggi}</p>
              <div className="mt-2 text-[9px] text-rose-400/80 font-medium border-b border-dashed border-rose-300/50 w-max">Sorot detail</div>
              
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <div className="relative z-10">
                  <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-rose-400">Risiko Sangat Tinggi</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {listSangatTinggi.length > 0 ? listSangatTinggi.map(r => (
                      <li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200" title={r.pernyataanRisiko}>{r.pernyataanRisiko}</span></li>
                    )) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Kartu Tinggi */}
            <div className="p-5 bg-orange-50/70 border border-orange-100 rounded-2xl hover:bg-orange-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">Tinggi</p>
              <p className="text-3xl font-extrabold text-orange-900 mt-2">{risikoTinggi}</p>
              <div className="mt-2 text-[9px] text-orange-400/80 font-medium border-b border-dashed border-orange-300/50 w-max">Sorot detail</div>
              
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <div className="relative z-10">
                  <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-orange-400">Risiko Tinggi</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {listTinggi.length > 0 ? listTinggi.map(r => (
                      <li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200" title={r.pernyataanRisiko}>{r.pernyataanRisiko}</span></li>
                    )) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Kartu Sedang */}
            <div className="p-5 bg-amber-50/70 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">Sedang</p>
              <p className="text-3xl font-extrabold text-amber-900 mt-2">{risikoSedang}</p>
              <div className="mt-2 text-[9px] text-amber-500/80 font-medium border-b border-dashed border-amber-300/50 w-max">Sorot detail</div>

              <div className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <div className="relative z-10">
                  <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-amber-400">Risiko Sedang</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {listSedang.length > 0 ? listSedang.map(r => (
                      <li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200" title={r.pernyataanRisiko}>{r.pernyataanRisiko}</span></li>
                    )) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Kartu Rendah */}
            <div className="p-5 bg-teal-50/70 border border-teal-100 rounded-2xl hover:bg-teal-100 transition-all duration-300 group relative cursor-help">
              <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wide">Rendah</p>
              <p className="text-3xl font-extrabold text-teal-900 mt-2">{risikoRendah}</p>
              <div className="mt-2 text-[9px] text-teal-500/80 font-medium border-b border-dashed border-teal-300/50 w-max">Sorot detail</div>

              <div className="absolute bottom-full right-0 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-4 border border-slate-700 pointer-events-none">
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-slate-800 transform rotate-45 border-b border-r border-slate-700"></div>
                <div className="relative z-10">
                  <h4 className="font-bold mb-2 border-b border-slate-600 pb-1 text-xs uppercase tracking-wider text-teal-400">Risiko Rendah</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {listRendah.length > 0 ? listRendah.map(r => (
                      <li key={r.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-1.5 last:border-0"><span className="text-[10px] text-slate-400 font-mono">{r.id}</span><span className="text-[11px] truncate text-slate-200" title={r.pernyataanRisiko}>{r.pernyataanRisiko}</span></li>
                    )) : <li className="text-[11px] text-slate-500 italic">Tidak ada data</li>}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const PenetapanTujuan = () => {
    const isEselon1 = currentUser.eselon === 'Eselon 1';
    const [selectedStrategis, setSelectedStrategis] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedKegiatan, setSelectedKegiatan] = useState('');
    const [indikatorKgt, setIndikatorKgt] = useState('');
    const [targetKgt, setTargetKgt] = useState('');
    const [satuanKgt, setSatuanKgt] = useState('');
    const [editTujuanId, setEditTujuanId] = useState(null);
    
    const uniqueStrategis = Array.from(new Set(masterSasaran.strategis.map(s => s.nama)))
      .map(nama => masterSasaran.strategis.find(s => s.nama === nama));

    const filteredProgram = masterSasaran.program.filter(p => !selectedStrategis || p.parentId === selectedStrategis);
    const uniqueProgram = Array.from(new Set(filteredProgram.map(p => p.nama)))
      .map(nama => filteredProgram.find(p => p.nama === nama));

    const filteredKegiatan = masterSasaran.kegiatan.filter(k => !selectedProgram || k.parentId === selectedProgram);
    const uniqueKegiatan = Array.from(new Set(filteredKegiatan.map(k => k.nama)))
      .map(nama => filteredKegiatan.find(k => k.nama === nama));

    const handleSaveTujuan = async (e) => {
      e.preventDefault();
      const stratObj = masterSasaran.strategis.find(s => s.id === selectedStrategis);
      const progObj = masterSasaran.program.find(p => p.id === selectedProgram);
      const kgtObj = isEselon1 ? null : masterSasaran.kegiatan.find(k => k.id === selectedKegiatan);

      if (stratObj && progObj && (isEselon1 || kgtObj)) {
        showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan perubahan data penetapan tujuan ini?', async () => {
          const newId = editTujuanId || `TSJ-${Date.now()}`;
          const targetLevelNama = isEselon1 ? progObj.nama : kgtObj.nama;
          const newEntry = { id: newId, unit: currentUser.nama, tahun: currentUser.tahun, eselon: currentUser.eselon || 'Eselon 2', strategis: stratObj.nama, program: progObj.nama, kegiatan: targetLevelNama, indikator: indikatorKgt, target: targetKgt, satuan: satuanKgt };
          try { if (db) await setDoc(getDocRef('tujuan', newId), newEntry); } catch(e) {}
          
          setTujuanList(prev => {
            const exists = prev.some(t => t.id === newId);
            if (exists) return prev.map(t => t.id === newId ? newEntry : t);
            return [newEntry, ...prev];
          });

          setSelectedStrategis(''); setSelectedProgram(''); setSelectedKegiatan(''); setIndikatorKgt(''); setTargetKgt(''); setSatuanKgt(''); setEditTujuanId(null);
          showAlert('Berhasil', 'Data penetapan tujuan berhasil disimpan!', 'success');
        });
      }
    };
    
    const handleEditTujuan = (item) => {
      setEditTujuanId(item.id);
      setIndikatorKgt(item.indikator);
      setTargetKgt(item.target || '');
      setSatuanKgt(item.satuan || '');
    };

    const handleDeleteTujuan = async (id) => { 
      showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus data penetapan tujuan ini?', async () => {
        try { if (db) await deleteDoc(getDocRef('tujuan', id)); } catch(e) {}
        setTujuanList(prev => prev.filter(t => t.id !== id));
        showAlert('Berhasil', 'Data penetapan tujuan berhasil dihapus.', 'success');
      });
    };

    const unitTujuanList = tujuanList.filter(t => t.unit === currentUser.nama && t.tahun === currentUser.tahun);

    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">1. Penetapan Tujuan</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Tahun <span className="font-bold text-slate-700">{currentUser?.tahun}</span> &bull; Mode: <span className="font-bold text-emerald-700">{currentUser.eselon || 'Eselon 2'}</span> {isEselon1 ? '(Hierarki Sasaran Program)' : '(Hierarki Sasaran Kegiatan)'}</p>
        </div>
        <form onSubmit={handleSaveTujuan} className="glass-panel p-6 rounded-2xl space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">1. Sasaran Strategis K/L</label>
              <select required value={selectedStrategis} onChange={(e) => { setSelectedStrategis(e.target.value); setSelectedProgram(''); setSelectedKegiatan(''); }} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800"><option value="">-- Pilih --</option>{uniqueStrategis.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}</select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">2. Sasaran Program</label>
              <select required value={selectedProgram} onChange={(e) => { setSelectedProgram(e.target.value); setSelectedKegiatan(''); }} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800" disabled={!selectedStrategis}><option value="">-- Pilih --</option>{uniqueProgram.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select>
            </div>
            
            {!isEselon1 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">3. Sasaran Kegiatan</label>
                <select required value={selectedKegiatan} onChange={(e) => setSelectedKegiatan(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800" disabled={!selectedProgram}><option value="">-- Pilih --</option>{uniqueKegiatan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-200/50">
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Indikator IKU Unit</label><input required type="text" value={indikatorKgt} onChange={(e) => setIndikatorKgt(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Ketik indikator..." /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Target</label><input required type="text" value={targetKgt} onChange={(e) => setTargetKgt(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Nilai target..." /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Satuan</label><input required type="text" value={satuanKgt} onChange={(e) => setSatuanKgt(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Misal: Dokumen..." /></div>
            </div>
          <div className="pt-4 flex justify-end gap-3">
            {editTujuanId && <button type="button" onClick={() => { setEditTujuanId(null); setIndikatorKgt(''); setTargetKgt(''); setSatuanKgt(''); }} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>}
            <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><PlusCircle size={16} /> {editTujuanId ? 'Update Tujuan' : 'Simpan Data'}</button>
          </div>
        </form>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200/60 text-[10px] text-slate-500 uppercase tracking-wider font-bold bg-white/40">
                  <th className="p-4">ID</th><th className="p-4">Strategis</th><th className="p-4">{isEselon1 ? 'Program & Indikator' : 'Kegiatan & Indikator'}</th><th className="p-4 text-center">Target</th><th className="p-4 text-center">Satuan</th><th className="p-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 text-[13px]">
                {unitTujuanList.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400">{item.id}</td>
                    <td className="p-4 font-medium text-slate-700 leading-relaxed">{item.strategis}</td>
                    <td className="p-4 leading-relaxed"><strong className="text-slate-800">{isEselon1 ? item.program : item.kegiatan}</strong><br/><span className="text-emerald-700 text-[11px] font-bold mt-1 inline-block bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100/50">IKU: {item.indikator}</span></td>
                    <td className="p-4 text-center"><span className="bg-emerald-100/80 text-emerald-800 px-3 py-1.5 rounded-lg font-bold border border-emerald-200/50">{item.target}</span></td>
                    <td className="p-4 text-center"><span className="bg-white/60 text-slate-600 px-3 py-1.5 rounded-lg font-bold border border-white">{item.satuan || '-'}</span></td>
                    <td className="p-4 text-center space-x-1 whitespace-nowrap">
                      <button type="button" onClick={() => handleEditTujuan(item)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer" title="Edit"><Edit size={14}/></button>
                      <button type="button" onClick={() => handleDeleteTujuan(item.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {unitTujuanList.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-medium">Belum ada data penetapan tujuan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const IdentifikasiRisiko = () => {
    const isEselon1 = currentUser.eselon === 'Eselon 1';
    const unitTujuanList = tujuanList.filter(t => t.unit === currentUser.nama && t.tahun === currentUser.tahun);
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const [editRiskId, setEditRiskId] = useState(null);
    const [formRisk, setFormRisk] = useState({ 
      indikatorKgt: unitTujuanList[0]?.indikator || '', 
      sasaranKgt: unitTujuanList[0]?.kegiatan || unitTujuanList[0]?.program || '', 
      permasalahan: '', 
      pernyataanRisiko: '', 
      kategoriRisiko: 'Operasional', 
      pemilikRisiko: '', 
      penyebabUraian: '', 
      penyebabSumber: '', 
      sifatKontrol: 'Controllable', 
      dampakUraian: '', 
      dampakPihak: '', 
      pengendalianRisiko: '', 
      penilaianPengendalian: '', 
      sisaRisiko: '' 
    });

    const handleIndikatorChange = (val) => {
      const found = unitTujuanList.find(t => t.indikator === val);
      setFormRisk(prev => ({
        ...prev,
        indikatorKgt: val,
        sasaranKgt: found ? (isEselon1 ? found.program : found.kegiatan) : prev.sasaranKgt
      }));
    };

    const handleSaveRisk = async (e) => {
      e.preventDefault();
      showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan perubahan data identifikasi risiko ini?', async () => {
        const newId = editRiskId || `RSK-${Date.now()}`;
        const existing = risks.find(r => r.id === newId);
        const newRisk = { 
          id: newId, 
          unit: currentUser.nama, 
          tahun: currentUser.tahun, 
          ...formRisk, 
          kemungkinan: existing ? existing.kemungkinan : 0, 
          keparahan: existing ? existing.keparahan : 0, 
          skor: existing ? existing.skor : 0, 
          status: existing ? existing.status : "Belum Dianalisis", 
          levelRisiko: existing ? existing.levelRisiko : "Belum Dianalisis", 
          keputusanMitigasi: existing ? existing.keputusanMitigasi : "-", 
          rtp: existing ? existing.rtp : "", 
          prosesRtp: existing ? existing.prosesRtp : "", 
          linkEviden: existing ? existing.linkEviden : "", 
          penanggungJawab: existing ? existing.penanggungJawab : "", 
          targetWaktu: existing ? existing.targetWaktu : "", 
          komunikasi: existing ? existing.komunikasi : "", 
          tahap: existing ? existing.tahap : "identifikasi" 
        };
        try { if (db) await setDoc(getDocRef('risks', newId), newRisk); } catch(e) {}
        
        setRisks(prev => {
          const exists = prev.some(r => r.id === newId);
          if (exists) return prev.map(r => r.id === newId ? newRisk : r);
          return [newRisk, ...prev];
        });

        setEditRiskId(null);
        setFormRisk({ 
          indikatorKgt: unitTujuanList[0]?.indikator || '', 
          sasaranKgt: unitTujuanList[0]?.kegiatan || unitTujuanList[0]?.program || '', 
          permasalahan: '', 
          pernyataanRisiko: '', 
          kategoriRisiko: 'Operasional', 
          pemilikRisiko: '', 
          penyebabUraian: '', 
          penyebabSumber: '', 
          sifatKontrol: 'Controllable', 
          dampakUraian: '', 
          dampakPihak: '', 
          pengendalianRisiko: '', 
          penilaianPengendalian: '', 
          sisaRisiko: '' 
        });
        showAlert('Berhasil', 'Data identifikasi risiko berhasil disimpan!', 'success');
      });
    };

    const handleEditRisk = (item) => {
      setEditRiskId(item.id);
      setFormRisk({ ...item, indikatorKgt: item.indikatorKgt || '', sasaranKgt: item.sasaranKgt || '' });
    };

    const handleDeleteRisk = async (id) => { 
      showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus data identifikasi risiko ini?', async () => {
        try { if (db) await deleteDoc(getDocRef('risks', id)); } catch(e) {}
        setRisks(prev => prev.filter(r => r.id !== id));
        showAlert('Berhasil', 'Data risiko berhasil dihapus.', 'success');
      });
    };

    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">2. Identifikasi Risiko</h2><p className="text-xs text-slate-500 mt-1 font-medium">Tahun {currentUser?.tahun}</p></div>
        <form onSubmit={handleSaveRisk} className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Indikator Sasaran (IKU)</label>
              <select required value={formRisk.indikatorKgt} onChange={(e) => handleIndikatorChange(e.target.value)} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800">
                {unitTujuanList.map((t, i) => <option key={i} value={t.indikator}>{t.indikator}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sasaran Terkait</label>
              <input type="text" value={formRisk.sasaranKgt} readOnly className="w-full p-3 text-sm border border-slate-200/50 rounded-xl bg-slate-100/50 text-slate-500 font-medium" />
            </div>
          </div>
          <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Permasalahan</label><textarea required rows="2" value={formRisk.permasalahan} onChange={(e) => setFormRisk({...formRisk, permasalahan: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Deskripsikan masalah secara umum..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pernyataan Risiko</label><textarea required rows="2" value={formRisk.pernyataanRisiko} onChange={(e) => {
              const val = e.target.value;
              setFormRisk(prev => ({ ...prev, pernyataanRisiko: val, sisaRisiko: prev.penilaianPengendalian === 'Belum Memadai' ? val : prev.sisaRisiko }));
            }} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800" placeholder="Rumusan risiko definitif..." /></div>
            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori Risiko</label><select required value={formRisk.kategoriRisiko} onChange={(e) => setFormRisk({...formRisk, kategoriRisiko: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800"><option value="Operasional">Operasional</option><option value="Kepatuhan">Kepatuhan</option><option value="Strategis">Strategis</option><option value="Fraud">Fraud</option></select></div>
            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pemilik Risiko</label><input required type="text" value={formRisk.pemilikRisiko} onChange={(e) => setFormRisk({...formRisk, pemilikRisiko: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Nama/Jabatan pemilik..." /></div>
          </div>
          
          <div className="p-4 bg-white/40 rounded-xl border border-white/60 space-y-4">
            <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest border-b border-slate-200/50 pb-2">Analisis Penyebab</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required type="text" value={formRisk.penyebabUraian} onChange={(e) => setFormRisk({...formRisk, penyebabUraian: e.target.value})} placeholder="Uraian Penyebab" className="p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all" />
              <input required type="text" value={formRisk.penyebabSumber} onChange={(e) => setFormRisk({...formRisk, penyebabSumber: e.target.value})} placeholder="Sumber Penyebab (Eksternal/Internal)" className="p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all" />
              <select value={formRisk.sifatKontrol} onChange={(e) => setFormRisk({...formRisk, sifatKontrol: e.target.value})} className="p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all font-medium text-slate-700"><option value="Controllable">Controllable (Dapat Dikendalikan)</option><option value="Uncontrollable">Uncontrollable (Sulit Dikendalikan)</option></select>
            </div>
          </div>
          
          <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-100/50 space-y-4">
            <h4 className="text-[11px] font-bold text-rose-500 uppercase tracking-widest border-b border-rose-200/50 pb-2">Analisis Dampak</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="text" value={formRisk.dampakUraian} onChange={(e) => setFormRisk({...formRisk, dampakUraian: e.target.value})} placeholder="Uraian Dampak jika risiko terjadi..." className="p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all" />
              <input required type="text" value={formRisk.dampakPihak} onChange={(e) => setFormRisk({...formRisk, dampakPihak: e.target.value})} placeholder="Pihak yang Terkena Dampak..." className="p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pengendalian Eksisting</label>
              <textarea required rows="2" value={formRisk.pengendalianRisiko} onChange={(e) => setFormRisk({...formRisk, pengendalianRisiko: e.target.value})} placeholder="Pengendalian yang sudah ada saat ini..." className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Penilaian Pengendalian</label>
              <select required value={formRisk.penilaianPengendalian || ''} onChange={(e) => {
                const val = e.target.value;
                setFormRisk(prev => ({
                  ...prev,
                  penilaianPengendalian: val,
                  sisaRisiko: val === 'Memadai' ? '-' : (val === 'Belum Memadai' ? prev.pernyataanRisiko : '')
                }));
              }} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-800">
                <option value="">-- Pilih Penilaian --</option>
                <option value="Memadai">Sudah Memadai</option>
                <option value="Belum Memadai">Belum Memadai</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sisa Risiko (Otomatis)</label>
              <textarea required rows="2" value={formRisk.sisaRisiko} onChange={(e) => setFormRisk({...formRisk, sisaRisiko: e.target.value})} placeholder="Sisa risiko..." className="w-full p-3 text-sm border border-slate-200/50 rounded-xl bg-slate-100/50 text-slate-500 font-medium outline-none" readOnly />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
            {editRiskId && <button type="button" onClick={() => setEditRiskId(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>}
            <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> {editRiskId ? 'Update Risiko' : 'Simpan Identifikasi'}</button>
          </div>
        </form>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-white/40 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/60">
                  <th className="p-4 w-16 text-center">ID</th>
                  <th className="p-4">Sasaran {isEselon1 ? 'Program' : 'Kegiatan'}</th>
                  <th className="p-4">Indikator Sasaran (IKU)</th>
                  <th className="p-4">Pernyataan Risiko</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Kendali</th>
                  <th className="p-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 text-[13px]">
                {unitRisks.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400 text-center">{item.id}</td>
                    <td className="p-4 text-slate-600 font-medium leading-relaxed">{item.sasaranKgt}</td>
                    <td className="p-4 text-emerald-700 font-bold leading-relaxed">{item.indikatorKgt}</td>
                    <td className="p-4 font-bold text-slate-800 leading-relaxed">{item.pernyataanRisiko}</td>
                    <td className="p-4"><span className="bg-white/60 border border-white text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold">{item.kategoriRisiko}</span></td>
                    <td className="p-4"><span className="text-slate-500 font-medium">{item.sifatKontrol}</span></td>
                    <td className="p-4 text-center space-x-1 whitespace-nowrap">
                      <button type="button" onClick={() => handleEditRisk(item)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer" title="Edit"><Edit size={14}/></button>
                      <button type="button" onClick={() => handleDeleteRisk(item.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {unitRisks.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic font-medium">Belum ada risiko yang diidentifikasi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const AnalisisEvaluasi = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const [localRisks, setLocalRisks] = useState([]);
    useEffect(() => { setLocalRisks(unitRisks); }, [risks]);

    const handleSelectChange = (id, field, value) => {
      setLocalRisks(localRisks.map(r => r.id === id ? { ...r, [field]: parseInt(value) } : r));
    };

    const handleSaveAnalisis = (id) => {
      showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan analisis & evaluasi risiko ini?', async () => {
        const risk = localRisks.find(r => r.id === id);
        const skor = calculateSkorRisiko(risk.kemungkinan, risk.keparahan);
        const levelRisiko = calculateLevelRisiko(skor);
        const keputusanMitigasi = skor > 12 ? "Dimitigasi" : "Tidak Dimitigasi";
        const updatedRisk = { ...risk, kemungkinan: risk.kemungkinan, keparahan: risk.keparahan, skor, levelRisiko, keputusanMitigasi, tahap: 'analisis' };
        try { if (db) await setDoc(getDocRef('risks', id), updatedRisk); } catch(e) {}
        
        setRisks(prev => prev.map(r => r.id === id ? updatedRisk : r));
        showAlert('Berhasil', 'Analisis risiko berhasil disimpan!', 'success');
      });
    };

    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">3. Analisis K/D</h2><p className="text-xs text-slate-500 mt-1 font-medium">Evaluasi tingkat kemungkinan dan dampak tiap risiko.</p></div>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm">Formulir Skala Kemungkinan & Dampak</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-white/30 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200/60">
                  <th className="p-4 w-16 text-center">ID</th>
                  <th className="p-4 w-60">Pernyataan Risiko</th>
                  <th className="p-4 w-32 text-center text-emerald-700">K (1-5)</th>
                  <th className="p-4 w-32 text-center text-emerald-700">D (1-5)</th>
                  <th className="p-4 w-28 text-center">Skor</th>
                  <th className="p-4 w-36 text-center">Level</th>
                  <th className="p-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 text-[13px]">
                {localRisks.map((risk) => {
                  const s = calculateSkorRisiko(risk.kemungkinan, risk.keparahan);
                  const l = calculateLevelRisiko(s);
                  return (
                    <tr key={risk.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-4 font-bold text-slate-400 text-center">{risk.id}</td>
                      <td className="p-4 font-bold text-slate-800 leading-relaxed">{risk.pernyataanRisiko}</td>
                      <td className="p-4 text-center"><select value={risk.kemungkinan || 0} onChange={(e) => handleSelectChange(risk.id, 'kemungkinan', e.target.value)} className="p-2.5 w-16 text-center border border-white/60 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 font-bold text-emerald-800 bg-white/60"><option value="0">-</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></td>
                      <td className="p-4 text-center"><select value={risk.keparahan || 0} onChange={(e) => handleSelectChange(risk.id, 'keparahan', e.target.value)} className="p-2.5 w-16 text-center border border-white/60 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 font-bold text-emerald-800 bg-white/60"><option value="0">-</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></td>
                      <td className="p-4 text-center font-extrabold text-lg text-slate-700">{s > 0 ? s : '-'}</td>
                      <td className="p-4 text-center">{s > 0 ? <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusColor(l)}`}>{l}</span> : <span className="text-slate-300">-</span>}</td>
                      <td className="p-4 text-center"><button type="button" onClick={() => handleSaveAnalisis(risk.id)} className="bg-white/80 text-emerald-700 px-4 py-2 rounded-xl border border-white font-bold text-xs hover:bg-emerald-700 hover:text-white transition-colors cursor-pointer shadow-sm hover:shadow-emerald-700/20 active:scale-95">Simpan</button></td>
                    </tr>
                  );
                })}
                {localRisks.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic font-medium">Belum ada risiko untuk dianalisis.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden mt-8">
          <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm">Pratinjau Tabel Analisis & Evaluasi Risiko</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-white/30 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200/60">
                  <th className="p-4 w-16 text-center">ID</th>
                  <th className="p-4">Pernyataan Risiko</th>
                  <th className="p-4 text-center w-20">K</th>
                  <th className="p-4 text-center w-20">D</th>
                  <th className="p-4 text-center w-24">Skor</th>
                  <th className="p-4 text-center w-36">Level Risiko</th>
                  <th className="p-4 text-center w-40">Keputusan Mitigasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 text-[13px]">
                {unitRisks.filter(r => r.skor > 0).map(r => (
                  <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400 text-center">{r.id}</td>
                    <td className="p-4 font-bold text-slate-800 leading-relaxed">{r.pernyataanRisiko}</td>
                    <td className="p-4 text-center font-extrabold text-slate-600">{r.kemungkinan}</td>
                    <td className="p-4 text-center font-extrabold text-slate-600">{r.keparahan}</td>
                    <td className="p-4 text-center font-extrabold text-lg text-slate-800">{r.skor}</td>
                    <td className="p-4 text-center"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusColor(r.levelRisiko)}`}>{r.levelRisiko}</span></td>
                    <td className="p-4 text-center font-bold text-slate-700">{r.keputusanMitigasi}</td>
                  </tr>
                ))}
                {unitRisks.filter(r => r.skor > 0).length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic font-medium">Belum ada risiko yang telah dinilai skornya.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const PenangananRisiko = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun && r.keputusanMitigasi === "Dimitigasi");
    const [editingRtpId, setEditingRtpId] = useState(null);
    const [editForm, setEditForm] = useState({ rtp: '', penanggungJawab: '', targetWaktu: '', komunikasi: '' });

    const handleStartEdit = (risk) => {
      setEditingRtpId(risk.id);
      setEditForm({
        rtp: risk.rtp || '',
        penanggungJawab: risk.penanggungJawab || '',
        targetWaktu: risk.targetWaktu || '',
        komunikasi: risk.komunikasi || ''
      });
    };

    const handleSaveRTP = (id) => { 
      showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin memperbarui RTP ini?', async () => {
        const risk = risks.find(r => r.id === id); 
        const updated = { ...risk, ...editForm, tahap: 'selesai' };
        try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
        setRisks(prev => prev.map(r => r.id === id ? updated : r));
        setEditingRtpId(null);
        showAlert('Berhasil', 'RTP berhasil diperbarui!', 'success'); 
      });
    };

    const handleDeleteRTP = (id) => {
      showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin mengosongkan Rencana Tindak Pengendalian ini?', async () => {
        const risk = risks.find(r => r.id === id);
        const updated = { ...risk, rtp: '', penanggungJawab: '', targetWaktu: '', komunikasi: '' };
        try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
        setRisks(prev => prev.map(r => r.id === id ? updated : r));
        if (editingRtpId === id) setEditingRtpId(null);
        showAlert('Berhasil', 'RTP berhasil dikosongkan.', 'success');
      });
    };

    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">4. Rencana Tindak Pengendalian</h2></div>

        {unitRisks.length > 0 ? (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm">Tabel Rencana Tindak Pengendalian (RTP)</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead>
                  <tr className="bg-white/30 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200/60">
                    <th className="p-4 w-16 text-center">ID</th>
                    <th className="p-4 w-64 text-left align-top">Pernyataan Risiko</th>
                    <th className="p-4 w-32 text-left align-top">Skor / Level</th>
                    <th className="p-4 text-left align-top">Rencana Tindak Pengendalian (RTP)</th>
                    <th className="p-4 w-40 text-left align-top">Penanggung Jawab</th>
                    <th className="p-4 w-32 text-left align-top">Target Waktu</th>
                    <th className="p-4 w-40 text-left align-top">Komunikasi</th>
                    <th className="p-4 text-center w-28 align-top">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 text-[13px]">
                  {unitRisks.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-4 font-bold text-center text-slate-400 align-top">{item.id}</td>
                      <td className="p-4 font-bold text-slate-800 leading-relaxed align-top">{item.pernyataanRisiko}</td>
                      <td className="p-4 align-top">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${getStatusColor(item.levelRisiko)}`}>{item.skor} ({item.levelRisiko})</span>
                      </td>
                      <td className="p-4 text-emerald-700 font-semibold leading-relaxed align-top">{item.rtp || <span className="text-slate-400/70 italic font-medium">Belum diisi</span>}</td>
                      <td className="p-4 font-medium text-slate-700 align-top">{item.penanggungJawab || <span className="text-slate-400/70 italic">-</span>}</td>
                      <td className="p-4 font-medium text-slate-700 align-top">{item.targetWaktu || <span className="text-slate-400/70 italic">-</span>}</td>
                      <td className="p-4 font-medium text-slate-700 align-top">{item.komunikasi || <span className="text-slate-400/70 italic">-</span>}</td>
                      <td className="p-4 text-center space-x-1 whitespace-nowrap align-top">
                        <button type="button" onClick={() => handleStartEdit(item)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 transition-colors" title="Edit"><Edit size={14}/></button>
                        <button type="button" onClick={() => handleDeleteRTP(item.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <ShieldCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Belum ada risiko yang diputuskan untuk "Dimitigasi" pada tahap Analisis & Evaluasi.</p>
          </div>
        )}

        {editingRtpId && (
          <div className="glass-panel p-6 rounded-2xl border-2 border-emerald-200/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit size={16} className="text-emerald-600" /> Form Edit RTP: <span className="text-emerald-800">{risks.find(r => r.id === editingRtpId)?.pernyataanRisiko}</span>
              </h3>
              <button onClick={() => setEditingRtpId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer bg-white/60 p-1.5 rounded-lg hover:bg-white transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">RTP</label><textarea value={editForm.rtp} onChange={(e) => setEditForm({...editForm, rtp: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 min-h-[100px]" placeholder="Uraikan rencana tindak pengendalian..." /></div>
              <div className="space-y-5">
                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Penanggung Jawab</label><input type="text" value={editForm.penanggungJawab} onChange={(e) => setEditForm({...editForm, penanggungJawab: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Nama / Jabatan Penanggung Jawab..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Target Waktu</label><input type="text" value={editForm.targetWaktu} onChange={(e) => setEditForm({...editForm, targetWaktu: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Misal: TW 1 / Juli..." /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Komunikasi</label><input type="text" value={editForm.komunikasi} onChange={(e) => setEditForm({...editForm, komunikasi: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Media/Cara komunikasi..." /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
              <button type="button" onClick={() => setEditingRtpId(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={() => handleSaveRTP(editingRtpId)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex gap-2 items-center shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> Simpan Perubahan</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PemantauanRisiko = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun && r.keputusanMitigasi === "Dimitigasi");
    const [editingPemantauanId, setEditingPemantauanId] = useState(null);
    const [editForm, setEditForm] = useState({ prosesRtp: '', linkEviden: '' });

    const handleStartEdit = (risk) => {
      setEditingPemantauanId(risk.id);
      setEditForm({
        prosesRtp: risk.prosesRtp || '',
        linkEviden: risk.linkEviden || ''
      });
    };

    const handleSavePemantauan = (id) => { 
      showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan progres pemantauan ini?', async () => {
        const risk = risks.find(r => r.id === id); 
        const updated = { ...risk, ...editForm };
        try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
        setRisks(prev => prev.map(r => r.id === id ? updated : r));
        setEditingPemantauanId(null);
        showAlert('Berhasil', 'Progres berhasil disimpan!', 'success'); 
      });
    };
    
    const handleDeletePemantauan = (id) => {
      showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin mengosongkan progres pemantauan dan link eviden?', async () => {
        const risk = risks.find(r => r.id === id);
        const updated = { ...risk, prosesRtp: '', linkEviden: '' };
        try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
        setRisks(prev => prev.map(r => r.id === id ? updated : r));
        if (editingPemantauanId === id) setEditingPemantauanId(null);
        showAlert('Berhasil', 'Progres berhasil dikosongkan.', 'success');
      });
    };

    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">5. Pemantauan RTP & Eviden</h2></div>

        {unitRisks.length > 0 ? (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm">Tabel Pemantauan RTP</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-white/30 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200/60">
                    <th className="p-4 w-16 text-center">ID</th>
                    <th className="p-4 w-72 text-left align-top">Pernyataan Risiko</th>
                    <th className="p-4 text-left align-top">Progres Pelaksanaan RTP</th>
                    <th className="p-4 w-60 text-left align-top">Tautan (Link) Eviden</th>
                    <th className="p-4 text-center w-24 align-top">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 text-[13px]">
                  {unitRisks.map(r => (
                    <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-4 font-bold text-center text-slate-400 align-top">{r.id}</td>
                      <td className="p-4 font-bold text-slate-800 leading-relaxed align-top">{r.pernyataanRisiko}</td>
                      <td className="p-4 font-medium text-slate-700 leading-relaxed align-top">{r.prosesRtp || <span className="text-slate-400/70 italic">Belum ada progres dilaporkan.</span>}</td>
                      <td className="p-4 align-top">
                        {r.linkEviden ? (
                          <a href={r.linkEviden.startsWith('http') ? r.linkEviden : `https://${r.linkEviden}`} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline truncate block w-48 text-[11px] bg-white/60 p-1.5 rounded-md border border-white">
                            Buka Tautan &rarr;
                          </a>
                        ) : (
                          <span className="text-slate-400/70 italic text-[11px] font-medium">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center space-x-1 whitespace-nowrap align-top">
                        <button type="button" onClick={() => handleStartEdit(r)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 transition-colors" title="Update Progres"><Edit size={14}/></button>
                        <button type="button" onClick={() => handleDeletePemantauan(r.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus Progres"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <Activity size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Belum ada risiko yang diputuskan untuk "Dimitigasi".</p>
          </div>
        )}

        {editingPemantauanId && (
          <div className="glass-panel p-6 rounded-2xl border-2 border-emerald-200/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit size={16} className="text-emerald-600" /> Update Progres: <span className="text-emerald-800">{risks.find(r => r.id === editingPemantauanId)?.pernyataanRisiko}</span>
              </h3>
              <button onClick={() => setEditingPemantauanId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer bg-white/60 p-1.5 rounded-lg hover:bg-white transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Proses / Progres Pelaksanaan RTP</label><textarea rows="3" value={editForm.prosesRtp} onChange={(e) => setEditForm({...editForm, prosesRtp: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Ceritakan progres penanganan..." /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tautan (Link) Dokumen Eviden</label><input type="url" value={editForm.linkEviden} onChange={(e) => setEditForm({...editForm, linkEviden: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="https://drive.google.com/..." /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
              <button type="button" onClick={() => setEditingPemantauanId(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={() => handleSavePemantauan(editingPemantauanId)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex gap-2 items-center shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> Simpan Progres</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PencatatanKeterjadian = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const unitKejadian = kejadianList.filter(k => k.unit === currentUser.nama && k.tahun === currentUser.tahun);
    const [editKejadianId, setEditKejadianId] = useState(null);
    const [formKejadian, setFormKejadian] = useState({ riskId: unitRisks[0]?.id || '', tanggal: '', kronologi: '', penyebab: '', dampakRiil: '' });
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleOpenEdit = (item) => {
      setEditKejadianId(item.id);
      setFormKejadian({ riskId: item.riskId || unitRisks[0]?.id || '', tanggal: item.tanggal || '', kronologi: item.kronologi || '', penyebab: item.penyebab || '', dampakRiil: item.dampakRiil || '' });
      setIsFormOpen(true);
    };

    const handleOpenAdd = () => {
      setEditKejadianId(null);
      setFormKejadian({ riskId: unitRisks[0]?.id || '', tanggal: '', kronologi: '', penyebab: '', dampakRiil: '' });
      setIsFormOpen(true);
    };

    const handleSaveKejadian = async (e) => {
      e.preventDefault();
      showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan pencatatan keterjadian risiko ini?', async () => {
        const riskObj = unitRisks.find(r => r.id === formKejadian.riskId);
        const newId = editKejadianId || `KJG-${Date.now()}`;
        const newEntry = { id: newId, unit: currentUser.nama, tahun: currentUser.tahun, risiko: riskObj?.pernyataanRisiko || '-', ...formKejadian };
        try { if (db) await setDoc(getDocRef('kejadian', newId), newEntry); } catch(e) {}
        
        setKejadianList(prev => {
          const exists = prev.some(k => k.id === newId);
          if (exists) return prev.map(k => k.id === newId ? newEntry : k);
          return [newEntry, ...prev];
        });

        setIsFormOpen(false);
        setEditKejadianId(null);
        showAlert('Berhasil', 'Pencatatan keterjadian berhasil disimpan!', 'success');
      });
    };

    const handleDeleteKejadian = async (id) => { 
      showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus pencatatan keterjadian risiko ini?', async () => {
        try { if (db) await deleteDoc(getDocRef('kejadian', id)); } catch(e) {}
        setKejadianList(prev => prev.filter(k => k.id !== id));
        if (editKejadianId === id) setIsFormOpen(false);
        showAlert('Berhasil', 'Pencatatan keterjadian berhasil dihapus.', 'success');
      });
    };

    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/60 pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">6. Pencatatan Keterjadian</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Rekam insiden risiko riil di tahun berjalan.</p>
          </div>
          {!isFormOpen && (
            <button onClick={handleOpenAdd} className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all">
              <Plus size={16} /> Rekam Kejadian Baru
            </button>
          )}
        </div>

        {isFormOpen && (
          <form onSubmit={handleSaveKejadian} className="glass-panel p-6 rounded-2xl border-2 border-emerald-200/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {editKejadianId ? <Edit size={16} className="text-emerald-600" /> : <PlusCircle size={16} className="text-emerald-600" />}
                {editKejadianId ? 'Edit Pencatatan Keterjadian' : 'Form Rekam Keterjadian Risiko'}
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer bg-white/60 p-1.5 rounded-lg hover:bg-white transition-colors"><X size={16} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Risiko Terkait</label>
                <select required value={formKejadian.riskId} onChange={(e) => setFormKejadian({...formKejadian, riskId: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-bold text-slate-700">
                  {unitRisks.map(r => <option key={r.id} value={r.id}>{r.id} - {r.pernyataanRisiko}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Kejadian</label>
                <input required type="date" value={formKejadian.tanggal} onChange={(e) => setFormKejadian({...formKejadian, tanggal: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50 font-medium text-slate-700" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kronologi Kejadian</label>
                <textarea required rows="2" value={formKejadian.kronologi} onChange={(e) => setFormKejadian({...formKejadian, kronologi: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Uraikan urutan peristiwa secara detail..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Akar Penyebab Riil</label>
                <textarea required rows="2" value={formKejadian.penyebab} onChange={(e) => setFormKejadian({...formKejadian, penyebab: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all bg-white/50" placeholder="Apa penyebab sesungguhnya dari kejadian ini?" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-2">Dampak Aktual / Riil</label>
                <textarea required rows="2" value={formKejadian.dampakRiil} onChange={(e) => setFormKejadian({...formKejadian, dampakRiil: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl outline-none focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all bg-rose-50/50" placeholder="Dampak nyata yang dialami (waktu/biaya/reputasi)..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex gap-2 items-center shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> {editKejadianId ? 'Update Kejadian' : 'Simpan Kejadian'}</button>
            </div>
          </form>
        )}

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-white/30 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200/60">
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4 w-32 text-center text-emerald-700">Tanggal Kejadian</th>
                  <th className="p-4 w-64">Pernyataan Risiko</th>
                  <th className="p-4">Kronologi & Penyebab</th>
                  <th className="p-4 w-64 text-rose-500">Dampak Riil</th>
                  <th className="p-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 text-[13px]">
                {unitKejadian.map((k, index) => (
                  <tr key={k.id} className="hover:bg-emerald-50/40 align-top transition-colors">
                    <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="p-4 text-center font-bold text-emerald-800"><span className="bg-white/60 px-2.5 py-1 rounded-md border border-white block">{k.tanggal || '-'}</span></td>
                    <td className="p-4 font-bold text-slate-800 leading-relaxed">{k.risiko}</td>
                    <td className="p-4 space-y-2">
                      <div><strong className="text-[10px] uppercase text-slate-400/80 tracking-wider block mb-0.5">Kronologi:</strong> <span className="text-slate-700 font-medium">{k.kronologi || '-'}</span></div>
                      <div><strong className="text-[10px] uppercase text-slate-400/80 tracking-wider block mb-0.5">Penyebab:</strong> <span className="text-slate-700 font-medium">{k.penyebab || '-'}</span></div>
                    </td>
                    <td className="p-4 text-rose-700 font-semibold leading-relaxed">{k.dampakRiil || '-'}</td>
                    <td className="p-4 text-center space-x-1 whitespace-nowrap">
                      <button type="button" onClick={() => handleOpenEdit(k)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 transition-colors" title="Edit"><Edit size={14}/></button>
                      <button type="button" onClick={() => handleDeleteKejadian(k.id)} className="p-2 bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {unitKejadian.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-medium">Belum ada insiden atau pencatatan keterjadian.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const EfektivitasRTP = () => {
    const unitKejadian = kejadianList.filter(k => k.unit === currentUser.nama && k.tahun === currentUser.tahun);
    const matchedRiskIds = Array.from(new Set(unitKejadian.map(k => k.riskId).filter(Boolean)));
    const matchedRiskTexts = Array.from(new Set(unitKejadian.map(k => k.risiko).filter(Boolean)));

    const unitRisks = risks.filter(r => 
      r.unit === currentUser.nama && 
      r.tahun === currentUser.tahun && 
      (matchedRiskIds.includes(r.id) || matchedRiskTexts.includes(r.pernyataanRisiko))
    );

    const [editingEfektivitasId, setEditingEfektivitasId] = useState(null);
    const [editForm, setEditForm] = useState({ kDiharapkan: 3, dDiharapkan: 3, kActual: 3, dActual: 3, kondisiSetelahMitigasi: '', langkahPerbaikan: '' });

    const handleStartEdit = (item) => {
      setEditingEfektivitasId(item.id);
      setEditForm({
        kDiharapkan: item.kDiharapkan || 3,
        dDiharapkan: item.dDiharapkan || 3,
        kActual: item.kActual || 3,
        dActual: item.dActual || 3,
        kondisiSetelahMitigasi: item.kondisiSetelahMitigasi || '',
        langkahPerbaikan: item.langkahPerbaikan || ''
      });
    };

    const handleSaveEv = (riskId, isExistingId = null) => {
      showConfirm('Konfirmasi Simpan', 'Apakah Anda yakin ingin menyimpan penilaian efektifitas RTP ini?', async () => {
        const targetId = isExistingId || `EFK-${riskId}`;
        const riskObj = risks.find(r => r.id === riskId);
        const srAwal = riskObj ? (riskObj.skor || 0) : 0;
        const srDiharapkan = calculateSkorRisiko(parseInt(editForm.kDiharapkan), parseInt(editForm.dDiharapkan));
        const srActual = calculateSkorRisiko(parseInt(editForm.kActual), parseInt(editForm.dActual));
        const deviasi = srDiharapkan - srActual;

        if (srActual <= srDiharapkan && riskObj) {
          const nextYear = (parseInt(currentUser.tahun) + 1).toString();
          const carriedOverRisk = risks.find(r => 
            r.pernyataanRisiko === riskObj.pernyataanRisiko && 
            r.tahun === nextYear && 
            r.unit === riskObj.unit && 
            r.status === "Lanjutan Tahun Sebelumnya"
          );
          
          if (carriedOverRisk) {
            try { 
              if (db) await deleteDoc(getDocRef('risks', carriedOverRisk.id)); 
              setRisks(prev => prev.filter(r => r.id !== carriedOverRisk.id));
            } catch(e) {}
          }
        }
        
        const newEntry = { 
          id: targetId, 
          riskId: riskId, 
          pernyataanRisiko: riskObj ? riskObj.pernyataanRisiko : '-', 
          srAwal, 
          srDiharapkan, 
          srActual, 
          deviasi, 
          ...editForm 
        };

        try { if (db) await setDoc(getDocRef('efektivitas', targetId), newEntry); } catch(e) {}
        
        setRiwayatEfektivitas(prev => {
          const exists = prev.some(e => e.id === targetId);
          if (exists) return prev.map(e => e.id === targetId ? newEntry : e);
          return [newEntry, ...prev];
        });

        setEditingEfektivitasId(null);
        showAlert('Berhasil', 'Penilaian efektifitas disimpan!', 'success');
      });
    };

    const handleDeleteEv = async (id) => { 
      showConfirm('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus penilaian efektifitas ini?', async () => {
        try { if (db) await deleteDoc(getDocRef('efektivitas', id)); } catch(e) {}
        setRiwayatEfektivitas(prev => prev.filter(e => e.id !== id));
        if (editingEfektivitasId === id) setEditingEfektivitasId(null);
        showAlert('Berhasil', 'Penilaian efektifitas berhasil dihapus.', 'success');
      });
    };

    const handleTeruskanRisiko = async (ev) => {
      const nextYear = (parseInt(currentUser.tahun) + 1).toString();
      const originalRisk = risks.find(r => r.id === ev.riskId);
      
      if (!originalRisk) return showAlert('Gagal', 'Risiko asal tidak ditemukan.', 'error');

      const isAlreadyCarriedOver = risks.some(r => r.pernyataanRisiko === originalRisk.pernyataanRisiko && r.tahun === nextYear && r.unit === originalRisk.unit);

      if (isAlreadyCarriedOver) {
        return showAlert('Peringatan', `Risiko ini sudah pernah diteruskan ke tahun ${nextYear}.`, 'warning');
      }

      showConfirm(
        'Jadikan Risiko Tahun Berikutnya', 
        `Nilai Aktual (${ev.srActual}) lebih tinggi dari Target (${ev.srDiharapkan}). Yakin ingin menjadikan ini sebagai risiko di tahun ${nextYear} dengan memuat nilai K, D, dan Skala aktual?`,
        async () => {
          const newRiskId = `RSK-${Date.now()}`;
          const newRisk = {
            ...originalRisk,
            id: newRiskId,
            tahun: nextYear,
            tahap: 'identifikasi',
            kemungkinan: parseInt(ev.kActual) || 0,
            keparahan: parseInt(ev.dActual) || 0,
            skor: ev.srActual || 0,
            levelRisiko: calculateLevelRisiko(ev.srActual),
            status: "Lanjutan Tahun Sebelumnya",
            keputusanMitigasi: (ev.srActual || 0) > 12 ? "Dimitigasi" : "Tidak Dimitigasi",
            rtp: "",
            prosesRtp: "",
            linkEviden: "",
            penanggungJawab: "",
            targetWaktu: "",
            komunikasi: ""
          };

          try {
            if (db) await setDoc(getDocRef('risks', newRiskId), newRisk);
            setRisks(prev => [newRisk, ...prev]);
            showAlert('Berhasil', `Risiko berhasil diteruskan ke tahun ${nextYear}. Silakan login di tahun tersebut untuk melihatnya.`, 'success');
          } catch (err) {
            showAlert('Error', 'Gagal meneruskan data risiko.', 'error');
          }
        }
      );
    };

    const unitEfektivitas = riwayatEfektivitas.filter(e => { 
      const r = risks.find(x => x.id === e.riskId); 
      return r && r.unit === currentUser.nama && r.tahun === currentUser.tahun && (matchedRiskIds.includes(e.riskId) || matchedRiskTexts.includes(r.pernyataanRisiko)); 
    });

    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">7. Efektifitas RTP</h2><p className="text-xs text-slate-500 mt-1 font-medium">Ukur sejauh mana tindakan mitigasi menurunkan level risiko riil.</p></div>
        
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 bg-white/40 border-b border-slate-200/50"><h3 className="font-bold text-slate-800 text-sm">Tabel Penilaian Efektifitas & Deviasi RTP</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-white/30 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200/60">
                  <th className="p-4 w-20 text-center">Risk ID</th>
                  <th className="p-4 w-72">Pernyataan Risiko</th>
                  <th className="p-4 text-center w-24">Skor Awal</th>
                  <th className="p-4 text-center w-24 text-emerald-600">Skor Target</th>
                  <th className="p-4 text-center w-24 text-sky-500">Skor Aktual</th>
                  <th className="p-4 text-center w-24">Deviasi</th>
                  <th className="p-4 text-center w-36">Status & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 text-[13px]">
                {unitEfektivitas.map(e => (
                  <tr key={e.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400 text-center">{e.riskId}</td>
                    <td className="p-4 font-bold text-slate-800 leading-relaxed">{e.pernyataanRisiko}</td>
                    <td className="p-4 text-center font-extrabold text-slate-500">{e.srAwal}</td>
                    <td className="p-4 text-center font-extrabold text-emerald-700">{e.srDiharapkan}</td>
                    <td className="p-4 text-center font-extrabold text-sky-600">{e.srActual}</td>
                    <td className="p-4 text-center font-extrabold text-emerald-600">{e.deviasi}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        {e.srActual <= e.srDiharapkan ? (
                          <span className="px-3 py-1.5 bg-emerald-50/80 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200/60 w-full text-center backdrop-blur-sm">✅ Efektif</span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleTeruskanRisiko(e)} 
                            className="px-2 py-1.5 bg-amber-50/80 text-amber-700 rounded-lg cursor-pointer border border-amber-200/60 hover:bg-amber-100 flex items-center justify-center gap-1 text-[10px] font-bold w-full whitespace-nowrap transition-colors backdrop-blur-sm" 
                            title={`Jadikan Risiko di Tahun ${parseInt(currentUser.tahun) + 1}`}
                          >
                            <Calendar size={12} /> Teruskan ke {parseInt(currentUser.tahun) + 1}
                          </button>
                        )}
                        <div className="flex gap-1.5 justify-center w-full">
                          <button type="button" onClick={() => handleStartEdit(e)} className="p-1.5 w-full flex justify-center bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 transition-colors" title="Edit"><Edit size={14}/></button>
                          <button type="button" onClick={() => handleDeleteEv(e.id)} className="p-1.5 w-full flex justify-center bg-white/60 border border-white text-slate-500 rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {unitEfektivitas.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic font-medium">Belum ada riwayat penilaian efektifitas RTP.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingEfektivitasId ? (
          <div className="glass-panel p-6 rounded-2xl border-2 border-emerald-200/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit size={16} className="text-emerald-600" /> Form Edit Penilaian Efektifitas: <span className="text-emerald-800">{unitEfektivitas.find(e => e.id === editingEfektivitasId)?.pernyataanRisiko}</span>
              </h3>
              <button onClick={() => setEditingEfektivitasId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer bg-white/60 p-1.5 rounded-lg hover:bg-white transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/40 p-5 rounded-2xl border border-white">
              <div>
                <p className="text-[11px] font-bold mb-3 text-slate-500 uppercase tracking-wider">Target (K &times; D)</p>
                <div className="flex gap-2">
                  <select value={editForm.kDiharapkan} onChange={(e) => setEditForm({...editForm, kDiharapkan: e.target.value})} className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 outline-none font-bold text-emerald-800">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                  <select value={editForm.dDiharapkan} onChange={(e) => setEditForm({...editForm, dDiharapkan: e.target.value})} className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 outline-none font-bold text-emerald-800">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold mb-3 text-slate-500 uppercase tracking-wider">Aktual / Riil (K &times; D)</p>
                <div className="flex gap-2">
                  <select value={editForm.kActual} onChange={(e) => setEditForm({...editForm, kActual: e.target.value})} className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sky-700">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                  <select value={editForm.dActual} onChange={(e) => setEditForm({...editForm, dActual: e.target.value})} className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sky-700">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kondisi Setelah Mitigasi</label><textarea rows="2" value={editForm.kondisiSetelahMitigasi} onChange={(e) => setEditForm({...editForm, kondisiSetelahMitigasi: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all" placeholder="Uraikan kondisi nyata..." /></div>
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Langkah Perbaikan (Jika Gagal)</label><textarea rows="2" value={editForm.langkahPerbaikan} onChange={(e) => setEditForm({...editForm, langkahPerbaikan: e.target.value})} className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all" placeholder="Rencana korektif..." /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
              <button type="button" onClick={() => setEditingEfektivitasId(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/60 border border-slate-200/60 text-slate-700 hover:bg-white transition-colors cursor-pointer">Batal</button>
              <button type="button" onClick={() => {
                const item = unitEfektivitas.find(e => e.id === editingEfektivitasId);
                if (item) handleSaveEv(item.riskId, item.id);
              }} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex gap-2 items-center shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> Update Penilaian</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-6 border-t border-slate-200/60">
            <h3 className="font-bold text-slate-800 text-sm">Tambah Penilaian Efektifitas Risiko (Dari Pencatatan Keterjadian)</h3>
            {unitRisks.length === 0 && (
              <p className="text-sm text-slate-400 italic font-medium p-6 glass-panel rounded-2xl text-center">Belum ada risiko yang tercatat di Pencatatan Keterjadian.</p>
            )}
            {unitRisks.map(risk => {
              const alreadyExists = unitEfektivitas.some(e => e.riskId === risk.id);
              if (alreadyExists) return null;
              return (
                <div key={risk.id} className="glass-panel p-6 rounded-2xl shadow-sm space-y-5 animate-in fade-in duration-300">
                  <h4 className="font-bold text-slate-900 border-b border-slate-200/50 pb-3">{risk.pernyataanRisiko} <span className="ml-2 text-[10px] font-bold text-slate-500 bg-white/60 px-2 py-1 rounded-md tracking-widest uppercase">Skor Awal: {risk.skor}</span></h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/30 p-5 rounded-2xl border border-white">
                    <div>
                      <p className="text-[11px] font-bold mb-3 text-slate-500 uppercase tracking-wider">Target (K &times; D)</p>
                      <div className="flex gap-2">
                        <select id={`kd_${risk.id}`} defaultValue="3" className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 outline-none font-bold text-emerald-800">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                        <select id={`dd_${risk.id}`} defaultValue="3" className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 outline-none font-bold text-emerald-800">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold mb-3 text-slate-500 uppercase tracking-wider">Aktual / Riil (K &times; D)</p>
                      <div className="flex gap-2">
                        <select id={`ka_${risk.id}`} defaultValue="3" className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sky-700">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                        <select id={`da_${risk.id}`} defaultValue="3" className="flex-1 p-2.5 border border-white/60 rounded-xl bg-white/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-sky-700">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kondisi Setelah Mitigasi</label><textarea id={`kondisi_${risk.id}`} rows="2" placeholder="Uraikan kondisi..." className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Langkah Perbaikan (Jika Gagal)</label><textarea id={`langkah_${risk.id}`} rows="2" placeholder="Rencana korektif..." className="w-full p-3 text-sm border border-white/60 rounded-xl bg-white/60 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10 transition-all" /></div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={() => {
                      const kD = document.getElementById(`kd_${risk.id}`).value;
                      const dD = document.getElementById(`dd_${risk.id}`).value;
                      const kA = document.getElementById(`ka_${risk.id}`).value;
                      const dA = document.getElementById(`da_${risk.id}`).value;
                      const kondisi = document.getElementById(`kondisi_${risk.id}`).value;
                      const langkah = document.getElementById(`langkah_${risk.id}`).value;
                      
                      setEditForm({ kDiharapkan: kD, dDiharapkan: dD, kActual: kA, dActual: dA, kondisiSetelahMitigasi: kondisi, langkahPerbaikan: langkah });
                      setTimeout(() => handleSaveEv(risk.id), 50);
                    }} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm flex gap-2 items-center font-bold shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all"><Save size={16} /> Simpan Penilaian</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const ModulLaporan = () => {
    const isEselon1 = currentUser.eselon === 'Eselon 1';
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const unitKejadian = kejadianList.filter(k => k.unit === currentUser.nama && k.tahun === currentUser.tahun);
    const unitEfektivitas = riwayatEfektivitas.filter(e => {
      const parentRisk = risks.find(r => r.id === e.riskId);
      return parentRisk && parentRisk.unit === currentUser.nama && parentRisk.tahun === currentUser.tahun;
    });

    const getFooterJabatan = (nama) => {
      if (!nama) return '';
      if (nama.toLowerCase().includes('sekretariat')) {
        const remaining = nama.replace(/sekretariat/gi, '').trim();
        return remaining ? `Sekretaris Badan ${remaining}` : 'Sekretaris Badan';
      }
      return `Kepala ${nama}`;
    };

    const footerJabatan = getFooterJabatan(currentUser?.nama);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const handleDownloadExcel = () => {
      try {
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        let html = '';

        if (subReportTab === 'peta_risiko') {
          html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"><style>.title{border:none;text-align:center;font-weight:bold;}.data{border:0.5pt solid black;vertical-align:top;padding:4px;}.head{border:0.5pt solid black;background:#f3f4f6;font-weight:bold;text-align:center;padding:4px;}.sign{border:none;text-align:right;}</style></head>
            <body>
              <table style="border-collapse:collapse;font-family:Arial;font-size:11px;">
                <tr><td colspan="16" class="title" style="font-size:14px;">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL RI</td></tr>
                <tr><td colspan="16" class="title" style="font-size:13px;">BADAN PENGEMBANGAN DAN INFORMASI</td></tr>
                <tr><td colspan="16" class="title" style="font-size:12px;color:#047857;">LAPORAN MATRIKS PETA RISIKO UNIT KERJA (${currentUser.nama.toUpperCase()})</td></tr>
                <tr><td colspan="16" class="title" style="font-size:11px;color:#6b7280;">TAHUN ANGGARAN ${currentUser.tahun}</td></tr>
                <tr><td colspan="16" style="border:none;"></td></tr>
                <tr>
          `;
          const headers = ['No', isEselon1 ? 'Sasaran Program' : 'Sasaran Kegiatan', isEselon1 ? 'Indikator Sasaran Program (IKU)' : 'Indikator Sasaran Kegiatan (IKU)', 'Risiko', 'Sumber Risiko', 'Kategori Risiko', 'Penyebab', 'Dampak', 'Pengendalian yang ada', 'Sisa Risiko', 'Pemilik Risiko', 'K', 'D', 'Skala Risiko', 'Level Risiko'];
          headers.forEach(h => { html += `<td class="head">${h}</td>`; });
          html += '</tr>';

          unitRisks.forEach((risk, index) => {
            html += `<tr>
              <td class="data" align="center">${index + 1}</td>
              <td class="data">${risk.sasaranKgt || '-'}</td>
              <td class="data">${risk.indikatorKgt || '-'}</td>
              <td class="data" style="font-weight:bold;">${risk.pernyataanRisiko || '-'}</td>
              <td class="data">${risk.penyebabSumber || '-'}</td>
              <td class="data">${risk.kategoriRisiko || '-'}</td>
              <td class="data">${risk.penyebabUraian || '-'}</td>
              <td class="data">${risk.dampakUraian || '-'}</td>
              <td class="data">${risk.pengendalianRisiko || '-'}</td>
              <td class="data">${risk.sisaRisiko || '-'}</td>
              <td class="data">${risk.pemilikRisiko || '-'}</td>
              <td class="data" align="center">${risk.kemungkinan || '-'}</td>
              <td class="data" align="center">${risk.keparahan || '-'}</td>
              <td class="data" align="center">${risk.skor > 0 ? risk.skor : '-'}</td>
              <td class="data" align="center">${risk.levelRisiko !== 'Belum Dianalisis' ? risk.levelRisiko : '-'}</td>
            </tr>`;
          });

          html += `
                <tr><td colspan="16" style="border:none;"></td></tr>
                <tr><td colspan="11" style="border:none;"></td><td colspan="5" class="sign">Jakarta, ${dateStr}</td></tr>
                <tr><td colspan="11" style="border:none;"></td><td colspan="5" class="sign">${footerJabatan}</td></tr>
                <tr><td colspan="16" style="border:none;"></td></tr><tr><td colspan="16" style="border:none;"></td></tr>
                <tr><td colspan="11" style="border:none;"></td><td colspan="5" class="sign" style="font-weight:bold;text-decoration:underline;">${currentUser.namaPimpinan || '......................................'}</td></tr>
                <tr><td colspan="11" style="border:none;"></td><td colspan="5" class="sign">NIP. ${currentUser.nipPimpinan || '......................................'}</td></tr>
              </table>
            </body></html>
          `;
        } else if (subReportTab === 'pemantauan_rtp') {
          html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"><style>.title{border:none;text-align:center;font-weight:bold;}.data{border:0.5pt solid black;vertical-align:top;padding:4px;}.head{border:0.5pt solid black;background:#f3f4f6;font-weight:bold;text-align:center;padding:4px;}.sign{border:none;text-align:right;}</style></head>
            <body>
              <table style="border-collapse:collapse;font-family:Arial;font-size:11px;">
                <tr><td colspan="7" class="title" style="font-size:14px;">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL RI</td></tr>
                <tr><td colspan="7" class="title" style="font-size:13px;">BADAN PENGEMBANGAN DAN INFORMASI</td></tr>
                <tr><td colspan="7" class="title" style="font-size:12px;color:#047857;">LAPORAN PEMANTAUAN RTP UNIT KERJA (${currentUser.nama.toUpperCase()})</td></tr>
                <tr><td colspan="7" class="title" style="font-size:11px;color:#6b7280;">TAHUN ANGGARAN ${currentUser.tahun}</td></tr>
                <tr><td colspan="7" style="border:none;"></td></tr>
                <tr style="background:#f3f4f6;font-weight:bold;">
                  <td class="head">No</td><td class="head">ID Risiko</td><td class="head">Pernyataan Risiko</td><td class="head">RTP Awal</td><td class="head">Proses RTP / Progres</td><td class="head">Link Eviden</td><td class="head">Level</td>
                </tr>
          `;
          const mitRisks = unitRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi');
          mitRisks.forEach((r, idx) => {
            html += `<tr>
              <td class="data" align="center">${idx + 1}</td>
              <td class="data" align="center">${r.id}</td>
              <td class="data" style="font-weight:bold;">${r.pernyataanRisiko}</td>
              <td class="data">${r.rtp || '-'}</td>
              <td class="data">${r.prosesRtp || 'Belum diisi'}</td>
              <td class="data">${r.linkEviden || '-'}</td>
              <td class="data" align="center">${r.levelRisiko}</td>
            </tr>`;
          });
          html += `
                <tr><td colspan="7" style="border:none;"></td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="4" class="sign">Jakarta, ${dateStr}</td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="4" class="sign">${footerJabatan}</td></tr>
                <tr><td colspan="7" style="border:none;"></td></tr><tr><td colspan="7" style="border:none;"></td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="4" class="sign" style="font-weight:bold;text-decoration:underline;">${currentUser.namaPimpinan || '......................................'}</td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="4" class="sign">NIP. ${currentUser.nipPimpinan || '......................................'}</td></tr>
              </table>
            </body></html>
          `;
        } else if (subReportTab === 'pencatatan_keterjadian') {
          html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"><style>.title{border:none;text-align:center;font-weight:bold;}.data{border:0.5pt solid black;vertical-align:top;padding:4px;}.head{border:0.5pt solid black;background:#f3f4f6;font-weight:bold;text-align:center;padding:4px;}.sign{border:none;text-align:right;}</style></head>
            <body>
              <table style="border-collapse:collapse;font-family:Arial;font-size:11px;">
                <tr><td colspan="6" class="title" style="font-size:14px;">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL RI</td></tr>
                <tr><td colspan="6" class="title" style="font-size:13px;">BADAN PENGEMBANGAN DAN INFORMASI</td></tr>
                <tr><td colspan="6" class="title" style="font-size:12px;color:#047857;">LAPORAN PENCATATAN KETERJADIAN RISIKO (${currentUser.nama.toUpperCase()})</td></tr>
                <tr><td colspan="6" class="title" style="font-size:11px;color:#6b7280;">TAHUN ANGGARAN ${currentUser.tahun}</td></tr>
                <tr><td colspan="6" style="border:none;"></td></tr>
                <tr style="background:#f3f4f6;font-weight:bold;">
                  <td class="head">No</td><td class="head">Tanggal Kejadian</td><td class="head">Pernyataan Risiko</td><td class="head">Kronologi Kejadian</td><td class="head">Penyebab Keterjadian</td><td class="head">Dampak Kejadian Riil</td>
                </tr>
          `;
          unitKejadian.forEach((k, idx) => {
            html += `<tr>
              <td class="data" align="center">${idx + 1}</td>
              <td class="data" align="center">${k.tanggal || '-'}</td>
              <td class="data" style="font-weight:bold;">${k.risiko || '-'}</td>
              <td class="data">${k.kronologi || '-'}</td>
              <td class="data">${k.penyebab || '-'}</td>
              <td class="data">${k.dampakRiil || '-'}</td>
            </tr>`;
          });
          html += `
                <tr><td colspan="6" style="border:none;"></td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="3" class="sign">Jakarta, ${dateStr}</td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="3" class="sign">${footerJabatan}</td></tr>
                <tr><td colspan="6" style="border:none;"></td></tr><tr><td colspan="6" style="border:none;"></td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="3" class="sign" style="font-weight:bold;text-decoration:underline;">${currentUser.namaPimpinan || '......................................'}</td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="3" class="sign">NIP. ${currentUser.nipPimpinan || '......................................'}</td></tr>
              </table>
            </body></html>
          `;
        } else if (subReportTab === 'efektivitas_rtp') {
          html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"><style>.title{border:none;text-align:center;font-weight:bold;}.data{border:0.5pt solid black;vertical-align:top;padding:4px;}.head{border:0.5pt solid black;background:#f3f4f6;font-weight:bold;text-align:center;padding:4px;}.sign{border:none;text-align:right;}</style></head>
            <body>
              <table style="border-collapse:collapse;font-family:Arial;font-size:11px;">
                <tr><td colspan="8" class="title" style="font-size:14px;">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL RI</td></tr>
                <tr><td colspan="8" class="title" style="font-size:13px;">BADAN PENGEMBANGAN DAN INFORMASI</td></tr>
                <tr><td colspan="8" class="title" style="font-size:12px;color:#047857;">LAPORAN EFEKTIFITAS & DEVIASI RTP (${currentUser.nama.toUpperCase()})</td></tr>
                <tr><td colspan="8" class="title" style="font-size:11px;color:#6b7280;">TAHUN ANGGARAN ${currentUser.tahun}</td></tr>
                <tr><td colspan="8" style="border:none;"></td></tr>
                <tr style="background:#f3f4f6;font-weight:bold;">
                  <td class="head">No</td><td class="head">ID Risiko</td><td class="head">Pernyataan Risiko</td><td class="head">Kondisi Setelah Mitigasi</td><td class="head">SR Awal</td><td class="head">SR Diharapkan</td><td class="head">SR Actual</td><td class="head">Deviasi</td>
                </tr>
          `;
          unitEfektivitas.forEach((e, idx) => {
            html += `<tr>
              <td class="data" align="center">${idx + 1}</td>
              <td class="data" align="center">${e.riskId}</td>
              <td class="data" style="font-weight:bold;">${e.pernyataanRisiko}</td>
              <td class="data">${e.kondisiSetelahMitigasi || '-'}</td>
              <td class="data" align="center">${e.srAwal}</td>
              <td class="data" align="center">${e.srDiharapkan}</td>
              <td class="data" align="center">${e.srActual}</td>
              <td class="data" align="center" style="font-weight:bold;">${e.deviasi}</td>
            </tr>`;
          });
          html += `
                <tr><td colspan="8" style="border:none;"></td></tr>
                <tr><td colspan="4" style="border:none;"></td><td colspan="4" class="sign">Jakarta, ${dateStr}</td></tr>
                <tr><td colspan="4" style="border:none;"></td><td colspan="4" class="sign">${footerJabatan}</td></tr>
                <tr><td colspan="8" style="border:none;"></td></tr><tr><td colspan="8" style="border:none;"></td></tr>
                <tr><td colspan="4" style="border:none;"></td><td colspan="4" class="sign" style="font-weight:bold;text-decoration:underline;">${currentUser.namaPimpinan || '......................................'}</td></tr>
                <tr><td colspan="4" style="border:none;"></td><td colspan="4" class="sign">NIP. ${currentUser.nipPimpinan || '......................................'}</td></tr>
              </table>
            </body></html>
          `;
        }

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `Laporan_${subReportTab}_${currentUser.tahun}.xls`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      } catch (err) {
        showAlert('Gagal', 'Gagal mengunduh Excel.', 'error');
      }
    };

    const handleDownloadPDF = () => {
      setIsPdfLoading(true);
      try {
        window.print();
      } catch (error) {
        showAlert('Gagal', 'Gagal membuka dialog cetak PDF.', 'error');
      } finally {
        setIsPdfLoading(false);
      }
    };

    return (
      <div className="space-y-6 w-full animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/60 pb-4 gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Modul Laporan Unit Kerja</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Unduh dokumen format resmi BPI.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleDownloadExcel} className="bg-white/60 border border-white hover:bg-white text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all">
              <Download size={16} className="text-emerald-700" /> Unduh Excel
            </button>
            <button type="button" onClick={handleDownloadPDF} disabled={isPdfLoading} className={`${isPdfLoading ? 'bg-emerald-400' : 'bg-emerald-700 hover:bg-emerald-800'} text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-700/20 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all`}>
              {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              {isPdfLoading ? 'Mempersiapkan...' : 'Cetak / Simpan PDF'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-2 print:hidden">
          <button type="button" onClick={() => setSubReportTab('peta_risiko')} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'peta_risiko' ? 'glass-panel text-emerald-800 border-b-2 border-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}>Peta Risiko</button>
          <button type="button" onClick={() => setSubReportTab('pemantauan_rtp')} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'pemantauan_rtp' ? 'glass-panel text-emerald-800 border-b-2 border-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}>Pemantauan RTP</button>
          <button type="button" onClick={() => setSubReportTab('pencatatan_keterjadian')} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'pencatatan_keterjadian' ? 'glass-panel text-rose-700 border-b-2 border-rose-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}>Laporan Keterjadian</button>
          <button type="button" onClick={() => setSubReportTab('efektivitas_rtp')} className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'efektivitas_rtp' ? 'glass-panel text-emerald-800 border-b-2 border-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'}`}>Laporan Efektifitas</button>
        </div>
        
        <div id="report-container" className="glass-panel p-8 rounded-2xl space-y-6">
          <div className="text-center space-y-1 pb-4">
            <h3 className="font-extrabold text-slate-900 text-base uppercase m-0 leading-tight">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL RI</h3>
            <h4 className="font-bold text-slate-800 text-sm uppercase m-0 leading-tight tracking-wide">BADAN PENGEMBANGAN DAN INFORMASI</h4>
            <h5 className="font-extrabold text-emerald-800 text-sm uppercase pt-4 m-0 leading-tight">
              {subReportTab === 'peta_risiko' && `LAPORAN MATRIKS PETA RISIKO (${currentUser?.nama.toUpperCase()})`}
              {subReportTab === 'pemantauan_rtp' && `LAPORAN PEMANTAUAN RTP (${currentUser?.nama.toUpperCase()})`}
              {subReportTab === 'pencatatan_keterjadian' && `LAPORAN PENCATATAN KETERJADIAN RISIKO (${currentUser?.nama.toUpperCase()})`}
              {subReportTab === 'efektivitas_rtp' && `LAPORAN EFEKTIFITAS & DEVIASI RTP (${currentUser?.nama.toUpperCase()})`}
            </h5>
            <p className="text-xs text-slate-500 font-bold m-0 pt-1 tracking-widest">TAHUN ANGGARAN {currentUser?.tahun}</p>
          </div>

          {subReportTab === 'peta_risiko' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1600px] text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-white/60 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <th className="border border-slate-300 p-2.5 text-center align-middle">No</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Sasaran {isEselon1 ? 'Program' : 'Kegiatan'}</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Indikator Sasaran (IKU)</th>
                    <th className="border border-slate-300 p-2.5 align-middle bg-emerald-50/50">Risiko</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Sumber Risiko</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Kategori Risiko</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Penyebab</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Dampak</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Pengendalian yang ada</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Sisa Risiko</th>
                    <th className="border border-slate-300 p-2.5 align-middle">Pemilik Risiko</th>
                    <th className="border border-slate-300 p-2.5 text-center align-middle">K</th>
                    <th className="border border-slate-300 p-2.5 text-center align-middle">D</th>
                    <th className="border border-slate-300 p-2.5 text-center align-middle">Skala Risiko</th>
                    <th className="border border-slate-300 p-2.5 text-center align-middle">Level Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 text-slate-800">
                  {unitRisks.map((risk, index) => {
                    return (
                      <tr key={risk.id} className="hover:bg-white/40">
                        <td className="border border-slate-300 p-2 text-center font-bold align-top">{index + 1}</td>
                        <td className="border border-slate-300 p-2 font-medium align-top leading-relaxed">{risk.sasaranKgt || '-'}</td>
                        <td className="border border-slate-300 p-2 text-emerald-800 font-semibold align-top leading-relaxed">{risk.indikatorKgt || '-'}</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900 align-top leading-relaxed bg-emerald-50/20">{risk.pernyataanRisiko}</td>
                        <td className="border border-slate-300 p-2 align-top">{risk.penyebabSumber || '-'}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-600 align-top">{risk.kategoriRisiko || 'Operasional'}</td>
                        <td className="border border-slate-300 p-2 align-top leading-relaxed">{risk.penyebabUraian}</td>
                        <td className="border border-slate-300 p-2 align-top leading-relaxed">{risk.dampakUraian}</td>
                        <td className="border border-slate-300 p-2 align-top leading-relaxed">{risk.pengendalianRisiko}</td>
                        <td className="border border-slate-300 p-2 align-top leading-relaxed">{risk.sisaRisiko}</td>
                        <td className="border border-slate-300 p-2 align-top">{risk.pemilikRisiko}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold align-top">{risk.kemungkinan || '-'}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold align-top">{risk.keparahan || '-'}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold bg-white/50 align-top">{risk.skor > 0 ? risk.skor : '-'}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold align-top">
                          {risk.skor > 0 ? <span className={`px-2 py-0.5 rounded text-[11px] border block mx-auto w-max ${getStatusColor(risk.levelRisiko)}`}>{risk.levelRisiko}</span> : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {unitRisks.length === 0 && (
                    <tr><td colSpan="15" className="border border-slate-300 p-6 text-center text-slate-400 italic">Belum ada data risiko terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subReportTab === 'pemantauan_rtp' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1200px] text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-white/60 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <th className="border border-slate-300 p-2.5 text-center w-12">No</th>
                    <th className="border border-slate-300 p-2.5 text-center w-24">ID Risiko</th>
                    <th className="border border-slate-300 p-2.5 bg-emerald-50/50">Pernyataan Risiko</th>
                    <th className="border border-slate-300 p-2.5">RTP Awal</th>
                    <th className="border border-slate-300 p-2.5">Proses RTP / Progres</th>
                    <th className="border border-slate-300 p-2.5">Link Eviden</th>
                    <th className="border border-slate-300 p-2.5 text-center w-28">Level Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {unitRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi').map((risk, index) => (
                    <tr key={risk.id} className="hover:bg-white/40">
                      <td className="border border-slate-300 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold text-slate-500">{risk.id}</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900 bg-emerald-50/20 leading-relaxed">{risk.pernyataanRisiko}</td>
                      <td className="border border-slate-300 p-2 leading-relaxed">{risk.rtp || '-'}</td>
                      <td className="border border-slate-300 p-2 leading-relaxed">{risk.prosesRtp || <span className="text-slate-400 italic">Belum diisi</span>}</td>
                      <td className="border border-slate-300 p-2 text-emerald-700 truncate max-w-xs">{risk.linkEviden || '-'}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold"><span className={`px-2 py-0.5 rounded text-[11px] border block w-max mx-auto ${getStatusColor(risk.levelRisiko)}`}>{risk.levelRisiko}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {subReportTab === 'pencatatan_keterjadian' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1000px] text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-white/60 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <th className="border border-slate-300 p-2.5 text-center w-12">No</th>
                    <th className="border border-slate-300 p-2.5 text-center w-28">Tanggal Kejadian</th>
                    <th className="border border-slate-300 p-2.5 bg-emerald-50/50">Pernyataan Risiko</th>
                    <th className="border border-slate-300 p-2.5">Kronologi Kejadian</th>
                    <th className="border border-slate-300 p-2.5">Penyebab Keterjadian</th>
                    <th className="border border-slate-300 p-2.5 text-rose-700">Dampak Kejadian Riil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {unitKejadian.map((k, index) => (
                    <tr key={k.id} className="hover:bg-white/40 align-top">
                      <td className="border border-slate-300 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold text-emerald-800">{k.tanggal || '-'}</td>
                      <td className="border border-slate-300 p-2 font-bold bg-emerald-50/20 leading-relaxed">{k.risiko}</td>
                      <td className="border border-slate-300 p-2 leading-relaxed">{k.kronologi || '-'}</td>
                      <td className="border border-slate-300 p-2 leading-relaxed">{k.penyebab || '-'}</td>
                      <td className="border border-slate-300 p-2 text-rose-700 font-medium leading-relaxed">{k.dampakRiil || '-'}</td>
                    </tr>
                  ))}
                  {unitKejadian.length === 0 && (
                    <tr><td colSpan="6" className="border border-slate-300 p-6 text-center text-slate-400 italic">Belum ada laporan pencatatan keterjadian risiko.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subReportTab === 'efektivitas_rtp' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1200px] text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-white/60 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                    <th className="border border-slate-300 p-2.5 text-center w-12">No</th>
                    <th className="border border-slate-300 p-2.5 text-center w-24">ID Risiko</th>
                    <th className="border border-slate-300 p-2.5 bg-emerald-50/50">Pernyataan Risiko</th>
                    <th className="border border-slate-300 p-2.5">Kondisi Setelah Mitigasi</th>
                    <th className="border border-slate-300 p-2.5 text-center">SR Awal</th>
                    <th className="border border-slate-300 p-2.5 text-center text-emerald-800">SR Target</th>
                    <th className="border border-slate-300 p-2.5 text-center text-sky-700">SR Actual</th>
                    <th className="border border-slate-300 p-2.5 text-center text-emerald-700">Deviasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {unitEfektivitas.map((e, index) => (
                    <tr key={e.id} className="hover:bg-white/40">
                      <td className="border border-slate-300 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold text-slate-500">{e.riskId}</td>
                      <td className="border border-slate-300 p-2 font-bold bg-emerald-50/20 leading-relaxed">{e.pernyataanRisiko}</td>
                      <td className="border border-slate-300 p-2 leading-relaxed">{e.kondisiSetelahMitigasi || '-'}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold text-slate-500">{e.srAwal}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold text-emerald-800">{e.srDiharapkan}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold text-sky-700">{e.srActual}</td>
                      <td className="border border-slate-300 p-2 text-center font-extrabold bg-white/50 text-emerald-700">{e.deviasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-16 pb-6 flex justify-end print:pt-10">
            <div className="w-72 text-center space-y-20">
              <p className="text-xs text-slate-700 m-0 leading-relaxed">
                Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                <span className="font-bold">{footerJabatan}</span>
              </p>
              <div>
                <p className="font-bold underline text-xs text-slate-900 m-0">{currentUser?.namaPimpinan || '......................................'}</p>
                <p className="text-[11px] text-slate-500 font-medium m-0 pt-1">NIP. {currentUser?.nipPimpinan || '......................................'}</p>
              </div>
            </div>
          </div>
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

  if (!currentUser) return (
    <>
      <GlobalStyle />
      {modal.isOpen && <PopupModal />}
      <LoginScreen />
    </>
  );

  return (
    <div className="flex h-screen bg-transparent font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900">
      <GlobalStyle />
      {modal.isOpen && <PopupModal />}
      
      {/* Sidebar Desktop (Tema Kemendes PDT - Hijau Gelap) */}
      <aside className="w-72 bg-emerald-950/95 backdrop-blur-xl text-emerald-50 hidden md:flex flex-col shadow-2xl z-10 print:hidden relative overflow-hidden border-r border-emerald-900/50">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
        
        <div className="p-6 relative z-10 border-b border-emerald-900/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-emerald-800/50 rounded-xl border border-emerald-700/50">
              <Shield size={24} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">SI-MARI <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full ml-1 font-bold align-middle uppercase tracking-widest border border-emerald-500">v2.0</span></h1>
          </div>
          <p className="text-xs text-emerald-200 font-medium leading-relaxed">{currentUser.nama}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-800/80 text-emerald-100 px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-700/80"><Calendar size={13} className="text-amber-400" /> THN: {currentUser.tahun}</span>
            {currentUser.role !== 'admin' && (
              <span className="inline-block bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider">{currentUser.eselon || 'Eselon 2'}</span>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-3 px-2">Menu Utama</p>
          {currentUser.role === 'admin' ? (
            <>
              <button type="button" onClick={() => setActiveTab('admin_dashboard')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'admin_dashboard' ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-600/50' : 'text-emerald-200/70 hover:bg-emerald-800/50 hover:text-white'}`}><LayoutTemplate size={18} /><span className="text-[13px]">Dashboard Admin</span></button>
              <button type="button" onClick={() => setActiveTab('admin_users')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'admin_users' ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-600/50' : 'text-emerald-200/70 hover:bg-emerald-800/50 hover:text-white'}`}><Users size={18} /><span className="text-[13px]">User & Unit</span></button>
              <button type="button" onClick={() => setActiveTab('admin_sasaran')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'admin_sasaran' ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-600/50' : 'text-emerald-200/70 hover:bg-emerald-800/50 hover:text-white'}`}><Compass size={18} /><span className="text-[13px]">Hierarki K/L</span></button>
              <button type="button" onClick={() => setActiveTab('admin_security')} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'admin_security' ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-600/50' : 'text-emerald-200/70 hover:bg-emerald-800/50 hover:text-white'}`}><KeyRound size={18} /><span className="text-[13px]">Keamanan Admin</span></button>
            </>
          ) : (
            unitMenus.map(menu => (<button type="button" key={menu.id} onClick={() => setActiveTab(menu.id)} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === menu.id ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-600/50' : 'text-emerald-200/70 hover:bg-emerald-800/50 hover:text-white'}`}><menu.icon size={18} className={activeTab === menu.id ? 'text-amber-400' : 'text-emerald-400/80'} /><span className="text-[13px]">{menu.label}</span></button>))
          )}
        </nav>
        
        <div className="p-4 m-4 bg-emerald-900/50 rounded-2xl border border-emerald-800/50 flex justify-between items-center relative z-10">
          <div><p className="text-[9px] text-emerald-400/80 uppercase tracking-widest font-bold">Role Akses</p><p className="text-xs text-white font-bold uppercase mt-0.5">{currentUser.role}</p></div>
          <button type="button" onClick={() => { setCurrentUser(null); localStorage.removeItem('simari_current_user'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-colors cursor-pointer" title="Keluar Akun"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-emerald-950/60 backdrop-blur-sm">
          <div className="w-72 bg-emerald-950 text-emerald-50 flex flex-col shadow-2xl h-full animate-in slide-in-from-left duration-200 border-r border-emerald-900">
            <div className="p-6 flex justify-between items-center border-b border-emerald-900/50">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-800/50 rounded-xl border border-emerald-700/50">
                    <Shield size={20} className="text-amber-400" />
                  </div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight">SI-MARI</h1>
                </div>
                <p className="text-[11px] text-emerald-200 font-medium">{currentUser.nama}</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-emerald-900 text-emerald-400 hover:text-white rounded-xl cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 flex items-center gap-2 border-b border-emerald-900/50">
              <span className="inline-flex items-center gap-1.5 bg-emerald-800 text-emerald-100 px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-700"><Calendar size={13} className="text-amber-400" /> THN: {currentUser.tahun}</span>
              {currentUser.role !== 'admin' && (
                <span className="inline-block bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider">{currentUser.eselon || 'Eselon 2'}</span>
              )}
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
              {currentUser.role === 'admin' ? (
                <>
                  <button type="button" onClick={() => { setActiveTab('admin_dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'admin_dashboard' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><LayoutTemplate size={18} /><span className="text-[13px]">Dashboard Admin</span></button>
                  <button type="button" onClick={() => { setActiveTab('admin_users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'admin_users' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><Users size={18} /><span className="text-[13px]">User & Unit</span></button>
                  <button type="button" onClick={() => { setActiveTab('admin_sasaran'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'admin_sasaran' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><Compass size={18} /><span className="text-[13px]">Hierarki K/L</span></button>
                  <button type="button" onClick={() => { setActiveTab('admin_security'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'admin_security' ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><KeyRound size={18} /><span className="text-[13px]">Keamanan Admin</span></button>
                </>
              ) : (
                unitMenus.map(menu => (<button type="button" key={menu.id} onClick={() => { setActiveTab(menu.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === menu.id ? 'bg-emerald-700 text-white' : 'text-emerald-200/70 hover:bg-emerald-800/50'}`}><menu.icon size={18} className={activeTab === menu.id ? 'text-amber-400' : 'text-emerald-400/80'}/><span className="text-[13px]">{menu.label}</span></button>))
              )}
            </nav>
            <div className="p-4 m-4 bg-emerald-900/50 rounded-2xl border border-emerald-800/50 flex justify-between items-center">
              <div><p className="text-[9px] text-emerald-400/80 uppercase tracking-widest font-bold">Role Akses</p><p className="text-xs text-white font-bold uppercase mt-0.5">{currentUser.role}</p></div>
              <button type="button" onClick={() => { setCurrentUser(null); localStorage.removeItem('simari_current_user'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-colors cursor-pointer" title="Keluar"><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="glass-panel border-b border-white/60 p-4 flex md:hidden justify-between items-center shadow-sm print:hidden">
          <div className="flex items-center space-x-2"><Shield size={22} className="text-emerald-700" /><h1 className="font-extrabold text-slate-800 text-sm tracking-tight">SI-MARI BPI</h1></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer shadow-sm border border-slate-200/50" title="Menu Navigasi"><Menu size={18} /></button>
          </div>
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
