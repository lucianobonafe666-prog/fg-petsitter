/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Users, Dog, Footprints, History, LogOut, HelpCircle, Heart, Menu, X, CheckSquare } from 'lucide-react';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseService } from './utils/firebaseService';
import { User, Client, Pet, Walk } from './types';

// Importing view components
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import PetsView from './components/PetsView';
import ActiveWalkView from './components/ActiveWalkView';
import HistoryView from './components/HistoryView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'clients' | 'pets' | 'active-walk' | 'history'>('dashboard');

  // Core synchronized React states
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);

  // Selected quickpet state for agenda deep initiation
  const [quickPetId, setQuickPetId] = useState<string | null>(null);

  // Connection and loads
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Confirmation Modal and Toast notification states
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showConfirm = (message: string, description: string | undefined, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({ message, description, onConfirm });
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setNotification({ message, type });
  };

  // Load user profile on initial mounting
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userObj: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
          email: firebaseUser.email || ''
        };
        setCurrentUser(userObj);
        await loadUserData(userObj.id);
      } else {
        setCurrentUser(null);
        setClients([]);
        setPets([]);
        setWalks([]);
        setQuickPetId(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    setIsDataLoading(true);
    try {
      const [lClients, lPets, lWalks] = await Promise.all([
        FirebaseService.getClients(userId),
        FirebaseService.getPets(userId),
        FirebaseService.getWalks(userId)
      ]);
      setClients(lClients);
      setPets(lPets);
      setWalks(lWalks);
    } catch (err) {
      console.error('Error loading firebase data:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    await loadUserData(user.id);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    showConfirm(
      'Deseja desconectar?',
      'Sua sessão profissional ativa será encerrada. Seus dados salvos continuarão disponíveis no Firebase e você poderá entrar novamente a qualquer momento.',
      async () => {
        try {
          await FirebaseService.logoutUser();
          setCurrentUser(null);
          setClients([]);
          setPets([]);
          setWalks([]);
          setQuickPetId(null);
          setCurrentView('dashboard');
          showAlert('Sessão encerrada com sucesso.', 'success');
        } catch (err: any) {
          showAlert(err.message || 'Erro ao realizar logout.', 'error');
        }
      }
    );
  };

  // --- CLIENT ACTIONS ---
  const handleAddClient = async (clientData: Omit<Client, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
      const newCli = await FirebaseService.addClient(currentUser.id, clientData);
      setClients(prev => [newCli, ...prev]);
      showAlert('Tutor cadastrado com sucesso!', 'success');
    } catch (err: any) {
      showAlert(err.message || 'Erro ao adicionar tutor.', 'error');
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    if (!currentUser) return;
    try {
      await FirebaseService.updateClient(currentUser.id, updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      showAlert('Tutor atualizado com sucesso!', 'success');
    } catch (err: any) {
      showAlert(err.message || 'Erro ao atualizar tutor.', 'error');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!currentUser) return;
    showConfirm(
      'Excluir tutor?',
      'Esta ação é permanente e removerá todos os pets deste tutor.',
      async () => {
        try {
          await FirebaseService.deleteClient(currentUser.id, clientId);
          await loadUserData(currentUser.id);
          showAlert('Tutor e seus pets excluídos com sucesso.', 'success');
        } catch (err: any) {
          showAlert(err.message || 'Erro ao excluir tutor.', 'error');
        }
      }
    );
  };

  // --- PET ACTIONS ---
  const handleAddPet = async (petData: Omit<Pet, 'id' | 'userId'>) => {
    if (!currentUser) return;
    try {
      const newPt = await FirebaseService.addPet(currentUser.id, petData);
      setPets(prev => [...prev, newPt]);
      showAlert('Pet cadastrado com sucesso!', 'success');
    } catch (err: any) {
      showAlert(err.message || 'Erro ao adicionar pet.', 'error');
    }
  };

  const handleUpdatePet = async (updatedPet: Pet) => {
    if (!currentUser) return;
    try {
      await FirebaseService.updatePet(currentUser.id, updatedPet);
      setPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));
      showAlert('Dados do pet atualizados com sucesso!', 'success');
    } catch (err: any) {
      showAlert(err.message || 'Erro ao atualizar pet.', 'error');
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!currentUser) return;
    showConfirm(
      'Remover este pet?',
      'Esta ação não pode ser desfeita e removerá os dados deste pet.',
      async () => {
        try {
          await FirebaseService.deletePet(currentUser.id, petId);
          setPets(prev => prev.filter(p => p.id !== petId));
          showAlert('Pet removido com sucesso.', 'success');
        } catch (err: any) {
          showAlert(err.message || 'Erro ao remover pet.', 'error');
        }
      }
    );
  };

  // --- WALK ACTIONS ---
  const handleWalkFinished = async (completedWalk: Walk) => {
    if (!currentUser) return;
    try {
      const walkData = {
        userId: completedWalk.userId,
        petIds: completedWalk.petIds,
        startTime: completedWalk.startTime,
        endTime: completedWalk.endTime,
        durationMinutes: completedWalk.durationMinutes,
        notes: completedWalk.notes,
        photos: completedWalk.photos,
        events: completedWalk.events,
        routeSimulated: completedWalk.routeSimulated || []
      };
      const savedWalk = await FirebaseService.addWalk(currentUser.id, walkData);
      setWalks(prev => [savedWalk, ...prev]);
      setQuickPetId(null); // Clean up selection
      showAlert('Passeio registrado com sucesso!', 'success');
    } catch (err: any) {
      showAlert(err.message || 'Erro ao salvar passeio.', 'error');
    }
  };

  const handleStartWalkFromAgenda = (petId: string) => {
    setQuickPetId(petId);
    setCurrentView('active-walk');
  };

  const handleNavigateWithClear = (view: 'dashboard' | 'clients' | 'pets' | 'active-walk' | 'history') => {
    if (view !== 'active-walk') {
      setQuickPetId(null);
    }
    setCurrentView(view);
  };

  // Quick helper to route directly to register a pet for a client
  const handleQuickAddPetForClient = (clientId: string) => {
    setCurrentView('pets');
  };

  // Initializing Loader
  if (isInitializing) {
    return (
      <div id="initializing-overlay" className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center font-sans p-4">
        <div className="h-14 w-14 bg-[#E9EDC9] text-[#5A5A40] rounded-full flex items-center justify-center border border-[#CCD5AE]/40 animate-pulse">
          🐾
        </div>
        <p className="mt-4 text-xs font-bold text-[#8C8C73] uppercase tracking-widest animate-pulse">Sincronizando com Firestore...</p>
      </div>
    );
  }

  // Safe checks
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#424231] flex flex-col pb-20 md:pb-0 md:pl-64 font-sans">
      {/* Desktop Persistent Drawer Navigation Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden md:flex flex-col w-64 bg-[#5A5A40] text-white border-r border-[#E9E9D8] p-6">
        <div className="flex items-center gap-3 pb-6 border-b border-[#6B6B4F]">
          <div className="h-10 w-10 bg-[#D4A373] text-white rounded-full flex items-center justify-center font-bold shadow-sm">
            🐾
          </div>
          <div>
            <h1 className="font-serif italic text-xl text-white tracking-tight leading-none">PetSitter<br/><span className="text-xs font-sans not-italic uppercase tracking-widest opacity-80">Manager</span></h1>
          </div>
        </div>

        {/* User Greetings */}
        <div className="py-4.5">
          <p className="text-[10px] font-bold text-[#E9EDC9] uppercase tracking-wider">Profissional Logado</p>
          <p className="text-sm font-serif italic text-white mt-1 truncate">{currentUser.name}</p>
          <p className="text-xs text-white/70 mt-0.5 truncate">{currentUser.email}</p>
        </div>

        {/* Navigation block */}
        <nav className="flex-1 space-y-1.5 mt-2">
          <button
            onClick={() => handleNavigateWithClear('dashboard')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${currentView === 'dashboard' ? 'bg-[#D4A373] text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <LayoutGrid className="h-4.5 w-4.5 shrink-0" />
            Dashboard
          </button>

          <button
            onClick={() => handleNavigateWithClear('clients')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${currentView === 'clients' ? 'bg-[#D4A373] text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <Users className="h-4.5 w-4.5 shrink-0" />
            Clientes (Tutores)
          </button>

          <button
            onClick={() => handleNavigateWithClear('pets')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${currentView === 'pets' ? 'bg-[#D4A373] text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <Dog className="h-4.5 w-4.5 shrink-0" />
            Fichas dos Pets
          </button>

          <button
            onClick={() => handleNavigateWithClear('active-walk')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${currentView === 'active-walk' ? 'bg-[#D4A373] text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <Footprints className="h-4.5 w-4.5 shrink-0" />
            Acompanhar Passeio
          </button>

          <button
            onClick={() => handleNavigateWithClear('history')}
            className={`w-full py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${currentView === 'history' ? 'bg-[#D4A373] text-white shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <History className="h-4.5 w-4.5 shrink-0" />
            Histórico Serviços
          </button>
        </nav>

        {/* Logout bottom drawer */}
        <div className="pt-4 border-t border-[#6B6B4F]">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3.5 rounded-xl text-sm font-bold text-red-200 hover:bg-red-500/10 hover:text-red-100 transition-all flex items-center gap-3 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Desconectar
          </button>
        </div>
      </aside>

      {/* Mobile AppBar top strip */}
      <header className="sticky top-0 z-10 md:hidden bg-[#5A5A40] text-white p-4 flex items-center justify-between border-b border-[#6B6B4F] shadow-xs leading-none select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🐾</span>
          <span className="font-serif italic tracking-tight text-sm">PetSitter Manager</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-[#E9EDC9] max-w-[80px] truncate">Oi, {currentUser.name.split(' ')[0]}</span>
          <button 
            onClick={handleLogout} 
            className="p-1 px-2.5 bg-[#6B6B4F] border border-white/15 hover:bg-[#D4A373] hover:text-white rounded-lg text-[#FEFAE0] flex items-center gap-1 transition-all pointer-events-auto cursor-pointer"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {currentView === 'dashboard' && (
              <DashboardView 
                clients={clients} 
                pets={pets} 
                walks={walks} 
                onNavigate={handleNavigateWithClear}
                onStartSpecificWalk={handleStartWalkFromAgenda}
              />
            )}

            {currentView === 'clients' && (
              <ClientsView 
                clients={clients} 
                pets={pets} 
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onQuickAddPet={handleQuickAddPetForClient}
              />
            )}

            {currentView === 'pets' && (
              <PetsView 
                pets={pets} 
                clients={clients}
                onAddPet={handleAddPet}
                onUpdatePet={handleUpdatePet}
                onDeletePet={handleDeletePet}
              />
            )}

            {currentView === 'active-walk' && (
              <ActiveWalkView 
                pets={pets} 
                onWalkFinished={handleWalkFinished}
                quickSelectedPetId={quickPetId}
              />
            )}

            {currentView === 'history' && (
              <HistoryView 
                walks={walks} 
                pets={pets} 
                clients={clients}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Floating Bottom Bar Menu Navigator */}
      <nav className="fixed bottom-0 inset-x-0 z-20 md:hidden bg-[#5A5A40] border-t border-[#6B6B4F] text-[#E9EDC9]/70 px-2 py-1.5 flex justify-between items-center select-none shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => handleNavigateWithClear('dashboard')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 ${currentView === 'dashboard' ? 'text-[#FEFAE0] font-bold' : 'hover:text-white'}`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[9px] tracking-wide">Início</span>
        </button>

        <button
          onClick={() => handleNavigateWithClear('clients')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 ${currentView === 'clients' ? 'text-[#FEFAE0] font-bold' : 'hover:text-white'}`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[9px] tracking-wide">Tutores</span>
        </button>

        <button
          onClick={() => handleNavigateWithClear('pets')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 ${currentView === 'pets' ? 'text-[#FEFAE0] font-bold' : 'hover:text-white'}`}
        >
          <Dog className="h-5 w-5" />
          <span className="text-[9px] tracking-wide">Pets</span>
        </button>

        <button
          onClick={() => handleNavigateWithClear('active-walk')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 ${currentView === 'active-walk' ? 'text-[#FEFAE0] font-bold' : 'hover:text-white'}`}
        >
          <div className={`p-1.5 rounded-full absolute -top-5.5 border-4 border-[#5A5A40] shadow-md ${currentView === 'active-walk' ? 'bg-[#D4A373] text-white' : 'bg-[#6B6B4F] text-white'}`}>
            <Footprints className="h-5 w-5" />
          </div>
          <span className="text-[9px] tracking-wide mt-4">Passeio</span>
        </button>

        <button
          onClick={() => handleNavigateWithClear('history')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 ${currentView === 'history' ? 'text-[#FEFAE0] font-bold' : 'hover:text-white'}`}
        >
          <History className="h-5 w-5" />
          <span className="text-[9px] tracking-wide">Histórico</span>
        </button>
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <div className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-lg border text-sm font-semibold max-w-sm sm:max-w-md ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              <span>
                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="flex-1 leading-tight">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100 shrink-0 ml-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#D4C3B3]/30 pointer-events-auto z-10 text-gray-950"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-950 font-sans tracking-tight">
                  {confirmModal.message}
                </h3>
                {confirmModal.description && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed font-sans">
                    {confirmModal.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#FAF7F2] border-t border-[#F2ECE4]">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-650 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="px-4.5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
