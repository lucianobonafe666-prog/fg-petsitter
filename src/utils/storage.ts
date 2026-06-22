/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Pet, Walk, User } from '../types';
import { DEMO_CLIENTS, DEMO_PETS, DEMO_WALKS } from '../data/demoData';

const USERS_KEY = 'petsitter_users';
const CURRENT_USER_KEY = 'petsitter_current_user';
const CLIENTS_KEY_PREFIX = 'petsitter_clients_';
const PETS_KEY_PREFIX = 'petsitter_pets_';
const WALKS_KEY_PREFIX = 'petsitter_walks_';

// Helper to safely load JSON from localStorage
function getJSON<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error(`Error reading key "${key}" from localStorage:`, e);
    return defaultValue;
  }
}

// Helper to safely set JSON inside localStorage
function setJSON(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key "${key}" to localStorage:`, e);
  }
}

export const StorageService = {
  // --- AUTH OPERATIONS ---
  getUsers(): User[] {
    return getJSON<User[]>(USERS_KEY, []);
  },

  getCurrentUser(): User | null {
    return getJSON<User | null>(CURRENT_USER_KEY, null);
  },

  setCurrentUser(user: User | null): void {
    setJSON(CURRENT_USER_KEY, user);
  },

  registerUser(name: string, email: string, passwordSecret: string): User {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name,
      email: email.trim()
    };

    // Save user profile
    users.push(newUser);
    setJSON(USERS_KEY, users);

    // Seed default data for the new user, so the profile doesn't start completely blank
    this.seedDemoDataForUser(newUser.id);

    return newUser;
  },

  loginUser(email: string, passwordSecret: string): User {
    const users = this.getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    // In a real app we'd verify passwordSecret, here we simulate a successful login
    if (!found) {
      // For demonstration convenience, if specific demo emails are typed, we can auto-register them
      if (email.includes('@')) {
        const generatedName = email.split('@')[0];
        const formattedName = generatedName.charAt(0).toUpperCase() + generatedName.slice(1);
        return this.registerUser(formattedName, email, passwordSecret);
      }
      throw new Error('E-mail não encontrado. Toque em "Criar conta" para cadastrar-se.');
    }

    return found;
  },

  // --- DATA SEEDING ---
  seedDemoDataForUser(userId: string): void {
    const clientsKey = `${CLIENTS_KEY_PREFIX}${userId}`;
    const petsKey = `${PETS_KEY_PREFIX}${userId}`;
    const walksKey = `${WALKS_KEY_PREFIX}${userId}`;

    // Only seed if empty
    if (!localStorage.getItem(clientsKey)) {
      setJSON(clientsKey, DEMO_CLIENTS(userId));
    }
    if (!localStorage.getItem(petsKey)) {
      setJSON(petsKey, DEMO_PETS(userId));
    }
    if (!localStorage.getItem(walksKey)) {
      setJSON(walksKey, DEMO_WALKS(userId));
    }
  },

  // --- CORE GETTERS ---
  getClients(userId: string): Client[] {
    return getJSON<Client[]>(`${CLIENTS_KEY_PREFIX}${userId}`, []);
  },

  getPets(userId: string): Pet[] {
    return getJSON<Pet[]>(`${PETS_KEY_PREFIX}${userId}`, []);
  },

  getWalks(userId: string): Walk[] {
    return getJSON<Walk[]>(`${WALKS_KEY_PREFIX}${userId}`, []);
  },

  // --- WRITE OPERATIONS ---
  saveClients(userId: string, clients: Client[]): void {
    setJSON(`${CLIENTS_KEY_PREFIX}${userId}`, clients);
  },

  savePets(userId: string, pets: Pet[]): void {
    setJSON(`${PETS_KEY_PREFIX}${userId}`, pets);
  },

  saveWalks(userId: string, walks: Walk[]): void {
    setJSON(`${WALKS_KEY_PREFIX}${userId}`, walks);
  },

  // Client CRUD
  addClient(userId: string, clientData: Omit<Client, 'id' | 'userId' | 'createdAt'>): Client {
    const clients = this.getClients(userId);
    const newClient: Client = {
      ...clientData,
      id: 'cli_' + Math.random().toString(36).substr(2, 9),
      userId,
      createdAt: new Date().toISOString()
    };
    clients.unshift(newClient);
    this.saveClients(userId, clients);
    return newClient;
  },

  updateClient(userId: string, client: Client): void {
    const clients = this.getClients(userId);
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx !== -1) {
      clients[idx] = client;
      this.saveClients(userId, clients);
    }
  },

  deleteClient(userId: string, clientId: string): void {
    // Also deletes associated pets
    const clients = this.getClients(userId).filter(c => c.id !== clientId);
    this.saveClients(userId, clients);

    const pets = this.getPets(userId).filter(p => p.clientId !== clientId);
    this.savePets(userId, pets);
  },

  // Pet CRUD
  addPet(userId: string, petData: Omit<Pet, 'id' | 'userId'>): Pet {
    const pets = this.getPets(userId);
    const newPet: Pet = {
      ...petData,
      id: 'pet_' + Math.random().toString(36).substr(2, 9),
      userId
    };
    pets.push(newPet);
    this.savePets(userId, pets);
    return newPet;
  },

  updatePet(userId: string, pet: Pet): void {
    const pets = this.getPets(userId);
    const idx = pets.findIndex(p => p.id === pet.id);
    if (idx !== -1) {
      pets[idx] = pet;
      this.savePets(userId, pets);
    }
  },

  deletePet(userId: string, petId: string): void {
    const pets = this.getPets(userId).filter(p => p.id !== petId);
    this.savePets(userId, pets);
  },

  // Walk Tracker CRUD
  addWalk(userId: string, walk: Walk): void {
    const walks = this.getWalks(userId);
    walks.unshift(walk);
    this.saveWalks(userId, walks);
  },

  updateWalk(userId: string, updatedWalk: Walk): void {
    const walks = this.getWalks(userId);
    const idx = walks.findIndex(w => w.id === updatedWalk.id);
    if (idx !== -1) {
      walks[idx] = updatedWalk;
      this.saveWalks(userId, walks);
    }
  }
};
