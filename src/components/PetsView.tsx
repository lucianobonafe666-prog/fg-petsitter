/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, ArrowLeft, Heart, ShieldAlert, SlidersHorizontal, User, Sparkles, HelpCircle, Activity } from 'lucide-react';
import { Client, Pet, PetBehaviour, PetHealth, PetGender, PetSize, PetSpecies } from '../types';

interface PetsViewProps {
  pets: Pet[];
  clients: Client[];
  initialSelectedClientId?: string | null;
  onAddPet: (pet: Omit<Pet, 'id' | 'userId'>) => void;
  onUpdatePet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
}

export default function PetsView({
  pets,
  clients,
  initialSelectedClientId = null,
  onAddPet,
  onUpdatePet,
  onDeletePet
}: PetsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [filterClientId, setFilterClientId] = useState<string>(initialSelectedClientId || 'ALL');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('Cão');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender>('Macho');
  const [birthDate, setBirthDate] = useState('');
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState<number>(5);
  const [size, setSize] = useState<PetSize>('Pequeno');
  
  // Health
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');

  // Behaviour
  const [sociable, setSociable] = useState(true);
  const [aggressive, setAggressive] = useState(false);
  const [fearful, setFearful] = useState(false);
  const [anxious, setAnxious] = useState(false);
  const [likesOtherAnimals, setLikesOtherAnimals] = useState(true);
  const [likesChildren, setLikesChildren] = useState(true);

  // Notes
  const [photo, setPhoto] = useState('spitz-cream');
  const [notes, setNotes] = useState('');

  // Auto calculate age
  const calculateAge = (bdate: string) => {
    if (!bdate) return 'Idade não cadastrada';
    const birth = new Date(bdate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return months === 1 ? '1 mês' : `${months} meses`;
    }
    const yearStr = years === 1 ? '1 ano' : `${years} anos`;
    const monthStr = months > 0 ? (months === 1 ? ' e 1 mês' : ` e ${months} meses`) : '';
    return `${yearStr}${monthStr}`;
  };

  const handleOpenCreateForm = () => {
    setEditingPet(null);
    setClientId(clients.length > 0 ? clients[0].id : '');
    setName('');
    setSpecies('Cão');
    setBreed('');
    setGender('Macho');
    setBirthDate('');
    setColor('');
    setWeight(10);
    setSize('Médio');
    setMedications('');
    setAllergies('');
    setDietaryRestrictions('');
    setSpecialNeeds('');
    setSociable(true);
    setAggressive(false);
    setFearful(false);
    setAnxious(false);
    setLikesOtherAnimals(true);
    setLikesChildren(true);
    setPhoto('dog-generic');
    setNotes('');
    setShowForm(true);
  };

  const handleOpenEditForm = (pet: Pet) => {
    setEditingPet(pet);
    setClientId(pet.clientId);
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed);
    setGender(pet.gender);
    setBirthDate(pet.birthDate);
    setColor(pet.color);
    setWeight(pet.weight);
    setSize(pet.size);
    setMedications(pet.health.medications);
    setAllergies(pet.health.allergies);
    setDietaryRestrictions(pet.health.dietaryRestrictions);
    setSpecialNeeds(pet.health.specialNeeds);
    setSociable(pet.behaviour.sociable);
    setAggressive(pet.behaviour.aggressive);
    setFearful(pet.behaviour.fearful);
    setAnxious(pet.behaviour.anxious);
    setLikesOtherAnimals(pet.behaviour.likesOtherAnimals);
    setLikesChildren(pet.behaviour.likesChildren);
    setPhoto(pet.photo);
    setNotes(pet.notes);
    setShowForm(true);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Por favor, vincule este pet a um Tutor.');
      return;
    }

    const data: Omit<Pet, 'id' | 'userId'> = {
      clientId,
      name: name.trim(),
      species,
      breed: breed.trim(),
      gender,
      birthDate,
      color: color.trim(),
      weight: Number(weight),
      size,
      health: {
        medications: medications.trim(),
        allergies: allergies.trim(),
        dietaryRestrictions: dietaryRestrictions.trim(),
        specialNeeds: specialNeeds.trim()
      },
      behaviour: {
        sociable,
        aggressive,
        fearful,
        anxious,
        likesOtherAnimals,
        likesChildren
      },
      photo,
      notes: notes.trim()
    };

    if (editingPet) {
      onUpdatePet({
        ...editingPet,
        ...data
      });
    } else {
      onAddPet(data);
    }
    setShowForm(false);
  };

  const handleDelete = (petId: string) => {
    if (window.confirm('Excluir esta ficha pet do banco de dados? Esta ação é irreversível.')) {
      onDeletePet(petId);
    }
  };

  // Filter computation
  const filteredPets = pets.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q);
    const matchesSpecies = filterSpecies === 'ALL' || p.species === filterSpecies;
    const matchesSize = filterSize === 'ALL' || p.size === filterSize;
    const matchesClient = filterClientId === 'ALL' || p.clientId === filterClientId;

    return matchesQuery && matchesSpecies && matchesSize && matchesClient;
  });

  if (showForm) {
    return (
      <div className="bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6 sm:p-8 font-sans">
        <button
          onClick={() => setShowForm(false)}
          className="mb-6 flex items-center gap-1.5 text-xs font-bold text-[#8C8C73] hover:text-[#5A5A40] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Portfólio
        </button>

        <h3 className="text-xl sm:text-2xl font-serif italic text-[#424231] mb-6">
          {editingPet ? `Atualizar Ficha de ${editingPet.name}` : 'Cadastrar Nova Ficha Animal (Pet)'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="bg-[#F9F8F3] p-4 sm:p-5 rounded-2xl border border-[#E9E9D8] space-y-4">
            <h4 className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest">Informações Básicas do Pet</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Tutor Responsável *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                >
                  <option value="">Selecione um Tutor...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.neighborhood})</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1">Crie um tutor primeiro na aba Clientes.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Nome do Pet *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="Ex. Bobby"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Espécie</label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value as PetSpecies)}
                    className="block w-full px-3 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  >
                    <option value="Cão">Cão (Cachorro)</option>
                    <option value="Gato">Gato (Felino)</option>
                    <option value="Outro">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Sexo</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as PetGender)}
                    className="block w-full px-3 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Raça</label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="Ex. Maltês ou SRD (Vira-lata)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Data Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Porte</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as PetSize)}
                    className="block w-full px-3 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  >
                    <option value="Pequeno">Pequeno</option>
                    <option value="Médio">Médio</option>
                    <option value="Grande">Grande</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Cor e Pelagem</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="Ex. Marrom malhado de branco"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5">Foto do Pet (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  className="block w-full text-xs text-[#8C8C73] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-[#E9E9D8] file:text-xs file:font-semibold file:bg-white file:text-[#5A5A40] hover:file:bg-[#F9F8F3] transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Health */}
          <div className="bg-[#FEFAE0]/40 p-4 sm:p-5 rounded-2xl border border-[#E9E9D8] space-y-4">
            <h4 className="text-[10px] font-bold text-[#D4A373] uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-[#D4A373]" /> Saúde & Restrições Clínicas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5 font-sans">Medicamentos de Rotina</label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  placeholder="Instruções de remédios diários ou periódicos"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5 font-sans">Alergias graves</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  placeholder="Alergia a picadas, sabonetes, etc."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5 font-sans">Restrições Alimentares</label>
                <input
                  type="text"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  placeholder="Ex. Proibido petiscos, intolerância a glúten"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase mb-1.5 font-sans">Necessidades Especiais</label>
                <input
                  type="text"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-white border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
                  placeholder="Instruções de locomoção, cegueira, etc."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Behaviour */}
          <div className="bg-[#E9EDC9]/35 p-4 sm:p-5 rounded-2xl border border-[#CCD5AE]/50 space-y-4">
            <h4 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-[#5A5A40]" /> Perfil Comportamental
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Sociável', val: sociable, set: setSociable },
                { label: 'Reativo/Agressivo', val: aggressive, set: setAggressive },
                { label: 'Medroso/Assustado', val: fearful, set: setFearful },
                { label: 'Ansioso/Carente', val: anxious, set: setAnxious },
                { label: 'Gosta de Animais', val: likesOtherAnimals, set: setLikesOtherAnimals },
                { label: 'Gosta de Crianças', val: likesChildren, set: setLikesChildren },
              ].map((item, index) => (
                <label 
                  key={index} 
                  className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[#E9E9D8] cursor-pointer select-none hover:bg-[#F9F8F3] transition-all"
                >
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="h-4.5 w-4.5 text-[#5A5A40] border-[#E9E9D8] rounded-sm focus:ring-[#D4A373]"
                  />
                  <span className="text-xs font-bold text-[#424231]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Extra remarks */}
          <div>
            <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
              Instruções Gerais (Hábitos, apelidos, caminhos preferidos)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] resize-none"
              placeholder="Ex. Pipoca ama biscoito de cenoura. Late para pássaros. Gosta de brincar com a coleira no chão..."
            />
          </div>

          <div className="pt-4 border-t border-[#F5F5ED] flex justify-end gap-3 font-sans">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-[#E9E9D8] text-[#8C8C73] bg-white rounded-full text-sm font-semibold hover:bg-[#F9F8F3] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white rounded-full text-sm font-semibold transition-colors cursor-pointer"
            >
              {editingPet ? 'Salvar Ficha Animal' : 'Cadastrar Ficha Animal'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Search and Filters Strip */}
      <div className="bg-white p-4.5 rounded-3xl border border-[#E9E9D8] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8C73]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E9E9D8] bg-[#F9F8F3] text-[#424231] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all placeholder:text-[#8C8C73]/60"
              placeholder="Pesquisar por nome ou raça..."
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-1 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl p-1 text-xs font-semibold w-full overflow-x-auto whitespace-nowrap">
              {/* Species Filter */}
              <button
                onClick={() => setFilterSpecies('ALL')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${filterSpecies === 'ALL' ? 'bg-white text-[#424231] shadow-xs font-bold' : 'text-[#8C8C73] hover:text-[#5A5A40]'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterSpecies('Cão')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${filterSpecies === 'Cão' ? 'bg-white text-[#5A5A40] shadow-xs font-bold' : 'text-[#8C8C73] hover:text-[#5A5A40]'}`}
              >
                Cães
              </button>
              <button
                onClick={() => setFilterSpecies('Gato')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${filterSpecies === 'Gato' ? 'bg-white text-[#D4A373] shadow-xs font-bold' : 'text-[#8C8C73] hover:text-[#5A5A40]'}`}
              >
                Gatos
              </button>
            </div>

            <button
              onClick={handleOpenCreateForm}
              className="py-2.5 px-4 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white font-semibold rounded-full text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" /> Novo Pet
            </button>
          </div>
        </div>

        {/* Client Owner and Size Filters Row */}
        <div className="pt-3 border-t border-[#F5F5ED] flex flex-col sm:flex-row gap-4 items-center text-xs font-semibold text-[#8C8C73]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <User className="h-4 w-4 text-[#5A5A40]" />
            <span className="shrink-0 text-[#8C8C73]">Filtrar por Tutor:</span>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="text-xs bg-[#F9F8F3] rounded-lg py-1 px-2 border border-[#E9E9D8] font-bold text-[#424231] focus:outline-hidden"
            >
              <option value="ALL">Qualquer Tutor</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-[#5A5A40]" />
            <span className="shrink-0 text-[#8C8C73]">Porte:</span>
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="text-xs bg-[#F9F8F3] rounded-lg py-1 px-2 border border-[#E9E9D8] font-bold text-[#424231] focus:outline-hidden"
            >
              <option value="ALL">Qualquer Porte</option>
              <option value="Pequeno">Pequeno</option>
              <option value="Médio">Médio</option>
              <option value="Grande">Grande</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Pets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPets.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white border border-[#E9E9D8] rounded-3xl text-[#8C8C73] text-sm">
            Nenhum pet correspondente aos filtros. Adicione uma nova ficha pet para começar!
          </div>
        ) : (
          filteredPets.map((pet) => {
            const owner = clients.find(c => c.id === pet.clientId);
            const ownerName = owner ? owner.fullName : 'Tutor não encontrado';

            return (
              <div 
                key={pet.id}
                className="bg-white rounded-3xl border border-[#E9E9D8] shadow-xs hover:shadow-xs p-5.5 flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Render customized pet avatar gradient */}
                    <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#CCD5AE] to-[#FEFAE0] text-[#5A5A40] font-black text-lg flex items-center justify-center shadow-inner border border-[#E9E9D8] shrink-0 select-none overflow-hidden">
                      {pet.photo && pet.photo.startsWith('data:image') ? (
                        <img src={pet.photo} referrerPolicy="no-referrer" alt={pet.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span>{pet.name.charAt(0)}</span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-serif italic text-lg text-[#424231] flex items-center gap-2 leading-none">
                        {pet.name}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm font-sans not-italic ${pet.gender === 'Fêmea' ? 'bg-[#FEFAE0] text-[#D4A373]' : 'bg-[#E9EDC9]/85 text-[#5A5A40]'}`}>
                          {pet.gender}
                        </span>
                      </h4>
                      <p className="text-xs text-[#8C8C73] mt-1 font-medium">
                        {pet.breed || 'Sem raça definida'} &bull; {calculateAge(pet.birthDate)}
                      </p>
                      <p className="text-[10px] font-semibold text-[#8C8C73] mt-0.5">
                        Tutor(a): <span className="font-bold underline text-[#5A5A40]">{ownerName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditForm(pet)}
                      className="p-2 hover:bg-[#F9F8F3] rounded-lg text-[#8C8C73] hover:text-[#5A5A40] transition-colors cursor-pointer"
                      title="Editar ficha"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-[#8C8C73] hover:text-red-600 transition-colors cursor-pointer"
                      title="Excluir ficha"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Characteristics grids */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                  {/* Physical metrics */}
                  <div className="space-y-1 bg-[#F9F8F3] p-3 rounded-2xl border border-[#E9E9D8]">
                    <span className="text-[9px] font-bold text-[#8C8C73] tracking-widest uppercase block mb-0.5">Métricas</span>
                    <p className="text-[#424231] font-medium">Porte: <span className="font-bold text-[#5A5A40]">{pet.size}</span></p>
                    <p className="text-[#424231] font-medium">Peso: <span className="font-bold text-[#5A5A40]">{pet.weight} kg</span></p>
                    {pet.color && <p className="text-[#424231] truncate font-medium" title={pet.color}>Pelagem: <span className="font-bold text-[#5A5A40]">{pet.color}</span></p>}
                  </div>

                  {/* Health check summary */}
                  <div className="space-y-1 bg-[#FEFAE0]/40 p-3 rounded-2xl border border-[#CCD5AE]/45">
                    <span className="text-[9px] font-bold text-[#D4A373] tracking-widest uppercase block flex items-center gap-0.5 mb-0.5">
                      <Activity className="h-3 w-3" /> Alertas Clínicos
                    </span>
                    <p className="text-[#424231] truncate font-medium" title={pet.health.medications || 'Nenhum'}>
                      Med: <span className="font-bold text-[#D4A373]">{pet.health.medications || 'Nenhum'}</span>
                    </p>
                    <p className="text-[#424231] truncate font-medium" title={pet.health.dietaryRestrictions || 'Nenhuma'}>
                      Dieta: <span className="font-bold text-[#D4A373]">{pet.health.dietaryRestrictions || 'Nenhuma'}</span>
                    </p>
                    <p className="text-[#424231] truncate font-medium" title={pet.health.allergies || 'Nenhuma'}>
                      Alerg: <span className="font-bold text-red-600/70">{pet.health.allergies || 'Nenhuma'}</span>
                    </p>
                  </div>
                </div>

                {/* Behaviours list in quick pills */}
                <div className="space-y-1.5 font-sans">
                  <span className="text-[9px] font-bold text-[#8C8C73] tracking-widest uppercase block">Comportamento</span>
                  <div className="flex flex-wrap gap-1">
                    {pet.behaviour.sociable && <span className="text-[9px] font-bold text-[#5A5A40] bg-[#E9EDC9] px-2 py-0.5 rounded-sm">Sociável</span>}
                    {pet.behaviour.likesOtherAnimals && <span className="text-[9px] font-bold text-[#424231] bg-[#FEFAE0] px-2 py-0.5 rounded-sm">Amigo de outros pets</span>}
                    {pet.behaviour.likesChildren && <span className="text-[9px] font-bold text-[#5A5A40] bg-[#E9EDC9] px-2 py-0.5 rounded-sm">Crianças OK</span>}
                    {pet.behaviour.fearful && <span className="text-[9px] font-bold text-[#D4A373] bg-[#FEFAE0] px-2 py-0.5 rounded-sm">Medroso</span>}
                    {pet.behaviour.anxious && <span className="text-[9px] font-bold text-red-700 bg-red-50/50 px-2 py-0.5 rounded-sm">Ansioso</span>}
                    {pet.behaviour.aggressive && <span className="text-[9px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-sm">Reativo</span>}
                  </div>
                </div>

                {/* Notes card */}
                {pet.notes && (
                  <div className="pt-2.5 border-t border-[#F5F5ED] text-xs font-sans">
                    <p className="text-[#8C8C73] italic whitespace-normal leading-relaxed">
                      "{pet.notes}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
