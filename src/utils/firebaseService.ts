/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  orderBy 
} from 'firebase/firestore';
import { Client, Pet, Walk, User } from '../types';

export const FirebaseService = {
  // --- AUTH OPERATIONS ---
  async registerUser(name: string, email: string, passwordSecret: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), passwordSecret);
      const firebaseUser = userCredential.user;
      
      // Save display name in Auth
      await updateProfile(firebaseUser, { displayName: name });
      
      return {
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || email
      };
    } catch (error: any) {
      console.error('Error in registerUser:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('A senha deve conter no mínimo 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('E-mail inválido.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('O login por e-mail e senha não está ativo no Firebase. Ative "Email/Password" em "Authentication -> Sign-in method" no console.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Serviço de Autenticação não configurado no console Firebase. Acesse "Authentication" -> "Get Started" e selecione "E-mail/Senha" como provedor.');
      } else {
        throw new Error(error.message || 'Erro ao criar conta.');
      }
    }
  },

  async loginUser(email: string, passwordSecret: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), passwordSecret);
      const firebaseUser = userCredential.user;
      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
        email: firebaseUser.email || email
      };
    } catch (error: any) {
      console.error('Error in loginUser:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('E-mail inválido.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('O login por e-mail e senha não está ativo no Firebase. Ative "Email/Password" em "Authentication -> Sign-in method" no console.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Serviço de Autenticação não configurado no console Firebase. Acesse "Authentication" -> "Get Started" e selecione "E-mail/Senha" como provedor.');
      } else {
        throw new Error(error.message || 'Erro ao realizar login.');
      }
    }
  },

  async logoutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Error in logoutUser:', error);
      throw new Error(error.message || 'Erro ao desvincular sessão.');
    }
  },

  // --- CLIENT CRUD ---
  async getClients(userId: string): Promise<Client[]> {
    try {
      const q = query(
        collection(db, 'clientes'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const clients: Client[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          userId: data.userId,
          fullName: data.fullName || '',
          phone: data.phone || '',
          whatsApp: data.whatsApp || '',
          address: data.address || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Fallback in case orderBy fails because index is building
      try {
        const fallbackQ = query(collection(db, 'clientes'), where('userId', '==', userId));
        const snapshot = await getDocs(fallbackQ);
        const clients: Client[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          clients.push({
            id: doc.id,
            userId: data.userId,
            fullName: data.fullName || '',
            phone: data.phone || '',
            whatsApp: data.whatsApp || '',
            address: data.address || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            notes: data.notes || '',
            createdAt: data.createdAt || new Date().toISOString()
          });
        });
        return clients.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (innerErr) {
        console.error('Inner fallback fetching clients failed:', innerErr);
        return [];
      }
    }
  },

  async addClient(userId: string, clientData: Omit<Client, 'id' | 'userId' | 'createdAt'>): Promise<Client> {
    try {
      const clientColl = collection(db, 'clientes');
      const createdAt = new Date().toISOString();
      const docRef = await addDoc(clientColl, {
        ...clientData,
        userId,
        createdAt
      });
      return {
        ...clientData,
        id: docRef.id,
        userId,
        createdAt
      };
    } catch (error: any) {
      console.error('Error adding client:', error);
      throw new Error(error.message || 'Erro ao adicionar tutor.');
    }
  },

  async updateClient(userId: string, client: Client): Promise<void> {
    try {
      const docRef = doc(db, 'clientes', client.id);
      await updateDoc(docRef, {
        fullName: client.fullName,
        phone: client.phone,
        whatsApp: client.whatsApp,
        address: client.address,
        neighborhood: client.neighborhood,
        city: client.city,
        notes: client.notes
      });
    } catch (error: any) {
      console.error('Error updating client:', error);
      throw new Error(error.message || 'Erro ao atualizar tutor.');
    }
  },

  async deleteClient(userId: string, clientId: string): Promise<void> {
    try {
      // 1. Delete client document
      const clientDocRef = doc(db, 'clientes', clientId);
      await deleteDoc(clientDocRef);

      // 2. Cascade delete associated pets
      const petsQ = query(collection(db, 'pets'), where('clientId', '==', clientId), where('userId', '==', userId));
      const petsSnapshot = await getDocs(petsQ);
      for (const petDoc of petsSnapshot.docs) {
        await deleteDoc(doc(db, 'pets', petDoc.id));
      }
    } catch (error: any) {
      console.error('Error deleting client:', error);
      throw new Error(error.message || 'Erro ao excluir tutor.');
    }
  },

  // --- PET CRUD ---
  async getPets(userId: string): Promise<Pet[]> {
    try {
      const q = query(collection(db, 'pets'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const pets: Pet[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pets.push({
          id: doc.id,
          clientId: data.clientId || '',
          userId: data.userId || userId,
          photo: data.photo || '',
          name: data.name || '',
          species: data.species || 'Cão',
          breed: data.breed || '',
          gender: data.gender || 'Macho',
          birthDate: data.birthDate || '',
          color: data.color || '',
          weight: Number(data.weight) || 0,
          size: data.size || 'Médio',
          health: data.health || { medications: '', allergies: '', dietaryRestrictions: '', specialNeeds: '' },
          behaviour: data.behaviour || { sociable: true, aggressive: false, fearful: false, anxious: false, likesOtherAnimals: true, likesChildren: true },
          notes: data.notes || ''
        });
      });
      return pets;
    } catch (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
  },

  async addPet(userId: string, petData: Omit<Pet, 'id' | 'userId'>): Promise<Pet> {
    try {
      const petsColl = collection(db, 'pets');
      const docRef = await addDoc(petsColl, {
        ...petData,
        userId
      });
      return {
        ...petData,
        id: docRef.id,
        userId
      };
    } catch (error: any) {
      console.error('Error adding pet:', error);
      throw new Error(error.message || 'Erro ao adicionar pet.');
    }
  },

  async updatePet(userId: string, pet: Pet): Promise<void> {
    try {
      const docRef = doc(db, 'pets', pet.id);
      await updateDoc(docRef, {
        clientId: pet.clientId,
        photo: pet.photo,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        birthDate: pet.birthDate,
        color: pet.color,
        weight: pet.weight,
        size: pet.size,
        health: pet.health,
        behaviour: pet.behaviour,
        notes: pet.notes
      });
    } catch (error: any) {
      console.error('Error updating pet:', error);
      throw new Error(error.message || 'Erro ao atualizar pet.');
    }
  },

  async deletePet(userId: string, petId: string): Promise<void> {
    try {
      const docRef = doc(db, 'pets', petId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      throw new Error(error.message || 'Erro ao excluir pet.');
    }
  },

  // --- WALK CRUD ---
  async getWalks(userId: string): Promise<Walk[]> {
    try {
      const q = query(
        collection(db, 'passeios'), 
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const walks: Walk[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        walks.push({
          id: doc.id,
          userId: data.userId || userId,
          petIds: data.petIds || [],
          startTime: data.startTime || '',
          endTime: data.endTime || null,
          durationMinutes: Number(data.durationMinutes) || 0,
          notes: data.notes || '',
          photos: data.photos || [],
          events: data.events || [],
          routeSimulated: data.routeSimulated || []
        });
      });
      return walks;
    } catch (error) {
      console.error('Error fetching walks:', error);
      // Fallback in case index is building
      try {
        const fallbackQ = query(collection(db, 'passeios'), where('userId', '==', userId));
        const snapshot = await getDocs(fallbackQ);
        const walks: Walk[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          walks.push({
            id: doc.id,
            userId: data.userId || userId,
            petIds: data.petIds || [],
            startTime: data.startTime || '',
            endTime: data.endTime || null,
            durationMinutes: Number(data.durationMinutes) || 0,
            notes: data.notes || '',
            photos: data.photos || [],
            events: data.events || [],
            routeSimulated: data.routeSimulated || []
          });
        });
        return walks.sort((a, b) => b.startTime.localeCompare(a.startTime));
      } catch (innerErr) {
        console.error('Inner fallback fetching walks failed:', innerErr);
        return [];
      }
    }
  },

  async addWalk(userId: string, walk: Omit<Walk, 'id'>): Promise<Walk> {
    try {
      const walksColl = collection(db, 'passeios');
      const docRef = await addDoc(walksColl, {
        ...walk,
        userId
      });
      return {
        ...walk,
        id: docRef.id,
        userId
      };
    } catch (error: any) {
      console.error('Error adding walk:', error);
      throw new Error(error.message || 'Erro ao salvar passeio.');
    }
  }
};
