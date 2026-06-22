/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Users, Dog, Footprints, History, LogOut, HelpCircle, Heart, Menu, X, CheckSquare } from 'lucide-react';
import { StorageService } from './utils/storage';
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

  // Load user profile on initial mounting
  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadUserData(user.id);
    }
  }, []);

  const loadUserData = (userId: string) => {
    // Ensuring seed exists
    StorageService.seedDemoDataForUser(userId);

    const lClients = StorageService.getClients(userId);
    const lPets = StorageService.getPets(userId);
    const lWalks = StorageService.getWalks(userId);

    setClients(lClients);
    setPets(lPets);
    setWalks(lWalks);
  };

  const handleLoginSuccess = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    loadUserData(user.id);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Excluir sessão profissional ativa? Seus dados salvos localmente continuarão disponíveis.')) {
      StorageService.setCurrentUser(null);
      setCurrentUser(null);
      setClients([]);
      setPets([]);
      setWalks([]);
      setQuickPetId(null);
      setCurrentView('dashboard');
    }
  };

  // --- CLIENT ACTIONS ---
  const handleAddClient = (clientData: Omit<Client, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) return;
    const newCli = StorageService.addClient(currentUser.id, clientData);
    setClients(prev => [newCli, ...prev]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    if (!currentUser) return;
    StorageService.updateClient(currentUser.id, updatedClient);
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = (clientId: string) => {
    if (!currentUser) return;
    StorageService.deleteClient(currentUser.id, clientId);
    // Reload state as this modifies pets too
    loadUserData(currentUser.id);
  };

  // --- PET ACTIONS ---
  const handleAddPet = (petData: Omit<Pet, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newPt = StorageService.addPet(currentUser.id, petData);
    setPets(prev => [...prev, newPt]);
  };

  const handleUpdatePet = (updatedPet: Pet) => {
    if (!currentUser) return;
    StorageService.updatePet(currentUser.id, updatedPet);
    setPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));
  };

  const handleDeletePet = (petId: string) => {
    if (!currentUser) return;
    StorageService.deletePet(currentUser.id, petId);
    setPets(prev => prev.filter(p => p.id !== petId));
  };

  // --- WALK ACTIONS ---
  const handleWalkFinished = (completedWalk: Walk) => {
    if (!currentUser) return;
    StorageService.addWalk(currentUser.id, completedWalk);
    setWalks(prev => [completedWalk, ...prev]);
    setQuickPetId(null); // Clean up selection
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
    // Opens form directly in Pets view, handled by matching context or can let them toggle
  };

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
    </div>
  );
}
