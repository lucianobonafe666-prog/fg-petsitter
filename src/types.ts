/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  userId: string; // Belongs to specific petsitter
  fullName: string;
  phone: string;
  whatsApp: string;
  address: string;
  neighborhood: string;
  city: string;
  notes: string;
  createdAt: string;
}

export type PetGender = 'Macho' | 'Fêmea';
export type PetSize = 'Pequeno' | 'Médio' | 'Grande';
export type PetSpecies = 'Cão' | 'Gato' | 'Outro';

export interface PetBehaviour {
  sociable: boolean;
  aggressive: boolean;
  fearful: boolean;
  anxious: boolean;
  likesOtherAnimals: boolean;
  likesChildren: boolean;
}

export interface PetHealth {
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
  specialNeeds: string;
}

export interface Pet {
  id: string;
  clientId: string; // Associated owner
  userId: string; // Belongs to specific petsitter
  photo: string; // base64 or URL
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  birthDate: string;
  color: string;
  weight: number;
  size: PetSize;
  health: PetHealth;
  behaviour: PetBehaviour;
  notes: string;
}

export type ActivityEventType =
  | 'xixi'
  | 'coco'
  | 'agua'
  | 'racao'
  | 'petisco'
  | 'medicamento'
  | 'brincadeira'
  | 'interacao';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string; // ISO String
  notes?: string;
  label: string; // readable name
}

export interface Walk {
  id: string;
  userId: string;
  petIds: string[]; // Can support multiple pets
  petDetails?: { name: string; breed: string; photo?: string }[]; // embedded pet metadata for public sharing
  startTime: string; // ISO String
  endTime: string | null; // ISO String or null if active
  durationMinutes: number; // calculated
  notes: string;
  photos: string[]; // base64 representation of snaps
  events: ActivityEvent[];
  routeSimulated?: { lat: number; lng: number }[]; // coordinates for path simulation
}

export type ScheduledWalkType = 'Passeio' | 'Visita Domiciliar' | 'Alimentação' | 'Medicamento' | 'Outro';
export type ScheduledWalkStatus = 'Pendente' | 'Realizado' | 'Cancelado';

export interface ScheduledWalk {
  id: string;
  userId: string;
  petId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: ScheduledWalkType;
  duration: string; // e.g. "30 min", "45 min", "1 hora"
  notes?: string;
  status: ScheduledWalkStatus;
}
