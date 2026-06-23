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
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
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
import { Client, Pet, Walk, User, ScheduledWalk } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isPermissionError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error || '').toLowerCase();
  return (
    error.code === 'permission-denied' ||
    msg.includes('permission') ||
    msg.includes('permissão') ||
    msg.includes('insufficient')
  );
}

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

  async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      // Emphasize popup per standard instructions for previews/iFrames
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Utilizador Google',
        email: firebaseUser.email || ''
      };
    } catch (error: any) {
      console.error('Error in loginWithGoogle:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('O login com Google foi cancelado por fechar a janela.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('O login social do Google não está ativado no Firebase ou precisa de configuração de domínio.');
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
          petDetails: data.petDetails || [],
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
            petDetails: data.petDetails || [],
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
  },

  async getWalkById(walkId: string): Promise<Walk | null> {
    try {
      const docRef = doc(db, 'passeios', walkId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || '',
          petIds: data.petIds || [],
          petDetails: data.petDetails || [],
          startTime: data.startTime || '',
          endTime: data.endTime || null,
          durationMinutes: Number(data.durationMinutes) || 0,
          notes: data.notes || '',
          photos: data.photos || [],
          events: data.events || [],
          routeSimulated: data.routeSimulated || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching walk by id:', error);
      return null;
    }
  },

  async updateWalk(userId: string, walkId: string, updates: Partial<Omit<Walk, 'id' | 'userId'>>): Promise<void> {
    try {
      const docRef = doc(db, 'passeios', walkId);
      await updateDoc(docRef, updates);
    } catch (error: any) {
      console.error('Error updating walk:', error);
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.UPDATE, `passeios/${walkId}`);
      }
      throw new Error(error.message || 'Erro ao atualizar dados do passeio.');
    }
  },

  // --- SCHEDULE OPERATIONS ---
  async getScheduledWalks(userId: string): Promise<ScheduledWalk[]> {
    try {
      const q = query(
        collection(db, 'agendamentos'),
        where('userId', '==', userId),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      const scheduled: ScheduledWalk[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        scheduled.push({
          id: doc.id,
          userId: data.userId || userId,
          petId: data.petId || '',
          date: data.date || '',
          time: data.time || '',
          type: data.type || 'Passeio',
          duration: data.duration || '30 min',
          notes: data.notes || '',
          status: data.status || 'Pendente'
        });
      });
      return scheduled;
    } catch (error: any) {
      console.error('Error fetching scheduled walks:', error);
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'agendamentos');
      }
      try {
        // Fallback without ordering (in case index is still building)
        const qFallback = query(collection(db, 'agendamentos'), where('userId', '==', userId));
        const snapshot = await getDocs(qFallback);
        const scheduled: ScheduledWalk[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          scheduled.push({
            id: doc.id,
            userId: data.userId || userId,
            petId: data.petId || '',
            date: data.date || '',
            time: data.time || '',
            type: data.type || 'Passeio',
            duration: data.duration || '30 min',
            notes: data.notes || '',
            status: data.status || 'Pendente'
          });
        });
        return scheduled.sort((a, b) => {
          const dateTimeA = `${a.date}T${a.time}`;
          const dateTimeB = `${b.date}T${b.time}`;
          return dateTimeA.localeCompare(dateTimeB);
        });
      } catch (innerErr) {
        console.error('Fallback fetching scheduled walks failed:', innerErr);
        if (isPermissionError(innerErr)) {
          handleFirestoreError(innerErr, OperationType.LIST, 'agendamentos');
        }
        return [];
      }
    }
  },

  async addScheduledWalk(userId: string, scheduledWalk: Omit<ScheduledWalk, 'id' | 'userId'>): Promise<ScheduledWalk> {
    try {
      const agendamentosColl = collection(db, 'agendamentos');
      const docRef = await addDoc(agendamentosColl, {
        ...scheduledWalk,
        userId
      });
      return {
        ...scheduledWalk,
        id: docRef.id,
        userId
      };
    } catch (error: any) {
      console.error('Error adding scheduled walk:', error);
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.CREATE, 'agendamentos');
      }
      throw new Error(error.message || 'Erro ao agendar passeio.');
    }
  },

  async updateScheduledWalk(userId: string, scheduled: ScheduledWalk): Promise<void> {
    try {
      const docRef = doc(db, 'agendamentos', scheduled.id);
      await updateDoc(docRef, {
        petId: scheduled.petId,
        date: scheduled.date,
        time: scheduled.time,
        type: scheduled.type,
        duration: scheduled.duration,
        notes: scheduled.notes || '',
        status: scheduled.status
      });
    } catch (error: any) {
      console.error('Error updating scheduled walk:', error);
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.UPDATE, `agendamentos/${scheduled.id}`);
      }
      throw new Error(error.message || 'Erro ao atualizar agendamento.');
    }
  },

  async deleteScheduledWalk(userId: string, scheduledId: string): Promise<void> {
    try {
      const docRef = doc(db, 'agendamentos', scheduledId);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error deleting scheduled walk:', error);
      if (isPermissionError(error)) {
        handleFirestoreError(error, OperationType.DELETE, `agendamentos/${scheduledId}`);
      }
      throw new Error(error.message || 'Erro ao deletar agendamento.');
    }
  }
};
