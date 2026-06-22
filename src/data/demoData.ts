/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Pet, Walk } from '../types';

export const DEMO_CLIENTS = (userId: string): Client[] => [
  {
    id: 'demo-client-1',
    userId,
    fullName: 'Ana Helena Ribeiro',
    phone: '+55 (11) 98765-4321',
    whatsApp: '+5511987654321',
    address: 'Rua dos Pinheiros, 123 - Ap 42',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    notes: 'Chave reserva na portaria com o Seu Manoel. Entrada permitida das 07h às 21h. Possui elevador de serviço obrigatório para pets.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-2',
    userId,
    fullName: 'Carlos Alberto Oliveira',
    phone: '+55 (11) 99888-1122',
    whatsApp: '+5511998881122',
    address: 'Alameda Lorena, 840',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    notes: 'Portão eletrônico com senha de pedestre (senha: 2580#). Dog de porte grande costuma pular para saudar, mas é manso. Chave na planta próxima ao portão principal.',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const DEMO_PETS = (userId: string): Pet[] => [
  {
    id: 'demo-pet-1',
    clientId: 'demo-client-1',
    userId,
    photo: 'spitz-cream',
    name: 'Pipoca',
    species: 'Cão',
    breed: 'Spitz Alemão',
    gender: 'Fêmea',
    birthDate: '2022-04-12',
    color: 'Creme Espesso',
    weight: 4.8,
    size: 'Pequeno',
    health: {
      medications: 'Simparica trimestral (próximo dia 15/08)',
      allergies: 'Alergia grave a picadas de pulga/mosquito',
      dietaryRestrictions: 'Apenas ração seca hipoalergênica Royal Canin. Proibido petiscos industriais.',
      specialNeeds: 'Não fazer passeios em asfalto muito quente devido às patinhas sensíveis.'
    },
    behaviour: {
      sociable: true,
      aggressive: false,
      fearful: true,
      anxious: true,
      likesOtherAnimals: true,
      likesChildren: true
    },
    notes: 'Pipoca é extremamente dócil, mas se assusta com barulhos de motocicletas. Sempre manter a guia bem firme e curta perto de avenidas. Adora brincar com bolinhas de borracha macias.'
  },
  {
    id: 'demo-pet-2',
    clientId: 'demo-client-2',
    userId,
    photo: 'golden-gold',
    name: 'Zeus',
    species: 'Cão',
    breed: 'Golden Retriever',
    gender: 'Macho',
    birthDate: '2019-08-30',
    color: 'Dourado Escuro',
    weight: 34.5,
    size: 'Grande',
    health: {
      medications: 'Condroprotetor articular (dar 1/2 comprimido de manhã esmagado na banana)',
      allergies: 'Alergia leve a corantes artificiais',
      dietaryRestrictions: 'Satisfeito com ração Golden Formula e frutas permitidas (maçã sem semente, melancia e banana)',
      specialNeeds: 'Fazer passeios ritmados com pausas frequentes à sombra devido ao peso e calor.'
    },
    behaviour: {
      sociable: true,
      aggressive: false,
      fearful: false,
      anxious: false,
      likesOtherAnimals: true,
      likesChildren: true
    },
    notes: 'Zeus é muito brincalhão e forte, tende a puxar a guia nos primeiros 5 minutos de passeio devido à empolgação. Reage excepcionalmente bem a comandos de sentar e esperar.'
  },
  {
    id: 'demo-pet-3',
    clientId: 'demo-client-2',
    userId,
    photo: 'persa-white',
    name: 'Luna',
    species: 'Gato',
    breed: 'Persa',
    gender: 'Fêmea',
    birthDate: '2020-11-15',
    color: 'Branca de Neve',
    weight: 3.9,
    size: 'Pequeno',
    health: {
      medications: 'Colírio lubrificante nos olhos (2x ao dia)',
      allergies: 'Nenhuma conhecida',
      dietaryRestrictions: 'Ração Premier gatos castrados e sachê renal úmido sabor salmão (1/2 sachê à noite)',
      specialNeeds: 'Limpeza diária do canto dos olhos e escovação cuidadosa dos pelos.'
    },
    behaviour: {
      sociable: false,
      aggressive: false,
      fearful: true,
      anxious: false,
      likesOtherAnimals: false,
      likesChildren: false
    },
    notes: 'Luna costuma se esconder embaixo da cama quando ouve visitas entrarem. Não forçar interação imediata. Gosta de brinquedos de varinha com penas.'
  }
];

export const DEMO_WALKS = (userId: string): Walk[] => {
  const now = new Date();
  
  // 1 day ago
  const startTime1 = new Date(now.getTime() - 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000); // 26 hours ago
  const endTime1 = new Date(startTime1.getTime() + 45 * 60 * 1000); // 45 mins walk

  // 2 days ago
  const startTime2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000); // 52 hours ago
  const endTime2 = new Date(startTime2.getTime() + 30 * 60 * 1000); // 30 mins walk

  return [
    {
      id: 'demo-walk-1',
      userId,
      petIds: ['demo-pet-1'], // Pipoca
      startTime: startTime1.toISOString(),
      endTime: endTime1.toISOString(),
      durationMinutes: 45,
      notes: 'Hoje o passeio da Pipoca foi muito tranquilo pela praça central. Encontrarmos outros cachorrinhos pequenos e ela cheirou todos de forma amigável. Comeu um pedacinho de maçã que levei e tomou água na metade do caminho.',
      photos: ['pipoca_walk_1'],
      events: [
        { id: 'ev-1', type: 'xixi', timestamp: new Date(startTime1.getTime() + 10 * 60 * 1000).toISOString(), label: 'Fez Xixi', notes: 'Logo no primeiro poste do quarteirão' },
        { id: 'ev-2', type: 'coco', timestamp: new Date(startTime1.getTime() + 15 * 60 * 1000).toISOString(), label: 'Fez Cocô', notes: 'Grama da praça central (recolhido)' },
        { id: 'ev-3', type: 'agua', timestamp: new Date(startTime1.getTime() + 25 * 60 * 1000).toISOString(), label: 'Bebeu Água', notes: 'Bebeu do bebedouro portátil dobrável' },
        { id: 'ev-4', type: 'brincadeira', timestamp: new Date(startTime1.getTime() + 35 * 60 * 1000).toISOString(), label: 'Brincou', notes: 'Brincou de pegar bolinha na grama cercada' }
      ]
    },
    {
      id: 'demo-walk-2',
      userId,
      petIds: ['demo-pet-2'], // Zeus
      startTime: startTime2.toISOString(),
      endTime: endTime2.toISOString(),
      durationMinutes: 30,
      notes: 'Passeio matinal nas sombras da alameda. Zeus estava muito contente e correu um pouco. Dei o condroprotetor facial dele enrolado na banana e ele engoliu de primeira. Fizemos uma parada de descanso de 5 minutos embaixo do ipê amarelo.',
      photos: ['zeus_walk_1'],
      events: [
        { id: 'ev-5', type: 'xixi', timestamp: new Date(startTime2.getTime() + 5 * 60 * 1000).toISOString(), label: 'Fez Xixi' },
        { id: 'ev-6', type: 'medicamento', timestamp: new Date(startTime2.getTime() + 8 * 60 * 1000).toISOString(), label: 'Tomou Medicamento', notes: 'Condroprotetor misturado com banana' },
        { id: 'ev-7', type: 'agua', timestamp: new Date(startTime2.getTime() + 20 * 60 * 1000).toISOString(), label: 'Bebeu Água', notes: 'Bebeu bastante água fresca' },
        { id: 'ev-8', type: 'interacao', timestamp: new Date(startTime2.getTime() + 25 * 60 * 1000).toISOString(), label: 'Interagiu', notes: 'Cheirou amigavelmente um Maltês tutorado' }
      ]
    }
  ];
};
