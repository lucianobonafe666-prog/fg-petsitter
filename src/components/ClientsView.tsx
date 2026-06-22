/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, MapPin, Phone, MessageSquare, ChevronDown, ChevronUp, FileText, Trash2, Edit2, Check, X, ArrowLeft } from 'lucide-react';
import { Client, Pet } from '../types';

interface ClientsViewProps {
  clients: Client[];
  pets: Pet[];
  onAddClient: (client: Omit<Client, 'id' | 'userId' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onQuickAddPet: (clientId: string) => void;
}

export default function ClientsView({ 
  clients, 
  pets, 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient,
  onQuickAddPet
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  
  // Form Screen Control
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Handle opening form
  const handleOpenCreateForm = () => {
    setEditingClient(null);
    setFullName('');
    setPhone('');
    setWhatsApp('');
    setAddress('');
    setNeighborhood('');
    setCity('São Paulo');
    setNotes('');
    setShowForm(true);
  };

  const handleOpenEditForm = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setFullName(client.fullName);
    setPhone(client.phone);
    setWhatsApp(client.whatsApp);
    setAddress(client.address);
    setNeighborhood(client.neighborhood);
    setCity(client.city);
    setNotes(client.notes);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsApp: whatsApp.trim().replace(/\D/g, ''), // strip down non-numeric
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      notes: notes.trim(),
    };

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        ...data
      });
    } else {
      onAddClient(data);
    }
    setShowForm(false);
  };

  const handleDelete = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Atenção: Ao excluir o cliente, todos os seus pets serão removidos permanentemente. Confirmar exclusão?')) {
      onDeleteClient(clientId);
      if (expandedClientId === clientId) {
        setExpandedClientId(null);
      }
    }
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.neighborhood.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  if (showForm) {
    return (
      <div className="bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6 sm:p-8 font-sans">
        <button
          onClick={() => setShowForm(false)}
          className="mb-6 flex items-center gap-1.5 text-xs font-bold text-[#8C8C73] hover:text-[#5A5A40] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
        </button>

        <h3 className="text-xl sm:text-2xl font-serif italic text-[#424231] mb-5">
          {editingClient ? 'Atualizar Dados do Cliente' : 'Cadastrar Novo Cliente Tutor'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
                Nome do Tutor *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                placeholder="Ex. Ana Maria Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
                  Telefone Contato
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="(11) 98888-7777"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
                  WhatsApp (apenas números)
                </label>
                <input
                  type="text"
                  value={whatsApp}
                  onChange={(e) => setWhatsApp(e.target.value)}
                  className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="5511988887777"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1.5">
              <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
                Endereço Completo (Rua, Número, Ap)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                placeholder="Rua das Alamendas, 102 - Bloco B Ap 34"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
                Bairro
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                placeholder="Ex. Jardins"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                placeholder="Ex. São Paulo"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-1.5">
              Observações Gerais (Instruções de chaves, restrições da casa, alarmes)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all resize-none placeholder:text-[#8C8C73]/60"
              placeholder="Ex. Chave reserva fica no chaveiro da parede perto do microondas. Possui tranca eletrônica, senha #1052."
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
              {editingClient ? 'Salvar Edições' : 'Concluir Cadastro'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8C73]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E9E9D8] bg-white text-[#424231] text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all placeholder:text-[#8C8C73]/60"
            placeholder="Pesquise por tutor, bairro, cidade ou fone..."
          />
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="w-full sm:w-auto px-5 py-3 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white font-semibold rounded-full text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Adicionar Cliente
        </button>
      </div>

      {/* Clients list */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E9E9D8] p-8 text-center text-[#8C8C73] text-sm">
            Nenhum tutor encontrado para "{searchTerm}".
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientPets = pets.filter(p => p.clientId === client.id);
            const isExpanded = expandedClientId === client.id;

            return (
              <div 
                key={client.id}
                className="bg-white rounded-3xl border border-[#E9E9D8] shadow-xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Header Row */}
                <div 
                  onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#F9F8F3]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="font-serif italic text-lg sm:text-xl text-[#424231] flex items-center gap-2.5">
                      {client.fullName}
                      <span className="text-[10px] font-bold text-[#5A5A40] bg-[#E9EDC9] px-2.5 py-0.5 rounded-full font-sans not-italic">
                        {clientPets.length === 1 ? '1 pet' : `${clientPets.length} pets`}
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-4 text-xs text-[#8C8C73]">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-[#5A5A40] shrink-0" />
                        {client.neighborhood ? `${client.neighborhood}, ${client.city}` : 'Endereço não cadastrado'}
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1 font-medium">
                          <Phone className="h-3.5 w-3.5 text-[#5A5A40] shrink-0" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleOpenEditForm(client, e)}
                      className="p-2 bg-[#F9F8F3] hover:bg-[#E9EDC9]/40 text-[#5A5A40] rounded-lg transition-colors cursor-pointer"
                      title="Editar tutor"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(client.id, e)}
                      className="p-2 bg-red-50 hover:bg-red-100/60 text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Excluir tutor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div 
                      onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                      className="text-[#8C8C73] p-1.5 hover:text-[#5A5A40] cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-[#F5F5ED] bg-[#F9F8F3]/60 p-4 sm:p-5 space-y-4">
                    {/* Notes & Extra Info */}
                    {(client.address || client.notes) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {client.address && (
                          <div className="bg-white p-4 rounded-2xl border border-[#E9E9D8]">
                            <span className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest block mb-1">
                              Endereço Completo
                            </span>
                            <p className="text-xs sm:text-sm text-[#424231] leading-relaxed font-semibold">
                              {client.address}
                            </p>
                          </div>
                        )}
                        {client.notes && (
                          <div className="bg-white p-4 rounded-2xl border border-[#E9E9D8]">
                            <span className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest block mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Observações & Instruções de Acesso
                            </span>
                            <p className="text-xs sm:text-sm text-[#424231] leading-relaxed italic whitespace-pre-line">
                              "{client.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Shared Contact Actions */}
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="px-4 py-2 bg-white border border-[#E9E9D8] text-[#5A5A40] rounded-xl text-xs font-bold hover:bg-[#F9F8F3] transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <Phone className="h-3.5 w-3.5 text-[#5A5A40]" /> Telefonar
                        </a>
                      )}
                      {client.whatsApp && (
                        <a
                          href={`https://wa.me/${client.whatsApp}?text=Ol%C3%A1%20${encodeURIComponent(client.fullName)}!%20Aqui%20%C3%A9%20o%20seu%20PetSitter,%20passando%20para%20notificar%20sobre%20o%20atendimento...`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#FEFAE0] text-[#D4A373] border border-[#E9E9D8] rounded-xl text-xs font-bold hover:bg-[#FEFAE0]/80 transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-[#D4A373]" /> Chamar no WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Associated Pets Header */}
                    <div className="pt-4 border-t border-[#E9E9D8]">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-wider">
                          Pets Vinculados a este Tutor
                        </h5>
                        <button
                          onClick={() => onQuickAddPet(client.id)}
                          className="px-3 py-1.5 bg-white border border-[#E9E9D8] hover:bg-[#F9F8F3] text-[#5A5A40] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer pointer-events-auto"
                        >
                          <Plus className="h-3 w-3" /> Novo Pet
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {clientPets.length === 0 ? (
                          <div className="col-span-full py-5 text-center border-2 border-dashed border-[#E9E9D8] rounded-2xl text-[#8C8C73] text-xs font-medium">
                            Nenhum pet cadastrado para este tutor ainda.
                          </div>
                        ) : (
                          clientPets.map((pet) => (
                            <div 
                              key={pet.id}
                              className="bg-white p-3 rounded-2xl border border-[#E9E9D8] hover:border-[#D4A373]/50 transition-colors flex items-center gap-3"
                            >
                              <div className="h-10 w-10 rounded-full bg-[#FEFAE0] border border-[#E9E9D8] text-[#D4A373] flex items-center justify-center font-bold text-sm shrink-0">
                                {pet.name.charAt(0)}
                              </div>
                              <div className="overflow-hidden">
                                <h6 className="font-bold text-[#424231] text-xs sm:text-sm truncate">{pet.name}</h6>
                                <p className="text-[10px] text-[#8C8C73] truncate font-medium">{pet.breed || 'SRD'}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
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
