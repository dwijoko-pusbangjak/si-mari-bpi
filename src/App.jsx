import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { 
  ShieldAlert, Target, Search, BarChart2, ShieldCheck, Activity, PlusCircle, 
  Save, Check, LogOut, Building2, Lock, UserCheck, FileText, Shield, Plus, 
  Trash2, Edit, Users, Compass, Layers, Calendar, List, Printer, Download, 
  Loader2, AlertOctagon, CheckCircle2, Link as LinkIcon, LayoutDashboard,
  FileDown, KeyRound, AlertTriangle, Info, X
} from 'lucide-react';

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

const initialMasterSasaran = {
  strategis: [],
  program: [],
  kegiatan: []
};

const initialRisks = [];

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => loadLocal('simari_current_user', null)); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subReportTab, setSubReportTab] = useState('peta_risiko'); 

  const [unitKerjaList, setUnitKerjaList] = useState(initialUnitKerjaList);
  const [masterSasaran, setMasterSasaran] = useState(initialMasterSasaran);
  const [tujuanList, setTujuanList] = useState([]);
  const [risks, setRisks] = useState(initialRisks);
  const [kejadianList, setKejadianList] = useState([]);
  const [riwayatEfektivitas, setRiwayatEfektivitas] = useState([]);
  
  const [adminPassword, setAdminPassword] = useState(() => loadLocal('simari_admin_pass', 'adminbpi2026'));
  useEffect(() => { saveLocal('simari_admin_pass', adminPassword); }, [adminPassword]);

  useEffect(() => {
    saveLocal('simari_current_user', currentUser);
  }, [currentUser]);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              {modal.status === 'error' ? <AlertTriangle size={48} className="text-rose-500" /> :
               modal.status === 'success' ? <CheckCircle2 size={48} className="text-emerald-500" /> :
               modal.status === 'warning' ? <AlertOctagon size={48} className="text-amber-500" /> :
               <Info size={48} className="text-teal-500" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{modal.title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{modal.message}</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">
            {isConfirm ? (
              <>
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer">Batal</button>
                <button onClick={() => { if(modal.onConfirm) modal.onConfirm(); closeModal(); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer">Ya, Lanjutkan</button>
              </>
            ) : (
              <button onClick={closeModal} className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer">Tutup</button>
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
      case 'Sangat Tinggi': return 'bg-red-100 text-red-900 border-red-300';
      case 'Tinggi': return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Sedang': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Rendah': return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Sangat Rendah': return 'bg-teal-50 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
          setActiveTab('admin_users');
        } else { showAlert('Gagal Login', 'Kata sandi Admin salah!', 'error'); }
      } else {
        const unitObj = unitKerjaList.find(u => u.id === selectedUnit);
        if (unitObj) {
          if (unitPassword === (unitObj.sandi || 'bpi2026')) {
            setCurrentUser({ role: 'unit', tahun: selectedTahun, ...unitObj });
            setActiveTab('dashboard');
          } else { showAlert('Gagal Login', 'Kata sandi unit kerja salah!', 'error'); }
        } else { showAlert('Perhatian', 'Silakan pilih unit kerja yang valid.', 'warning'); }
      }
    };

    if (isDbLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 size={40} className="animate-spin text-teal-600" /></div>;

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-teal-50 via-slate-100 to-cyan-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-200">
          <div className="text-center mb-6">
            <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-2xl mb-3 shadow-sm"><ShieldAlert size={40} /></div>
            <h1 className="text-2xl font-bold text-slate-800">SI-MARI BPI</h1>
            <p className="text-xs text-slate-500 mt-1">Sistem Manajemen Risiko Unit Kerja & Admin<br/>Badan Pengembangan dan Informasi</p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button type="button" onClick={() => setLoginType('unit')} className={`py-2 text-xs font-semibold rounded-xl transition-all ${loginType === 'unit' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Unit Kerja</button>
            <button type="button" onClick={() => setLoginType('admin')} className={`py-2 text-xs font-semibold rounded-xl transition-all ${loginType === 'admin' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Administrator Pusat</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginType === 'unit' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5"><Building2 size={14} className="text-teal-600" /> Pilih Unit Kerja</label>
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:border-teal-500">
                    {unitKerjaList.length === 0 && <option value="">-- Belum ada unit --</option>}
                    {unitKerjaList.map((unit) => (<option key={unit.id} value={unit.id}>{unit.nama} ({unit.username})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5"><Calendar size={14} className="text-teal-600" /> Tahun Pengelolaan</label>
                  <select value={selectedTahun} onChange={(e) => setSelectedTahun(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:border-teal-500">
                    <option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5"><Lock size={14} className="text-teal-600" /> Kata Sandi Akses</label>
                  <input required type="password" value={unitPassword} onChange={(e) => setUnitPassword(e.target.value)} placeholder="Masukkan sandi..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:border-teal-500" />
                  <p className="text-[11px] text-slate-400 mt-1 italic">*Default sandi unit: bpi2026</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5"><Shield size={14} className="text-teal-600" /> Sandi Admin</label>
                <input required type="password" value={inputAdminPass} onChange={(e) => setInputAdminPass(e.target.value)} placeholder="Masukkan sandi admin..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:border-teal-500" />
                <p className="text-[11px] text-slate-400 mt-1 italic">*Default sandi admin: adminbpi2026</p>
              </div>
            )}
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white p-3.5 rounded-xl font-medium text-sm shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer transition-all">
              <UserCheck size={18} /> Masuk ke Sistem
            </button>
          </form>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [adminUserTab, setAdminUserTab] = useState('list');
    const [unitForm, setUnitForm] = useState({ id: '', nama: '', username: '', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' });
    const [editUnitId, setEditUnitId] = useState(null);

    const [kategoriSasaran, setKategoriSasaran] = useState('strategis');
    const [selectedParentId, setSelectedParentId] = useState('');
    const [formSasaran, setFormSasaran] = useState({ nama: '', indikator: '', target: '', satuan: '' });
    const [editSasaranId, setEditSasaranId] = useState(null);

    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

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
      setUnitForm({ id: '', nama: '', username: '', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' });
      setAdminUserTab('form');
    };

    const handleEditUserClick = (unit) => {
      setEditUnitId(unit.id);
      setUnitForm(unit);
      setAdminUserTab('form');
    };

    const handleSaveUnit = async (e) => {
      e.preventDefault();
      if (unitForm.nama.trim() && unitForm.username.trim()) {
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
        setUnitForm({ id: '', nama: '', username: '', sandi: 'bpi2026', namaPimpinan: '', nipPimpinan: '' });
        setAdminUserTab('list');
      }
    };

    const handleDeleteUnit = (id) => {
      showConfirm('Hapus Unit Kerja', 'Yakin hapus unit ini permanen?', async () => {
        try { if (db) await deleteDoc(getDocRef('units', id)); } catch(e) {}
        setUnitKerjaList(prev => prev.filter(u => u.id !== id));
      });
    };

    const handleAddMasterSasaran = async (e) => {
      e.preventDefault();
      if (formSasaran.nama.trim()) {
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
      <div className="max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel Administrator Pusat BPI</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola manajemen akun unit kerja, hierarki Sasaran K/L, dan keamanan sandi admin.</p>
        </div>

        <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-2xl shadow-sm px-4 pt-2 gap-2">
          <button onClick={() => setActiveTab('admin_users')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_users' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Users size={18} /> Manajemen User</button>
          <button onClick={() => setActiveTab('admin_sasaran')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_sasaran' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Compass size={18} /> Hierarki Sasaran K/L</button>
          <button onClick={() => setActiveTab('admin_security')} className={`py-3 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'admin_security' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><KeyRound size={18} /> Keamanan Admin</button>
        </div>

        {activeTab === 'admin_security' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={18} className="text-teal-600" /> Ubah Kata Sandi Admin
              </h3>
              <p className="text-xs text-slate-500 mt-1">Perbarui kata sandi administrator pusat secara berkala untuk keamanan sistem.</p>
            </div>
            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kata Sandi Lama</label>
                <input required type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Masukkan sandi lama..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kata Sandi Baru</label>
                <input required type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 6 karakter..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Konfirmasi Kata Sandi Baru</label>
                <input required type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Ulangi sandi baru..." className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
              </div>
              <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all">
                <Save size={16} /> Simpan Kata Sandi Baru
              </button>
            </form>
          </div>
        )}

        {activeTab === 'admin_users' && (
          <div className="space-y-6">
            <div className="flex space-x-2 border-b border-slate-200 pb-2">
              <button onClick={() => { setAdminUserTab('list'); setEditUnitId(null); }} className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 cursor-pointer ${adminUserTab === 'list' ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><List size={16} /> Daftar Unit Kerja</button>
              <button onClick={handleAddUserClick} className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 cursor-pointer ${adminUserTab === 'form' && !editUnitId ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><PlusCircle size={16} /> Tambah User</button>
              {adminUserTab === 'form' && editUnitId && (<button className="px-4 py-2 text-sm font-medium rounded-t-lg bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm flex items-center gap-2"><Edit size={16} /> Edit User</button>)}
            </div>

            {adminUserTab === 'form' ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <form onSubmit={handleSaveUnit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Unit Kerja</label><input required type="text" value={unitForm.nama} onChange={(e) => setUnitForm({...unitForm, nama: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Username Login</label><input required type="text" value={unitForm.username} onChange={(e) => setUnitForm({...unitForm, username: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Kata Sandi Akun</label><input required type="text" value={unitForm.sandi} onChange={(e) => setUnitForm({...unitForm, sandi: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div className="md:col-span-2 pt-2 border-t border-slate-100"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Pimpinan</h4></div>
                    <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Pimpinan</label><input required type="text" value={unitForm.namaPimpinan} onChange={(e) => setUnitForm({...unitForm, namaPimpinan: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NIP Pimpinan</label><input required type="text" value={unitForm.nipPimpinan} onChange={(e) => setUnitForm({...unitForm, nipPimpinan: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:ring-2 focus:ring-teal-500" /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => { setAdminUserTab('list'); setEditUnitId(null); }} className="bg-slate-100 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 text-slate-700 cursor-pointer">Batal</button>
                    <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer"><Save size={16} /> Simpan Data</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-3 bg-teal-50 border-b border-teal-100 text-xs text-teal-800 font-medium flex items-center gap-2">
                  <Edit size={14} className="text-teal-600" /> Tip: Klik pada nama unit kerja atau tombol Edit untuk mengubah data unit kerja.
                </div>
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                      <th className="p-4 font-semibold w-12 text-center">No</th>
                      <th className="p-4 font-semibold">Nama Unit Kerja</th>
                      <th className="p-4 font-semibold">Login</th>
                      <th className="p-4 font-semibold">Pimpinan</th>
                      <th className="p-4 font-semibold w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {unitKerjaList.map((unit, idx) => (
                      <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-4">
                          <button 
                            type="button"
                            onClick={() => handleEditUserClick(unit)}
                            className="font-bold text-slate-800 hover:text-teal-700 text-left hover:underline cursor-pointer flex items-center gap-2"
                          >
                            <span>{unit.nama}</span>
                            <Edit size={13} className="text-slate-400 hover:text-teal-600 inline" />
                          </button>
                        </td>
                        <td className="p-4"><p>User: <span className="font-bold text-teal-700">{unit.username}</span></p><p className="text-slate-500 text-xs">Pass: {unit.sandi}</p></td>
                        <td className="p-4"><p className="font-medium text-slate-800">{unit.namaPimpinan}</p><p className="text-xs text-slate-500">NIP: {unit.nipPimpinan}</p></td>
                        <td className="p-4 text-center space-x-2">
                          <button onClick={() => handleEditUserClick(unit)} className="p-2 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors cursor-pointer" title="Edit"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteUnit(unit.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer" title="Hapus"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {unitKerjaList.length === 0 && (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">Belum ada unit kerja. Silakan tambahkan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin_sasaran' && (
          <div className="space-y-6">
            <form onSubmit={handleAddMasterSasaran} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers size={16} className="text-teal-600" /> 
                {editSasaranId ? "Edit Hierarki Sasaran K/L" : "Tambah Hierarki Sasaran K/L"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Level</label>
                  <select value={kategoriSasaran} onChange={(e) => { setKategoriSasaran(e.target.value); setSelectedParentId(''); }} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-teal-500">
                    <option value="strategis">Sasaran Strategis</option>
                    <option value="program">Sasaran Program</option>
                    <option value="kegiatan">Sasaran Kegiatan</option>
                  </select>
                </div>
                {kategoriSasaran === 'program' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Induk Strategis</label>
                    <select required value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white focus:border-teal-500">
                      <option value="">-- Pilih --</option>
                      {(masterSasaran.strategis || []).map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                    </select>
                  </div>
                )}
                {kategoriSasaran === 'kegiatan' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Induk Program</label>
                    <select required value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white focus:border-teal-500">
                      <option value="">-- Pilih --</option>
                      {(masterSasaran.program || []).map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                )}
                <div className={kategoriSasaran === 'kegiatan' ? "md:col-span-2" : "md:col-span-1"}>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Uraian Sasaran</label>
                  <input required type="text" value={formSasaran.nama} onChange={(e) => setFormSasaran({...formSasaran, nama: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-teal-500" placeholder="Masukkan uraian..." />
                </div>
              </div>
              {kategoriSasaran !== 'kegiatan' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Indikator (IKU)</label><input required type="text" value={formSasaran.indikator} onChange={(e) => setFormSasaran({...formSasaran, indikator: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:border-teal-500" placeholder="Indikator..." /></div>
                  <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target</label><input required type="text" value={formSasaran.target} onChange={(e) => setFormSasaran({...formSasaran, target: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:border-teal-500" placeholder="Target..." /></div>
                  <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Satuan</label><input required type="text" value={formSasaran.satuan} onChange={(e) => setFormSasaran({...formSasaran, satuan: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:border-teal-500" placeholder="Satuan..." /></div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                {editSasaranId && (
                  <button type="button" onClick={() => { setEditSasaranId(null); setFormSasaran({ nama: '', indikator: '', target: '', satuan: '' }); }} className="bg-slate-100 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 text-slate-700 cursor-pointer">
                    Batal
                  </button>
                )}
                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer">
                  {editSasaranId ? <Save size={16} /> : <Plus size={16} />} {editSasaranId ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm">Daftar Hierarki Sasaran K/L (Dikelompokkan Berdasarkan Nama Sasaran)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-600 uppercase border-b border-slate-200">
                      <th className="p-4 w-1/2">Level & Uraian Sasaran</th>
                      <th className="p-4">Indikator (IKU) & Target</th>
                      <th className="p-4 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {Array.from(new Set((masterSasaran.strategis || []).map(s => s.nama))).map(stratNama => {
                      const stratItems = (masterSasaran.strategis || []).filter(s => s.nama === stratNama);
                      return (
                        <React.Fragment key={`strat_${stratNama}`}>
                          <tr className="bg-teal-50/20 hover:bg-teal-50/40 align-top">
                            <td className="p-4 font-bold text-slate-900 border-l-4 border-teal-500">
                              <span className="inline-block bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md mr-2 text-[10px] font-semibold">STRATEGIS</span>
                              {stratNama}
                            </td>
                            <td className="p-4 space-y-2">
                              {stratItems.map(strat => (
                                <div key={strat.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-teal-100 shadow-sm">
                                  <div>
                                    <p className="text-teal-900 font-medium"><strong>IKU:</strong> {strat.indikator}</p>
                                    <p className="text-slate-600"><strong>Target:</strong> {strat.target} {strat.satuan}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => handleEditClickSasaran('strategis', strat)} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 cursor-pointer" title="Edit"><Edit size={14} /></button>
                                    <button onClick={() => handleDeleteSasaran('strategis', strat.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer" title="Hapus"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              ))}
                            </td>
                            <td className="p-4 text-center text-slate-400 italic">-</td>
                          </tr>

                          {Array.from(new Set(
                            (masterSasaran.program || [])
                              .filter(p => stratItems.some(s => s.id === p.parentId))
                              .map(p => p.nama)
                          )).map(progNama => {
                            const progItems = (masterSasaran.program || []).filter(p => p.nama === progNama && stratItems.some(s => s.id === p.parentId));
                            return (
                              <React.Fragment key={`prog_${progNama}`}>
                                <tr className="bg-cyan-50/20 hover:bg-cyan-50/40 align-top">
                                  <td className="p-4 pl-10 font-semibold text-slate-800 border-l-4 border-cyan-400">
                                    <span className="inline-block bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-md mr-2 text-[10px] font-semibold">PROGRAM</span>
                                    {progNama}
                                  </td>
                                  <td className="p-4 space-y-2">
                                    {progItems.map(prog => (
                                      <div key={prog.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-cyan-100 shadow-sm">
                                        <div>
                                          <p className="text-cyan-900 font-medium"><strong>IKU:</strong> {prog.indikator}</p>
                                          <p className="text-slate-600"><strong>Target:</strong> {prog.target} {prog.satuan}</p>
                                        </div>
                                        <div className="flex gap-1">
                                          <button onClick={() => handleEditClickSasaran('program', prog)} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 cursor-pointer" title="Edit"><Edit size={14} /></button>
                                          <button onClick={() => handleDeleteSasaran('program', prog.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer" title="Hapus"><Trash2 size={14} /></button>
                                        </div>
                                      </div>
                                    ))}
                                  </td>
                                  <td className="p-4 text-center text-slate-400 italic">-</td>
                                </tr>

                                {Array.from(new Set(
                                  (masterSasaran.kegiatan || [])
                                    .filter(k => progItems.some(p => p.id === k.parentId))
                                    .map(k => k.nama)
                                )).map(kegNama => {
                                  const kegItems = (masterSasaran.kegiatan || []).filter(k => k.nama === kegNama && progItems.some(p => p.id === k.parentId));
                                  return (
                                    <tr key={`keg_${kegNama}`} className="hover:bg-slate-50 align-top">
                                      <td className="p-4 pl-16 text-slate-700 border-l-4 border-slate-300 font-medium">
                                        <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md mr-2 text-[10px] font-semibold">KEGIATAN</span>
                                        {kegNama}
                                      </td>
                                      <td className="p-4 space-y-2">
                                        {kegItems.map(keg => (
                                          <div key={keg.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                            <span className="text-slate-600 italic">Sasaran Kegiatan Aktif</span>
                                            <div className="flex gap-1">
                                              <button onClick={() => handleEditClickSasaran('kegiatan', keg)} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 cursor-pointer" title="Edit"><Edit size={14} /></button>
                                              <button onClick={() => handleDeleteSasaran('kegiatan', keg.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer" title="Hapus"><Trash2 size={14} /></button>
                                            </div>
                                          </div>
                                        ))}
                                      </td>
                                      <td className="p-4 text-center text-slate-400 italic">-</td>
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
                      <tr><td colSpan="3" className="p-6 text-center text-slate-400 italic">Belum ada hierarki sasaran terdaftar.</td></tr>
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
    const unitEfektifitas = riwayatEfektivitas.filter(e => {
      const parentRisk = risks.find(r => r.id === e.riskId);
      return parentRisk && parentRisk.unit === currentUser.nama && parentRisk.tahun === currentUser.tahun;
    });

    const totalRisiko = unitRisks.length;
    const risikoDimitigasi = unitRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi').length;
    const risikoSangatTinggi = unitRisks.filter(r => r.levelRisiko === 'Sangat Tinggi').length;
    const risikoTinggi = unitRisks.filter(r => r.levelRisiko === 'Tinggi').length;
    const risikoSedang = unitRisks.filter(r => r.levelRisiko === 'Sedang').length;
    const risikoRendah = unitRisks.filter(r => r.levelRisiko === 'Rendah' || r.levelRisiko === 'Sangat Rendah').length;

    return (
      <div className="max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Manajemen Risiko ({currentUser?.nama})</h2>
          <p className="text-slate-500 text-sm mt-1">Sistem tersinkronisasi real-time ke seluruh tim BPI.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400 uppercase">Total Risiko</p><h3 className="text-3xl font-bold text-slate-800 mt-1">{totalRisiko}</h3></div><div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shadow-sm"><ShieldAlert size={28} /></div></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400 uppercase">RTP Dimitigasi</p><h3 className="text-3xl font-bold text-cyan-600 mt-1">{risikoDimitigasi}</h3></div><div className="p-4 bg-cyan-50 text-cyan-600 rounded-2xl shadow-sm"><ShieldCheck size={28} /></div></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400 uppercase">Kejadian Risiko</p><h3 className="text-3xl font-bold text-rose-600 mt-1">{unitKejadian.length}</h3></div><div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-sm"><AlertOctagon size={28} /></div></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400 uppercase">Efektifitas</p><h3 className="text-3xl font-bold text-emerald-600 mt-1">{unitEfektifitas.length}</h3></div><div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><CheckCircle2 size={28} /></div></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Distribusi Level Risiko</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl"><p className="text-xs font-semibold text-red-700 uppercase">Sangat Tinggi</p><p className="text-2xl font-bold text-red-900 mt-1">{risikoSangatTinggi}</p></div>
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl"><p className="text-xs font-semibold text-orange-700 uppercase">Tinggi</p><p className="text-2xl font-bold text-orange-900 mt-1">{risikoTinggi}</p></div>
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl"><p className="text-xs font-semibold text-amber-700 uppercase">Sedang</p><p className="text-2xl font-bold text-amber-900 mt-1">{risikoSedang}</p></div>
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl"><p className="text-xs font-semibold text-emerald-700 uppercase">Rendah</p><p className="text-2xl font-bold text-emerald-900 mt-1">{risikoRendah}</p></div>
          </div>
        </div>
      </div>
    );
  };

  const PenetapanTujuan = () => {
    const [selectedStrategis, setSelectedStrategis] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedKegiatan, setSelectedKegiatan] = useState('');
    const [indikatorKgt, setIndikatorKgt] = useState('');
    const [targetKgt, setTargetKgt] = useState('');
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
      const kgtObj = masterSasaran.kegiatan.find(k => k.id === selectedKegiatan);

      if (stratObj && progObj && kgtObj) {
        const newId = editTujuanId || `TSJ-${Date.now()}`;
        const newEntry = { id: newId, unit: currentUser.nama, tahun: currentUser.tahun, strategis: stratObj.nama, program: progObj.nama, kegiatan: kgtObj.nama, indikator: indikatorKgt, target: targetKgt };
        try { if (db) await setDoc(getDocRef('tujuan', newId), newEntry); } catch(e) {}
        
        setTujuanList(prev => {
          const exists = prev.some(t => t.id === newId);
          if (exists) return prev.map(t => t.id === newId ? newEntry : t);
          return [newEntry, ...prev];
        });

        setSelectedStrategis(''); setSelectedProgram(''); setSelectedKegiatan(''); setIndikatorKgt(''); setTargetKgt(''); setEditTujuanId(null);
      }
    };
    
    const handleEditTujuan = (item) => {
      setEditTujuanId(item.id);
      setIndikatorKgt(item.indikator);
      setTargetKgt(item.target);
    };

    const handleDeleteTujuan = async (id) => { 
      try { if (db) await deleteDoc(getDocRef('tujuan', id)); } catch(e) {}
      setTujuanList(prev => prev.filter(t => t.id !== id));
    };

    const unitTujuanList = tujuanList.filter(t => t.unit === currentUser.nama && t.tahun === currentUser.tahun);

    return (
      <div className="max-w-6xl space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">1. Penetapan Tujuan (Tahun {currentUser?.tahun})</h2></div>
        <form onSubmit={handleSaveTujuan} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">1. Sasaran Strategis K/L</label>
              <select required value={selectedStrategis} onChange={(e) => { setSelectedStrategis(e.target.value); setSelectedProgram(''); setSelectedKegiatan(''); }} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-white"><option value="">-- Pilih --</option>{uniqueStrategis.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">2. Sasaran Program</label>
              <select required value={selectedProgram} onChange={(e) => { setSelectedProgram(e.target.value); setSelectedKegiatan(''); }} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-white" disabled={!selectedStrategis}><option value="">-- Pilih --</option>{uniqueProgram.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">3. Sasaran Kegiatan</label>
              <select required value={selectedKegiatan} onChange={(e) => setSelectedKegiatan(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-white" disabled={!selectedProgram}><option value="">-- Pilih --</option>{uniqueKegiatan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div><label className="block text-xs font-semibold uppercase mb-1">Indikator IKU Unit</label><input required type="text" value={indikatorKgt} onChange={(e) => setIndikatorKgt(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
              <div><label className="block text-xs font-semibold uppercase mb-1">Target & Satuan</label><input required type="text" value={targetKgt} onChange={(e) => setTargetKgt(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
            </div>
          <div className="pt-2 flex justify-end gap-2">
            {editTujuanId && <button type="button" onClick={() => setEditTujuanId(null)} className="bg-slate-100 px-4 py-2 rounded-xl text-sm cursor-pointer">Batal</button>}
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer"><PlusCircle size={16} /> {editTujuanId ? 'Update Tujuan' : 'Simpan'}</button>
          </div>
        </form>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead><tr className="border-b border-slate-200 text-xs text-slate-600 bg-slate-50"><th className="p-3">ID</th><th className="p-3">Strategis</th><th className="p-3">Kegiatan & Indikator</th><th className="p-3 text-center">Target</th><th className="p-3 text-center">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {unitTujuanList.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{item.id}</td><td className="p-3">{item.strategis}</td><td className="p-3"><strong>{item.kegiatan}</strong><br/><span className="text-teal-700">IKU: {item.indikator}</span></td><td className="p-3 text-center"><span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg font-bold border border-teal-200">{item.target}</span></td>
                  <td className="p-3 text-center space-x-1">
                    <button type="button" onClick={() => handleEditTujuan(item)} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg cursor-pointer"><Edit size={14}/></button>
                    <button type="button" onClick={() => handleDeleteTujuan(item.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const IdentifikasiRisiko = () => {
    const unitTujuanList = tujuanList.filter(t => t.unit === currentUser.nama && t.tahun === currentUser.tahun);
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const [editRiskId, setEditRiskId] = useState(null);
    const [formRisk, setFormRisk] = useState({ 
      indikatorKgt: unitTujuanList[0]?.indikator || '', 
      sasaranKgt: unitTujuanList[0]?.kegiatan || '', 
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
        sasaranKgt: found ? found.kegiatan : prev.sasaranKgt
      }));
    };

    const handleSaveRisk = async (e) => {
      e.preventDefault();
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
        sasaranKgt: unitTujuanList[0]?.kegiatan || '', 
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
    };

    const handleEditRisk = (item) => {
      setEditRiskId(item.id);
      setFormRisk({ ...item, indikatorKgt: item.indikatorKgt || '', sasaranKgt: item.sasaranKgt || '' });
    };

    const handleDeleteRisk = async (id) => { 
      try { if (db) await deleteDoc(getDocRef('risks', id)); } catch(e) {}
      setRisks(prev => prev.filter(r => r.id !== id));
    };

    return (
      <div className="max-w-6xl space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">2. Identifikasi Risiko (Tahun {currentUser?.tahun})</h2></div>
        <form onSubmit={handleSaveRisk} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Indikator Sasaran Kegiatan (IKU)</label>
              <select required value={formRisk.indikatorKgt} onChange={(e) => handleIndikatorChange(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white outline-none">
                {unitTujuanList.map((t, i) => <option key={i} value={t.indikator}>{t.indikator}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Sasaran Kegiatan</label>
              <input type="text" value={formRisk.sasaranKgt} readOnly className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-600" />
            </div>
          </div>
          <div><label className="block text-xs font-semibold mb-1">Permasalahan</label><textarea required rows="2" value={formRisk.permasalahan} onChange={(e) => setFormRisk({...formRisk, permasalahan: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-xs font-semibold mb-1">Pernyataan Risiko</label><textarea required rows="2" value={formRisk.pernyataanRisiko} onChange={(e) => {
              const val = e.target.value;
              setFormRisk(prev => ({ ...prev, pernyataanRisiko: val, sisaRisiko: prev.penilaianPengendalian === 'Belum Memadai' ? val : prev.sisaRisiko }));
            }} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-xs font-semibold mb-1">Kategori Risiko</label><select required value={formRisk.kategoriRisiko} onChange={(e) => setFormRisk({...formRisk, kategoriRisiko: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white"><option value="Operasional">Operasional</option><option value="Kepatuhan">Kepatuhan</option><option value="Strategis">Strategis</option><option value="Fraud">Fraud</option></select></div>
            <div><label className="block text-xs font-semibold mb-1">Pemilik Risiko</label><input required type="text" value={formRisk.pemilikRisiko} onChange={(e) => setFormRisk({...formRisk, pemilikRisiko: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input required type="text" value={formRisk.penyebabUraian} onChange={(e) => setFormRisk({...formRisk, penyebabUraian: e.target.value})} placeholder="Uraian Penyebab" className="p-2 text-xs border border-slate-200 rounded-lg bg-white" />
            <input required type="text" value={formRisk.penyebabSumber} onChange={(e) => setFormRisk({...formRisk, penyebabSumber: e.target.value})} placeholder="Sumber Penyebab" className="p-2 text-xs border border-slate-200 rounded-lg bg-white" />
            <select value={formRisk.sifatKontrol} onChange={(e) => setFormRisk({...formRisk, sifatKontrol: e.target.value})} className="p-2 text-xs border border-slate-200 rounded-lg bg-white"><option value="Controllable">Controllable</option><option value="Uncontrollable">Uncontrollable</option></select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input required type="text" value={formRisk.dampakUraian} onChange={(e) => setFormRisk({...formRisk, dampakUraian: e.target.value})} placeholder="Uraian Dampak" className="p-2 text-xs border border-slate-200 rounded-lg bg-white" />
            <input required type="text" value={formRisk.dampakPihak} onChange={(e) => setFormRisk({...formRisk, dampakPihak: e.target.value})} placeholder="Pihak yang Terkena" className="p-2 text-xs border border-slate-200 rounded-lg bg-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Pengendalian</label>
              <textarea required rows="2" value={formRisk.pengendalianRisiko} onChange={(e) => setFormRisk({...formRisk, pengendalianRisiko: e.target.value})} placeholder="Pengendalian" className="w-full p-3 text-sm border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Penilaian Pengendalian</label>
              <select required value={formRisk.penilaianPengendalian || ''} onChange={(e) => {
                const val = e.target.value;
                setFormRisk(prev => ({
                  ...prev,
                  penilaianPengendalian: val,
                  sisaRisiko: val === 'Memadai' ? '-' : (val === 'Belum Memadai' ? prev.pernyataanRisiko : '')
                }));
              }} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white outline-none">
                <option value="">-- Pilih --</option>
                <option value="Memadai">Memadai</option>
                <option value="Belum Memadai">Belum Memadai</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Sisa Risiko</label>
              <textarea required rows="2" value={formRisk.sisaRisiko} onChange={(e) => setFormRisk({...formRisk, sisaRisiko: e.target.value})} placeholder="Sisa Risiko otomatis..." className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500" readOnly />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editRiskId && <button type="button" onClick={() => setEditRiskId(null)} className="bg-slate-100 px-4 py-2 rounded-xl text-sm cursor-pointer">Batal</button>}
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer"><Save size={16} /> {editRiskId ? 'Update Risiko' : 'Simpan'}</button>
          </div>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-600">
                  <th className="border border-slate-200 p-3 w-16">ID</th>
                  <th className="border border-slate-200 p-3">Sasaran Kegiatan</th>
                  <th className="border border-slate-200 p-3">Indikator Sasaran Kegiatan (IKU)</th>
                  <th className="border border-slate-200 p-3">Pernyataan Risiko</th>
                  <th className="border border-slate-200 p-3">Kategori</th>
                  <th className="border border-slate-200 p-3">Kendali</th>
                  <th className="border border-slate-200 p-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitRisks.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-3 font-bold">{item.id}</td>
                    <td className="border border-slate-200 p-3 text-slate-700 font-medium">{item.sasaranKgt}</td>
                    <td className="border border-slate-200 p-3 text-teal-700 font-medium">{item.indikatorKgt}</td>
                    <td className="border border-slate-200 p-3 font-bold text-teal-800">{item.pernyataanRisiko}</td>
                    <td className="border border-slate-200 p-3">{item.kategoriRisiko}</td>
                    <td className="border border-slate-200 p-3">{item.sifatKontrol}</td>
                    <td className="border border-slate-200 p-3 text-center space-x-1">
                      <button type="button" onClick={() => handleEditRisk(item)} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg cursor-pointer"><Edit size={14}/></button>
                      <button type="button" onClick={() => handleDeleteRisk(item.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
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

    const handleSaveAnalisis = async (id) => {
      const risk = localRisks.find(r => r.id === id);
      const skor = calculateSkorRisiko(risk.kemungkinan, risk.keparahan);
      const levelRisiko = calculateLevelRisiko(skor);
      const keputusanMitigasi = skor > 12 ? "Dimitigasi" : "Tidak Dimitigasi";
      const updatedRisk = { ...risk, kemungkinan: risk.kemungkinan, keparahan: risk.keparahan, skor, levelRisiko, keputusanMitigasi, tahap: 'analisis' };
      try { if (db) await setDoc(getDocRef('risks', id), updatedRisk); } catch(e) {}
      
      setRisks(prev => prev.map(r => r.id === id ? updatedRisk : r));
      showAlert('Berhasil', 'Analisis risiko berhasil disimpan!', 'success');
    };

    return (
      <div className="max-w-6xl space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">3. Analisis & Evaluasi</h2></div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">Formulir Skala Kemungkinan & Dampak</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 min-w-[1250px]">
              <thead><tr className="bg-slate-50 text-xs uppercase text-slate-600"><th className="border border-slate-200 p-3 w-16">ID</th><th className="border border-slate-200 p-3 w-60">Pernyataan Risiko</th><th className="border border-slate-200 p-3 w-32">K (1-5)</th><th className="border border-slate-200 p-3 w-32">D (1-5)</th><th className="border border-slate-200 p-3 w-28 text-center">Skor</th><th className="border border-slate-200 p-3 w-36 text-center">Level</th><th className="border border-slate-200 p-3 w-28 text-center">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {localRisks.map((risk) => {
                  const s = calculateSkorRisiko(risk.kemungkinan, risk.keparahan);
                  const l = calculateLevelRisiko(s);
                  return (
                    <tr key={risk.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-3 font-bold text-center">{risk.id}</td>
                      <td className="border border-slate-200 p-3 font-bold">{risk.pernyataanRisiko}</td>
                      <td className="border border-slate-200 p-3 text-center"><select value={risk.kemungkinan || 0} onChange={(e) => handleSelectChange(risk.id, 'kemungkinan', e.target.value)} className="p-2 border border-slate-200 rounded-lg"><option value="0">-</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></td>
                      <td className="border border-slate-200 p-3 text-center"><select value={risk.keparahan || 0} onChange={(e) => handleSelectChange(risk.id, 'keparahan', e.target.value)} className="p-2 border border-slate-200 rounded-lg"><option value="0">-</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-base">{s > 0 ? s : '-'}</td>
                      <td className="border border-slate-200 p-3 text-center"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${getStatusColor(l)}`}>{l}</span></td>
                      <td className="border border-slate-200 p-3 text-center"><button type="button" onClick={() => handleSaveAnalisis(risk.id)} className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg mx-auto border border-teal-200 font-medium hover:bg-teal-100 cursor-pointer">Simpan</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
          <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">Pratinjau Tabel Analisis & Evaluasi Risiko</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 min-w-[1250px]">
              <thead><tr className="bg-slate-50 text-xs uppercase text-slate-600"><th className="border border-slate-200 p-3 w-16">ID</th><th className="border border-slate-200 p-3">Pernyataan Risiko</th><th className="border border-slate-200 p-3 text-center">K</th><th className="border border-slate-200 p-3 text-center">D</th><th className="border border-slate-200 p-3 text-center">Skor</th><th className="border border-slate-200 p-3 text-center">Level Risiko</th><th className="border border-slate-200 p-3 text-center">Keputusan Mitigasi</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitRisks.filter(r => r.skor > 0).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-3 font-bold text-center">{r.id}</td>
                    <td className="border border-slate-200 p-3 font-semibold">{r.pernyataanRisiko}</td>
                    <td className="border border-slate-200 p-3 text-center font-bold">{r.kemungkinan}</td>
                    <td className="border border-slate-200 p-3 text-center font-bold">{r.keparahan}</td>
                    <td className="border border-slate-200 p-3 text-center font-bold">{r.skor}</td>
                    <td className="border border-slate-200 p-3 text-center"><span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${getStatusColor(r.levelRisiko)}`}>{r.levelRisiko}</span></td>
                    <td className="border border-slate-200 p-3 text-center font-medium">{r.keputusanMitigasi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const PenangananRisiko = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun && r.keputusanMitigasi === "Dimitigasi");
    const [localRisks, setLocalRisks] = useState([]);
    useEffect(() => { setLocalRisks(unitRisks); }, [risks]);

    const handleFieldChange = (id, field, value) => { setLocalRisks(localRisks.map(r => r.id === id ? { ...r, [field]: value } : r)); };
    const handleSaveRTP = async (id) => { 
      const risk = localRisks.find(r => r.id === id); 
      const updated = { ...risk, tahap: 'selesai' };
      try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
      setRisks(prev => prev.map(r => r.id === id ? updated : r));
      showAlert('Berhasil', 'RTP berhasil diperbarui!', 'success'); 
    };
    const handleDeleteRTP = (id) => {
      showConfirm('Kosongkan RTP', 'Kosongkan Rencana Tindak Pengendalian ini?', async () => {
        const risk = risks.find(r => r.id === id);
        const updated = { ...risk, rtp: '', penanggungJawab: '', targetWaktu: '', komunikasi: '' };
        try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
        setRisks(prev => prev.map(r => r.id === id ? updated : r));
      });
    };

    return (
      <div className="max-w-6xl space-y-8">
        <div><h2 className="text-2xl font-bold text-slate-800">4. Penanganan Risiko</h2></div>
        {localRisks.map((risk) => (
          <div key={risk.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">{risk.pernyataanRisiko} <span className="text-xs text-rose-500 font-semibold">({risk.skor})</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold mb-1">RTP</label><textarea value={risk.rtp || ''} onChange={(e) => handleFieldChange(risk.id, 'rtp', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              <div><label className="block text-xs font-semibold mb-1">Penanggung Jawab</label><input value={risk.penanggungJawab || ''} onChange={(e) => handleFieldChange(risk.id, 'penanggungJawab', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              <div><label className="block text-xs font-semibold mb-1">Target Waktu</label><input value={risk.targetWaktu || ''} onChange={(e) => handleFieldChange(risk.id, 'targetWaktu', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              <div><label className="block text-xs font-semibold mb-1">Komunikasi</label><input value={risk.komunikasi || ''} onChange={(e) => handleFieldChange(risk.id, 'komunikasi', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => handleDeleteRTP(risk.id)} className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-sm flex gap-1 items-center font-medium cursor-pointer"><Trash2 size={16} /> Hapus RTP</button>
              <button type="button" onClick={() => handleSaveRTP(risk.id)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm flex gap-2 items-center font-medium shadow-sm cursor-pointer"><Save size={16} /> Update RTP</button>
            </div>
          </div>
        ))}
        
        {localRisks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">Tabel Dinamis Rencana Tindak Pengendalian (RTP)</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 min-w-[1300px]">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-700 uppercase">
                    <th className="border border-slate-200 p-3 w-16 text-center">ID</th>
                    <th className="border border-slate-200 p-3 w-64">Pernyataan Risiko</th>
                    <th className="border border-slate-200 p-3 w-28 text-center">Skor / Level</th>
                    <th className="border border-slate-200 p-3">Rencana Tindak Pengendalian (RTP)</th>
                    <th className="border border-slate-200 p-3 w-40">Penanggung Jawab</th>
                    <th className="border border-slate-200 p-3 w-32 text-center">Target Waktu</th>
                    <th className="border border-slate-200 p-3 w-40">Komunikasi</th>
                    <th className="border border-slate-200 p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {localRisks.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-3 font-bold text-center">{item.id}</td>
                      <td className="border border-slate-200 p-3 font-semibold text-slate-900">{item.pernyataanRisiko}</td>
                      <td className="border border-slate-200 p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getStatusColor(item.levelRisiko)}`}>{item.skor} ({item.levelRisiko})</span>
                      </td>
                      <td className="border border-slate-200 p-3 text-teal-900 font-medium">{item.rtp || <span className="text-slate-400 italic">Belum diisi</span>}</td>
                      <td className="border border-slate-200 p-3">{item.penanggungJawab || <span className="text-slate-400 italic">-</span>}</td>
                      <td className="border border-slate-200 p-3 text-center">{item.targetWaktu || <span className="text-slate-400 italic">-</span>}</td>
                      <td className="border border-slate-200 p-3">{item.komunikasi || <span className="text-slate-400 italic">-</span>}</td>
                      <td className="border border-slate-200 p-3 text-center space-x-1">
                        <button type="button" onClick={() => handleDeleteRTP(item.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PemantauanRisiko = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun && r.keputusanMitigasi === "Dimitigasi");
    const [localRisks, setLocalRisks] = useState([]);
    useEffect(() => { setLocalRisks(unitRisks); }, [risks]);
    const handleFieldChange = (id, field, value) => { setLocalRisks(localRisks.map(r => r.id === id ? { ...r, [field]: value } : r)); };
    
    const handleSavePemantauan = async (id) => { 
      const risk = localRisks.find(r => r.id === id); 
      try { if (db) await setDoc(getDocRef('risks', id), risk); } catch(e) {}
      setRisks(prev => prev.map(r => r.id === id ? risk : r));
      showAlert('Berhasil', 'Progres berhasil disimpan!', 'success'); 
    };
    
    const handleDeletePemantauan = (id) => {
      showConfirm('Hapus Progres', 'Kosongkan progres pemantauan dan link eviden?', async () => {
        const risk = risks.find(r => r.id === id);
        const updated = { ...risk, prosesRtp: '', linkEviden: '' };
        try { if (db) await setDoc(getDocRef('risks', id), updated); } catch(e) {}
        setRisks(prev => prev.map(r => r.id === id ? updated : r));
      });
    };

    return (
      <div className="max-w-6xl space-y-8">
        <div><h2 className="text-2xl font-bold text-slate-800">5. Pemantauan RTP & Eviden</h2></div>
        {localRisks.map((risk) => (
          <div key={risk.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">{risk.pernyataanRisiko}</h3>
            <p className="text-xs p-3 bg-teal-50 text-teal-900 rounded-xl border border-teal-100 font-medium">RTP: {risk.rtp}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold mb-1">Proses/Progres RTP</label><textarea rows="2" value={risk.prosesRtp || ''} onChange={(e) => handleFieldChange(risk.id, 'prosesRtp', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              <div><label className="block text-xs font-semibold mb-1">Link Eviden</label><input type="url" value={risk.linkEviden || ''} onChange={(e) => handleFieldChange(risk.id, 'linkEviden', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => handleDeletePemantauan(risk.id)} className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-sm flex gap-1 items-center font-medium cursor-pointer"><Trash2 size={16} /> Hapus Progres</button>
              <button type="button" onClick={() => handleSavePemantauan(risk.id)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm flex gap-2 items-center font-medium shadow-sm cursor-pointer"><Save size={16} /> Simpan Progres</button>
            </div>
          </div>
        ))}

        {localRisks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">Pratinjau Tabel Pemantauan RTP</h3></div>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead><tr className="bg-slate-50 uppercase text-slate-700"><th className="p-3 border border-slate-200">ID</th><th className="p-3 border border-slate-200">Pernyataan Risiko</th><th className="p-3 border border-slate-200">Progres RTP</th><th className="p-3 border border-slate-200">Link Eviden</th><th className="p-3 border border-slate-200 text-center w-24">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {localRisks.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 border border-slate-200 font-bold text-center">{r.id}</td>
                    <td className="p-3 border border-slate-200 font-semibold">{r.pernyataanRisiko}</td>
                    <td className="p-3 border border-slate-200">{r.prosesRtp || '-'}</td>
                    <td className="p-3 border border-slate-200 text-teal-600 truncate max-w-xs">{r.linkEviden || '-'}</td>
                    <td className="p-3 border border-slate-200 text-center space-x-1">
                      <button type="button" onClick={() => handleDeletePemantauan(r.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

    const handleSaveKejadian = async (e) => {
      e.preventDefault();
      const riskObj = unitRisks.find(r => r.id === formKejadian.riskId);
      const newId = editKejadianId || `KJG-${Date.now()}`;
      const newEntry = { id: newId, unit: currentUser.nama, tahun: currentUser.tahun, risiko: riskObj?.pernyataanRisiko || '-', ...formKejadian };
      try { if (db) await setDoc(getDocRef('kejadian', newId), newEntry); } catch(e) {}
      
      setKejadianList(prev => {
        const exists = prev.some(k => k.id === newId);
        if (exists) return prev.map(k => k.id === newId ? newEntry : k);
        return [newEntry, ...prev];
      });

      setEditKejadianId(null);
      setFormKejadian({ riskId: unitRisks[0]?.id || '', tanggal: '', kronologi: '', penyebab: '', dampakRiil: '' });
    };

    const handleEditKejadian = (item) => {
      setEditKejadianId(item.id);
      setFormKejadian(item);
    };

    const handleDeleteKejadian = async (id) => { 
      try { if (db) await deleteDoc(getDocRef('kejadian', id)); } catch(e) {}
      setKejadianList(prev => prev.filter(k => k.id !== id));
    };

    return (
      <div className="max-w-6xl space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">6. Pencatatan Keterjadian Risiko</h2></div>
        <form onSubmit={handleSaveKejadian} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold mb-1">Pilih Risiko</label><select required value={formKejadian.riskId} onChange={(e) => setFormKejadian({...formKejadian, riskId: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white outline-none">{unitRisks.map(r => <option key={r.id} value={r.id}>{r.id} - {r.pernyataanRisiko}</option>)}</select></div>
            <div><label className="block text-xs font-semibold mb-1">Tanggal</label><input required type="date" value={formKejadian.tanggal} onChange={(e) => setFormKejadian({...formKejadian, tanggal: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
            <div className="md:col-span-2"><label className="block text-xs font-semibold mb-1">Kronologi</label><textarea required rows="2" value={formKejadian.kronologi} onChange={(e) => setFormKejadian({...formKejadian, kronologi: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-xs font-semibold mb-1">Penyebab</label><textarea required rows="2" value={formKejadian.penyebab} onChange={(e) => setFormKejadian({...formKejadian, penyebab: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
            <div><label className="block text-xs font-semibold mb-1">Dampak Riil</label><textarea required rows="2" value={formKejadian.dampakRiil} onChange={(e) => setFormKejadian({...formKejadian, dampakRiil: e.target.value})} className="w-full p-3 text-sm border border-slate-200 rounded-xl" /></div>
          </div>
          <div className="flex justify-end gap-2">
            {editKejadianId && <button type="button" onClick={() => setEditKejadianId(null)} className="bg-slate-100 px-4 py-2 rounded-xl text-sm cursor-pointer">Batal</button>}
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm flex gap-2 items-center font-medium shadow-sm cursor-pointer"><Save size={16} /> {editKejadianId ? 'Update Kejadian' : 'Rekam Kejadian'}</button>
          </div>
        </form>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse border border-slate-200 text-xs">
            <thead><tr className="bg-slate-50 uppercase text-slate-700"><th className="p-3 border border-slate-200">Tanggal</th><th className="p-3 border border-slate-200">Risiko</th><th className="p-3 border border-slate-200">Dampak</th><th className="p-3 border border-slate-200 text-center w-24">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {unitKejadian.map(k => (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="p-3 border border-slate-200">{k.tanggal}</td>
                  <td className="p-3 border border-slate-200 font-bold">{k.risiko}</td>
                  <td className="p-3 border border-slate-200 text-rose-700 font-medium">{k.dampakRiil}</td>
                  <td className="p-3 border border-slate-200 text-center space-x-1">
                    <button type="button" onClick={() => handleEditKejadian(k)} className="p-1.5 bg-teal-50 text-teal-700 rounded-lg cursor-pointer"><Edit size={14}/></button>
                    <button type="button" onClick={() => handleDeleteKejadian(k.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const EfektivitasRTP = () => {
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun && r.keputusanMitigasi === "Dimitigasi");
    const [evaluasiList, setEvaluasiList] = useState({});
    const handleSelectEv = (id, field, val) => { setEvaluasiList({ ...evaluasiList, [id]: { kDiharapkan: 3, dDiharapkan: 3, kActual: 3, dActual: 3, ...(evaluasiList[id] || {}), [field]: val } }); };

    const handleSaveEv = async (risk) => {
      const ev = evaluasiList[risk.id] || { kDiharapkan: 3, dDiharapkan: 3, kActual: 3, dActual: 3 };
      const srAwal = risk.skor || 0;
      const srDiharapkan = calculateSkorRisiko(parseInt(ev.kDiharapkan), parseInt(ev.dDiharapkan));
      const srActual = calculateSkorRisiko(parseInt(ev.kActual), parseInt(ev.dActual));
      const deviasi = srDiharapkan - srActual;
      const newId = `EFK-${risk.id}`;
      const newEntry = { id: newId, riskId: risk.id, pernyataanRisiko: risk.pernyataanRisiko, srAwal, srDiharapkan, srActual, deviasi, ...ev };
      try { if (db) await setDoc(getDocRef('efektivitas', newId), newEntry); } catch(e) {}
      
      setRiwayatEfektivitas(prev => {
        const exists = prev.some(e => e.id === newId);
        if (exists) return prev.map(e => e.id === newId ? newEntry : e);
        return [newEntry, ...prev];
      });

      showAlert('Berhasil', 'Penilaian efektifitas disimpan!', 'success');
    };

    const handleDeleteEv = async (id) => { 
      try { if (db) await deleteDoc(getDocRef('efektivitas', id)); } catch(e) {}
      setRiwayatEfektivitas(prev => prev.filter(e => e.id !== id));
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
        'Teruskan Risiko', 
        `Skala Aktual (${ev.srActual}) masih lebih tinggi dari Target (${ev.srDiharapkan}). Yakin ingin meneruskan risiko ini ke tahun pengelolaan ${nextYear}? Data akan dikembalikan ke tahap Identifikasi untuk dianalisis ulang.`,
        async () => {
          const newRiskId = `RSK-${Date.now()}`;
          const newRisk = {
            ...originalRisk,
            id: newRiskId,
            tahun: nextYear,
            tahap: 'identifikasi',
            kemungkinan: 0,
            keparahan: 0,
            skor: 0,
            status: "Belum Dianalisis",
            levelRisiko: "Belum Dianalisis",
            keputusanMitigasi: "-",
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
            showAlert('Berhasil', `Risiko berhasil diteruskan ke tahun ${nextYear}. Silakan login di tahun tersebut untuk melihatnya di menu Identifikasi.`, 'success');
          } catch (err) {
            showAlert('Error', 'Gagal meneruskan data risiko.', 'error');
          }
        }
      );
    };

    const unitEfektivitas = riwayatEfektivitas.filter(e => { const r = risks.find(x => x.id === e.riskId); return r && r.unit === currentUser.nama && r.tahun === currentUser.tahun; });

    return (
      <div className="max-w-6xl space-y-8">
        <div><h2 className="text-2xl font-bold text-slate-800">7. Efektifitas RTP (Tahun {currentUser?.tahun})</h2></div>
        {unitRisks.map(risk => {
          const ev = evaluasiList[risk.id] || { kDiharapkan: 3, dDiharapkan: 3, kActual: 3, dActual: 3 };
          return (
            <div key={risk.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">{risk.pernyataanRisiko} <span className="text-xs font-semibold text-slate-500">(Awal: {risk.skor})</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div><p className="text-xs font-bold mb-2 text-slate-700">Target (K / D)</p><select value={ev.kDiharapkan} onChange={(e) => handleSelectEv(risk.id, 'kDiharapkan', e.target.value)} className="p-2 border border-slate-200 rounded-lg mr-2 bg-white">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select><select value={ev.dDiharapkan} onChange={(e) => handleSelectEv(risk.id, 'dDiharapkan', e.target.value)} className="p-2 border border-slate-200 rounded-lg bg-white">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div>
                <div><p className="text-xs font-bold mb-2 text-slate-700">Actual (K / D)</p><select value={ev.kActual} onChange={(e) => handleSelectEv(risk.id, 'kActual', e.target.value)} className="p-2 border border-slate-200 rounded-lg mr-2 bg-white">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select><select value={ev.dActual} onChange={(e) => handleSelectEv(risk.id, 'dActual', e.target.value)} className="p-2 border border-slate-200 rounded-lg bg-white">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-semibold mb-1">Kondisi Setelah Mitigasi</label><textarea rows="1" value={ev.kondisiSetelahMitigasi || ''} onChange={(e) => handleSelectEv(risk.id, 'kondisiSetelahMitigasi', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              <div><label className="block text-xs font-semibold mb-1">Langkah Perbaikan</label><textarea rows="1" value={ev.langkahPerbaikan || ''} onChange={(e) => handleSelectEv(risk.id, 'langkahPerbaikan', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              <div className="flex justify-end"><button type="button" onClick={() => handleSaveEv(risk)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm flex gap-2 items-center font-medium shadow-sm cursor-pointer"><Save size={16} /> Simpan Penilaian</button></div>
            </div>
          );
        })}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
          <table className="w-full text-left border-collapse border border-slate-200 text-xs">
            <thead><tr className="bg-slate-50 uppercase text-slate-700"><th className="p-3 border border-slate-200">Risk ID</th><th className="p-3 border border-slate-200 text-center">SR Awal</th><th className="p-3 border border-slate-200 text-center">Target</th><th className="p-3 border border-slate-200 text-center">Actual</th><th className="p-3 border border-slate-200 text-center">Deviasi</th><th className="p-3 border border-slate-200 text-center w-36">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {unitEfektivitas.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3 border border-slate-200 font-bold text-center">{e.riskId}</td>
                  <td className="p-3 border border-slate-200 text-center">{e.srAwal}</td>
                  <td className="p-3 border border-slate-200 text-center text-teal-700 font-semibold">{e.srDiharapkan}</td>
                  <td className="p-3 border border-slate-200 text-center text-cyan-700 font-semibold">{e.srActual}</td>
                  <td className="p-3 border border-slate-200 text-center text-emerald-800 font-bold">{e.deviasi}</td>
                  <td className="p-3 border border-slate-200 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {e.srActual > e.srDiharapkan && (
                        <button 
                          type="button" 
                          onClick={() => handleTeruskanRisiko(e)} 
                          className="px-2 py-1.5 bg-amber-50 text-amber-700 rounded-lg cursor-pointer border border-amber-200 hover:bg-amber-100 flex items-center gap-1 text-[10px] font-bold whitespace-nowrap" 
                          title={`Teruskan ke Tahun ${parseInt(currentUser.tahun) + 1}`}
                        >
                          <Calendar size={12} /> Teruskan ({parseInt(currentUser.tahun) + 1})
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteEv(e.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ModulLaporan = () => {
    const unitTujuanList = tujuanList.filter(t => t.unit === currentUser.nama && t.tahun === currentUser.tahun);
    const unitRisks = risks.filter(r => r.unit === currentUser.nama && r.tahun === currentUser.tahun);
    const unitKejadian = kejadianList.filter(k => k.unit === currentUser.nama && k.tahun === currentUser.tahun);
    const unitEfektivitas = riwayatEfektivitas.filter(e => {
      const parentRisk = risks.find(r => r.id === e.riskId);
      return parentRisk && parentRisk.unit === currentUser.nama && parentRisk.tahun === currentUser.tahun;
    });

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
                <tr><td colspan="16" class="title" style="font-size:12px;color:#0d9488;">LAPORAN PETA REGISTER RISIKO UNIT KERJA (${currentUser.nama.toUpperCase()})</td></tr>
                <tr><td colspan="16" class="title" style="font-size:11px;color:#6b7280;">TAHUN ANGGARAN ${currentUser.tahun}</td></tr>
                <tr><td colspan="16" style="border:none;"></td></tr>
                <tr>
          `;
          const headers = ['No', 'Sasaran Kegiatan', 'Indikator Sasaran Kegiatan (IKU)', 'Sumber Risiko', 'Kategori Risiko', 'Risiko', 'Penyebab', 'Dampak', 'Pengendalian yang ada', 'Sisa Risiko', 'Pemilik Risiko', 'K', 'D', 'Skala Risiko', 'Level Risiko'];
          headers.forEach(h => { html += `<td class="head">${h}</td>`; });
          html += '</tr>';

          unitRisks.forEach((risk, index) => {
            html += `<tr>
              <td class="data" align="center">${index + 1}</td>
              <td class="data">${risk.sasaranKgt || '-'}</td>
              <td class="data">${risk.indikatorKgt || '-'}</td>
              <td class="data">${risk.penyebabSumber || '-'}</td>
              <td class="data">${risk.kategoriRisiko || '-'}</td>
              <td class="data" style="font-weight:bold;">${risk.pernyataanRisiko || '-'}</td>
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
                <tr><td colspan="11" style="border:none;"></td><td colspan="5" class="sign">Kepala ${currentUser.nama}</td></tr>
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
                <tr><td colspan="7" class="title" style="font-size:12px;color:#0d9488;">LAPORAN PEMANTAUAN RTP UNIT KERJA (${currentUser.nama.toUpperCase()})</td></tr>
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
                <tr><td colspan="3" style="border:none;"></td><td colspan="4" class="sign">Kepala ${currentUser.nama}</td></tr>
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
                <tr><td colspan="6" class="title" style="font-size:12px;color:#0d9488;">LAPORAN PENCATATAN KETERJADIAN RISIKO (${currentUser.nama.toUpperCase()})</td></tr>
                <tr><td colspan="6" class="title" style="font-size:11px;color:#6b7280;">TAHUN ANGGARAN ${currentUser.tahun}</td></tr>
                <tr><td colspan="6" style="border:none;"></td></tr>
                <tr style="background:#f3f4f6;font-weight:bold;">
                  <td class="head">No</td><td class="head">Tanggal</td><td class="head">Pernyataan Risiko</td><td class="head">Kronologi</td><td class="head">Penyebab</td><td class="head">Dampak Riil</td>
                </tr>
          `;
          unitKejadian.forEach((k, idx) => {
            html += `<tr>
              <td class="data" align="center">${idx + 1}</td>
              <td class="data" align="center">${k.tanggal}</td>
              <td class="data" style="font-weight:bold;">${k.risiko}</td>
              <td class="data">${k.kronologi}</td>
              <td class="data">${k.penyebab}</td>
              <td class="data">${k.dampakRiil}</td>
            </tr>`;
          });
          html += `
                <tr><td colspan="6" style="border:none;"></td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="3" class="sign">Jakarta, ${dateStr}</td></tr>
                <tr><td colspan="3" style="border:none;"></td><td colspan="3" class="sign">Kepala ${currentUser.nama}</td></tr>
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
                <tr><td colspan="8" class="title" style="font-size:12px;color:#0d9488;">LAPORAN EFEKTIFITAS & DEVIASI RTP (${currentUser.nama.toUpperCase()})</td></tr>
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
                <tr><td colspan="4" style="border:none;"></td><td colspan="4" class="sign">Kepala ${currentUser.nama}</td></tr>
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
      <div className="space-y-6 max-w-7xl">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: landscape;
              margin: 8mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
              zoom: 75%;
            }
            aside, header, .print\\:hidden {
              display: none !important;
            }
            main, .flex-1, div {
              background: white !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            #report-container {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            #report-container table {
              width: 100% !important;
              min-width: auto !important;
              font-size: 7.5px !important;
              border-collapse: collapse !important;
            }
            #report-container th, #report-container td {
              padding: 2px 3px !important;
              word-break: break-word !important;
            }
            tr { 
              page-break-inside: avoid; 
              page-break-after: auto; 
            }
          }
        `}} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Modul Laporan Unit Kerja</h2>
            <p className="text-slate-500 text-sm mt-1">Unduh dokumen format resmi BPI.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleDownloadExcel} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer">
              <Download size={16} /> Unduh Excel
            </button>
            <button type="button" onClick={handleDownloadPDF} disabled={isPdfLoading} className={`${isPdfLoading ? 'bg-rose-400' : 'bg-rose-600 hover:bg-rose-700'} text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm cursor-pointer`}>
              {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              {isPdfLoading ? 'Mempersiapkan...' : 'Cetak / Simpan PDF'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 print:hidden">
          <button type="button" onClick={() => setSubReportTab('peta_risiko')} className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'peta_risiko' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Peta Risiko</button>
          <button type="button" onClick={() => setSubReportTab('pemantauan_rtp')} className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'pemantauan_rtp' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Pemantauan RTP</button>
          <button type="button" onClick={() => setSubReportTab('pencatatan_keterjadian')} className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'pencatatan_keterjadian' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Laporan Keterjadian</button>
          <button type="button" onClick={() => setSubReportTab('efektivitas_rtp')} className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${subReportTab === 'efektivitas_rtp' ? 'bg-white text-teal-700 border-b-2 border-teal-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Laporan Efektifitas</button>
        </div>
        
        <div id="report-container" className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="text-center space-y-1 pb-4">
            <h3 className="font-bold text-slate-900 text-base uppercase m-0 leading-tight">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL RI</h3>
            <h4 className="font-bold text-slate-800 text-sm uppercase m-0 leading-tight">BADAN PENGEMBANGAN DAN INFORMASI</h4>
            <h5 className="font-bold text-teal-800 text-sm uppercase pt-3 m-0 leading-tight">
              {subReportTab === 'peta_risiko' && `LAPORAN PETA REGISTER RISIKO (${currentUser?.nama.toUpperCase()})`}
              {subReportTab === 'pemantauan_rtp' && `LAPORAN PEMANTAUAN RTP (${currentUser?.nama.toUpperCase()})`}
              {subReportTab === 'pencatatan_keterjadian' && `LAPORAN PENCATATAN KETERJADIAN RISIKO (${currentUser?.nama.toUpperCase()})`}
              {subReportTab === 'efektivitas_rtp' && `LAPORAN EFEKTIFITAS & DEVIASI RTP (${currentUser?.nama.toUpperCase()})`}
            </h5>
            <p className="text-xs text-slate-500 m-0 pt-1">TAHUN ANGGARAN {currentUser?.tahun}</p>
          </div>

          {subReportTab === 'peta_risiko' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1600px] text-left border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                    <th className="border border-slate-400 p-2 text-center align-middle">No</th>
                    <th className="border border-slate-400 p-2 align-middle">Sasaran Kegiatan</th>
                    <th className="border border-slate-400 p-2 align-middle">Indikator Sasaran Kegiatan (IKU)</th>
                    <th className="border border-slate-400 p-2 align-middle">Sumber Risiko</th>
                    <th className="border border-slate-400 p-2 align-middle">Kategori Risiko</th>
                    <th className="border border-slate-400 p-2 align-middle">Risiko</th>
                    <th className="border border-slate-400 p-2 align-middle">Penyebab</th>
                    <th className="border border-slate-400 p-2 align-middle">Dampak</th>
                    <th className="border border-slate-400 p-2 align-middle">Pengendalian yang ada</th>
                    <th className="border border-slate-400 p-2 align-middle">Sisa Risiko</th>
                    <th className="border border-slate-400 p-2 align-middle">Pemilik Risiko</th>
                    <th className="border border-slate-400 p-2 text-center align-middle">K</th>
                    <th className="border border-slate-400 p-2 text-center align-middle">D</th>
                    <th className="border border-slate-400 p-2 text-center align-middle">Skala Risiko</th>
                    <th className="border border-slate-400 p-2 text-center align-middle">Level Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  {unitRisks.map((risk, index) => {
                    return (
                      <tr key={risk.id} className="hover:bg-slate-50">
                        <td className="border border-slate-400 p-2 text-center font-bold align-top">{index + 1}</td>
                        <td className="border border-slate-400 p-2 font-medium align-top">{risk.sasaranKgt || '-'}</td>
                        <td className="border border-slate-400 p-2 text-teal-700 align-top">{risk.indikatorKgt || '-'}</td>
                        <td className="border border-slate-400 p-2 align-top">{risk.penyebabSumber || '-'}</td>
                        <td className="border border-slate-400 p-2 font-semibold text-cyan-900 align-top">{risk.kategoriRisiko || 'Operasional'}</td>
                        <td className="border border-slate-400 p-2 font-bold text-slate-900 align-top">{risk.pernyataanRisiko}</td>
                        <td className="border border-slate-400 p-2 align-top">{risk.penyebabUraian}</td>
                        <td className="border border-slate-400 p-2 align-top">{risk.dampakUraian}</td>
                        <td className="border border-slate-400 p-2 align-top">{risk.pengendalianRisiko}</td>
                        <td className="border border-slate-400 p-2 align-top">{risk.sisaRisiko}</td>
                        <td className="border border-slate-400 p-2 align-top">{risk.pemilikRisiko}</td>
                        <td className="border border-slate-400 p-2 text-center font-bold align-top">{risk.kemungkinan || '-'}</td>
                        <td className="border border-slate-400 p-2 text-center font-bold align-top">{risk.keparahan || '-'}</td>
                        <td className="border border-slate-400 p-2 text-center font-bold bg-slate-50 align-top">{risk.skor > 0 ? risk.skor : '-'}</td>
                        <td className="border border-slate-400 p-2 text-center font-bold align-top">
                          {risk.skor > 0 ? <span className={`px-2 py-0.5 rounded text-[11px] border ${getStatusColor(risk.levelRisiko)}`}>{risk.levelRisiko}</span> : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {unitRisks.length === 0 && (
                    <tr><td colSpan="15" className="border border-slate-400 p-6 text-center text-slate-400 italic">Belum ada data risiko terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subReportTab === 'pemantauan_rtp' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1200px] text-left border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                    <th className="border border-slate-400 p-2 text-center w-12">No</th>
                    <th className="border border-slate-400 p-2 text-center w-24">ID Risiko</th>
                    <th className="border border-slate-400 p-2">Pernyataan Risiko</th>
                    <th className="border border-slate-400 p-2">RTP Awal</th>
                    <th className="border border-slate-400 p-2">Proses RTP / Progres</th>
                    <th className="border border-slate-400 p-2">Link Eviden</th>
                    <th className="border border-slate-400 p-2 text-center w-28">Level Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {unitRisks.filter(r => r.keputusanMitigasi === 'Dimitigasi').map((risk, index) => (
                    <tr key={risk.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-400 p-2 text-center font-semibold">{risk.id}</td>
                      <td className="border border-slate-400 p-2 font-bold">{risk.pernyataanRisiko}</td>
                      <td className="border border-slate-400 p-2">{risk.rtp || '-'}</td>
                      <td className="border border-slate-400 p-2">{risk.prosesRtp || <span className="text-slate-400 italic">Belum diisi</span>}</td>
                      <td className="border border-slate-400 p-2 text-teal-600 truncate max-w-xs">{risk.linkEviden || '-'}</td>
                      <td className="border border-slate-400 p-2 text-center font-bold"><span className={`px-2 py-0.5 rounded text-[11px] border ${getStatusColor(risk.levelRisiko)}`}>{risk.levelRisiko}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {subReportTab === 'pencatatan_keterjadian' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1000px] text-left border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                    <th className="border border-slate-400 p-2 text-center w-12">No</th>
                    <th className="border border-slate-400 p-2 text-center w-28">Tanggal</th>
                    <th className="border border-slate-400 p-2">Pernyataan Risiko</th>
                    <th className="border border-slate-400 p-2">Kronologi</th>
                    <th className="border border-slate-400 p-2">Penyebab</th>
                    <th className="border border-slate-400 p-2">Dampak Riil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {unitKejadian.map((k, index) => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-400 p-2 text-center font-semibold text-teal-800">{k.tanggal}</td>
                      <td className="border border-slate-400 p-2 font-bold">{k.risiko}</td>
                      <td className="border border-slate-400 p-2">{k.kronologi}</td>
                      <td className="border border-slate-400 p-2">{k.penyebab}</td>
                      <td className="border border-slate-400 p-2 text-rose-700 font-medium">{k.dampakRiil}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {subReportTab === 'efektivitas_rtp' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1200px] text-left border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px]">
                    <th className="border border-slate-400 p-2 text-center w-12">No</th>
                    <th className="border border-slate-400 p-2 text-center w-24">ID Risiko</th>
                    <th className="border border-slate-400 p-2">Pernyataan Risiko</th>
                    <th className="border border-slate-400 p-2">Kondisi Setelah Mitigasi</th>
                    <th className="border border-slate-400 p-2 text-center">SR Awal</th>
                    <th className="border border-slate-400 p-2 text-center">SR Diharapkan</th>
                    <th className="border border-slate-400 p-2 text-center">SR Actual</th>
                    <th className="border border-slate-400 p-2 text-center">Deviasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {unitEfektivitas.map((e, index) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-bold">{index + 1}</td>
                      <td className="border border-slate-400 p-2 text-center font-semibold">{e.riskId}</td>
                      <td className="border border-slate-400 p-2 font-bold">{e.pernyataanRisiko}</td>
                      <td className="border border-slate-400 p-2">{e.kondisiSetelahMitigasi || '-'}</td>
                      <td className="border border-slate-400 p-2 text-center font-bold">{e.srAwal}</td>
                      <td className="border border-slate-400 p-2 text-center font-bold text-teal-700">{e.srDiharapkan}</td>
                      <td className="border border-slate-400 p-2 text-center font-bold text-cyan-700">{e.srActual}</td>
                      <td className="border border-slate-400 p-2 text-center font-bold bg-slate-50 text-emerald-900">{e.deviasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-12 pb-4 flex justify-end">
            <div className="w-72 text-center space-y-16">
              <p className="text-xs text-slate-700 m-0">
                Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                <span className="font-bold">Kepala {currentUser?.nama}</span>
              </p>
              <div>
                <p className="font-bold underline text-xs text-slate-900 m-0">{currentUser?.namaPimpinan || '......................................'}</p>
                <p className="text-[11px] text-slate-600 m-0 pt-0.5">NIP. {currentUser?.nipPimpinan || '......................................'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const unitMenus = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'tujuan', label: '1. Penetapan Tujuan', icon: Target },
    { id: 'identifikasi', label: '2. Identifikasi Risiko', icon: Search }, { id: 'analisis', label: '3. Analisis & Evaluasi', icon: BarChart2 },
    { id: 'penanganan', label: '4. Penanganan Risiko', icon: ShieldCheck }, { id: 'pemantauan', label: '5. Pemantauan RTP & Eviden', icon: Activity },
    { id: 'kejadian', label: '6. Pencatatan Keterjadian', icon: AlertOctagon }, { id: 'efektivitas', label: '7. Efektifitas RTP', icon: CheckCircle2 },
    { id: 'laporan', label: '8. Modul Laporan', icon: FileText }
  ];

  if (!currentUser) return (
    <>
      {modal.isOpen && <PopupModal />}
      <LoginScreen />
    </>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {modal.isOpen && <PopupModal />}
      <aside className="w-72 bg-gradient-to-b from-teal-900 to-emerald-950 text-white hidden md:flex flex-col shadow-xl z-10 print:hidden">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-2"><ShieldAlert size={30} className="text-teal-400" /><h1 className="text-2xl font-bold tracking-wider">SI-MARI</h1></div>
          <p className="text-xs text-teal-100/80 border-t border-teal-800/60 pt-2 mt-2 font-medium">{currentUser.nama}</p>
          <div className="mt-2 inline-flex gap-1.5 bg-teal-500/20 text-teal-200 px-3 py-1 rounded-xl text-xs font-semibold border border-teal-500/30"><Calendar size={13} /> Tahun: {currentUser.tahun}</div>
        </div>
        <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto">
          {currentUser.role === 'admin' ? (
            <>
              <button type="button" onClick={() => setActiveTab('admin_users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'admin_users' ? 'bg-teal-700/80 text-white shadow-md font-semibold' : 'text-teal-100/70 hover:bg-teal-800/40 hover:text-white'}`}><Users size={18} /><span className="text-xs">User & Unit</span></button>
              <button type="button" onClick={() => setActiveTab('admin_sasaran')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'admin_sasaran' ? 'bg-teal-700/80 text-white shadow-md font-semibold' : 'text-teal-100/70 hover:bg-teal-800/40 hover:text-white'}`}><Compass size={18} /><span className="text-xs">Hierarki K/L</span></button>
              <button type="button" onClick={() => setActiveTab('admin_security')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'admin_security' ? 'bg-teal-700/80 text-white shadow-md font-semibold' : 'text-teal-100/70 hover:bg-teal-800/40 hover:text-white'}`}><KeyRound size={18} /><span className="text-xs">Keamanan Admin</span></button>
            </>
          ) : (
            unitMenus.map(menu => (<button type="button" key={menu.id} onClick={() => setActiveTab(menu.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === menu.id ? 'bg-teal-700/80 text-white shadow-md font-semibold' : 'text-teal-100/70 hover:bg-teal-800/40 hover:text-white'}`}><menu.icon size={18} /><span className="text-xs">{menu.label}</span></button>))
          )}
        </nav>
        <div className="p-4 m-3 bg-teal-950/60 rounded-2xl border border-teal-800/50 flex justify-between items-center shadow-inner">
          <div><p className="text-[10px] text-teal-400 uppercase tracking-wide font-semibold">Role:</p><p className="text-xs text-white font-bold uppercase">{currentUser.role}</p></div>
          <button type="button" onClick={() => { setCurrentUser(null); localStorage.removeItem('simari_current_user'); }} className="p-2.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-xl transition-colors cursor-pointer" title="Keluar"><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        <header className="bg-teal-900 text-white p-4 flex md:hidden justify-between shadow-md print:hidden">
          <div className="flex items-center space-x-2"><ShieldAlert size={20} className="text-teal-400" /><h1 className="font-bold text-sm">SI-MARI BPI ({currentUser.tahun})</h1></div>
          <button type="button" onClick={() => { setCurrentUser(null); localStorage.removeItem('simari_current_user'); }} className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs flex gap-1 items-center"><LogOut size={14} /> Keluar</button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
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
