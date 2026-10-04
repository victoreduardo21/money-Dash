
import { User, PersonalTransaction, Investment, CalendarEvent, Plan, BillingCycle, Language, CreditCard, CreditTransaction, Subscription, SystemNotification, Goal, Currency, BankAccount, BankConnection } from '../types';
import { db, auth } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    setDoc
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        cleaned[key] = 0;
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned as any;
  }
  if (typeof obj === 'number' && (isNaN(obj) || !isFinite(obj))) {
    return 0 as any;
  }
  return obj;
}

export const api = {
    login: async (credentials: any) => {
        // This is a placeholder as the user will likely use Firebase Auth directly now.
        // But let's keep it for compatibility if needed.
        return { error: false, message: "Use Firebase Auth directly." };
    },
    createUser: async (user: Omit<User, 'id'>, userId?: string) => {
        const uid = userId || auth.currentUser?.uid;
        if (!uid) throw new Error("No user ID provided.");
        const userRef = doc(db, 'users', uid);
        try {
            await setDoc(userRef, { ...user });
            return { error: false, success: true, message: "Sucesso" };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'users/' + uid);
            return { error: true, success: false, message: "Erro ao criar usuário" };
        }
    },
    getMe: async (token: string): Promise<User | null> => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return null;
        const userRef = doc(db, 'users', uid);
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return { ...userSnap.data(), id: userSnap.id } as User;
            }
            return null;
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, 'users/' + uid);
            return null;
        }
    },
    updateLanguage: async (language: Language, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, { language });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    updatePlan: async (plan: Plan, cycle: BillingCycle, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, { plan, billingCycle: cycle });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    getTransactions: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'transactions'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as PersonalTransaction));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'transactions');
            return [];
        }
    },
    createTransaction: async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) {
            console.error("Tentativa de criar transação sem UID.");
            throw new Error("Usuário não autenticado no sistema.");
        }
        try {
            const { id, ...data } = transaction;
            const payload = { 
                ...data, 
                amount: Number(data.amount),
                userId: uid,
                createdAt: data.createdAt || new Date().toISOString()
            };
            console.log("Saving Transaction:", payload);
            
            if (id) {
                await updateDoc(doc(db, 'transactions', id), payload);
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'transactions'), payload);
                console.log("Transaction created with ID:", docRef.id);
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            console.error("Erro no api.createTransaction:", error);
            handleFirestoreError(error, OperationType.CREATE, 'transactions');
        }
    },
    deleteTransaction: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'transactions', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'transactions/' + id);
        }
    },
    getInvestments: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'investments'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Investment));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'investments');
            return [];
        }
    },
    createInvestment: async (investment: Omit<Investment, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = investment;
            if (id) {
                await updateDoc(doc(db, 'investments', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'investments'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'investments');
        }
    },
    withdrawInvestment: async (id: string, token: string) => {
        // Implement logical withdrawal or just mark as zero
        try {
            await updateDoc(doc(db, 'investments', id), { currentValue: 0 });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'investments/' + id);
        }
    },
    deleteInvestment: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'investments', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'investments/' + id);
        }
    },
    syncGoalInvestment: async (goal: Goal, token: string, existingInvestments: Investment[] = []) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return { error: true, message: "Unauthorized" };
        
        const goalId = String(goal.id || '');
        if (!goalId) return { error: true, message: "Goal ID missing" };

        const invId = `goal_inv_${goalId}`;
        const targetRef = doc(db, 'investments', invId);

        const amount = Number(goal.currentAmount) || 0;
        const currency = ((goal.currency || 'BRL').toUpperCase() === 'USD' ? 'USD' : 'BRL') as Currency;

        const investmentData: Investment = {
            id: invId,
            name: `🎯 Meta: ${goal.title}`,
            initialAmount: amount,
            currentValue: amount,
            yieldRate: 100, // 100% CDI
            currency,
            userId: uid,
            goalId,
            category: goal.category ? `Meta: ${goal.category}` : 'Meta & Reserva'
        };

        const cleanedInv = cleanFirestoreData(investmentData);

        try {
            await setDoc(targetRef, cleanedInv, { merge: true });
            return { error: false, id: invId, investment: cleanedInv, amount };
        } catch (error) {
            console.warn("Aviso ao sincronizar meta com investimentos no Firestore:", error);
            return { error: false, id: invId, investment: cleanedInv, amount };
        }
    },
    deleteGoalInvestment: async (goalId: string, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return { error: true };
        try {
            const invId = `goal_inv_${goalId}`;
            await deleteDoc(doc(db, 'investments', invId));
        } catch (e) {
            // Document may not exist, ignore
        }
        return { error: false };
    },
    getCalendarEvents: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'calendar'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalendarEvent));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'calendar');
            return [];
        }
    },
    createCalendarEvent: async (event: Omit<CalendarEvent, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = event;
            if (id) {
                await updateDoc(doc(db, 'calendar', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'calendar'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'calendar');
        }
    },
    toggleCalendarEvent: async (id: string, done: boolean, token: string) => {
        try {
            await updateDoc(doc(db, 'calendar', id), { done });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'calendar/' + id);
        }
    },
    deleteCalendarEvent: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'calendar', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'calendar/' + id);
        }
    },
    updatePassword: async (data: {currentPassword: string, newPassword: string}, token: string) => {
        // In Firebase, password update is done via auth.currentUser.updatePassword
        // This would require different logic. For now return placeholder or error.
        return { error: true, message: "Use Firebase Auth to update password." };
    },
    updateAvatar: async (data: {avatar: string}, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            await updateDoc(doc(db, 'users', uid), { avatar: data.avatar });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    getAllUsers: async (token: string) => {
        // Admin only?
        try {
            const snap = await getDocs(collection(db, 'users'));
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'users');
            return [];
        }
    },
    toggleUserStatus: async (data: {targetEmail: string, status: string}, token: string) => {
        // Find user by email
        const q = query(collection(db, 'users'), where('email', '==', data.targetEmail));
        try {
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docRef = doc(db, 'users', snap.docs[0].id);
                await updateDoc(docRef, { subscriptionStatus: data.status });
                return { error: false };
            }
            return { error: true, message: "User not found." };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users (toggleStatus)');
        }
    },
    updateUser: async (uid: string, data: Partial<User>) => {
        try {
            await updateDoc(doc(db, 'users', uid), data);
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users/' + uid);
        }
    },
    getCreditCards: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'credit_cards'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CreditCard));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'credit_cards');
            return [];
        }
    },
    createCreditCard: async (card: Omit<CreditCard, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = card;
            if (id) {
                await updateDoc(doc(db, 'credit_cards', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'credit_cards'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'credit_cards');
        }
    },
    deleteCreditCard: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'credit_cards', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'credit_cards/' + id);
        }
    },
    getCreditTransactions: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'credit_transactions'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CreditTransaction));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'credit_transactions');
            return [];
        }
    },
    createCreditTransaction: async (transaction: Omit<CreditTransaction, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = transaction;
            if (id) {
                await updateDoc(doc(db, 'credit_transactions', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'credit_transactions'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'credit_transactions');
        }
    },
    deleteCreditTransaction: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'credit_transactions', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'credit_transactions/' + id);
        }
    },
    saveAiConversation: async (data: { messages: any[], lastUpdate: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const docRef = doc(db, 'ai_conversations', uid);
        try {
            await setDoc(docRef, { ...data, userId: uid });
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'ai_conversations/' + uid);
        }
    },
    getSubscriptions: async (token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(collection(db, 'subscriptions'), where('userId', '==', uid));
        try {
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Subscription));
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'subscriptions');
            return [];
        }
    },
    createSubscription: async (subscription: Omit<Subscription, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const { id, ...data } = subscription;
            if (id) {
                await updateDoc(doc(db, 'subscriptions', id), { ...data, userId: uid });
                return { error: false, id };
            } else {
                const docRef = await addDoc(collection(db, 'subscriptions'), { ...data, userId: uid });
                return { error: false, id: docRef.id };
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'subscriptions');
        }
    },
    deleteSubscription: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'subscriptions', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'subscriptions/' + id);
        }
    },
    createNotification: async (notification: Omit<SystemNotification, 'id'>, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        try {
            const docRef = await addDoc(collection(db, 'notifications'), { ...notification });
            return { error: false, id: docRef.id };
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'notifications');
        }
    },
    deleteNotification: async (id: string, token: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', id));
            return { error: false };
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'notifications/' + id);
        }
    },
    getGoals: async (token: string): Promise<Goal[]> => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) return [];
        try {
            const q = query(collection(db, 'goals'), where('userId', '==', uid));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal));
            if (list.length > 0) {
                localStorage.setItem(`cached_goals_${uid}`, JSON.stringify(list));
                return list;
            }
        } catch (error) {
            console.warn('Firestore goals query error, checking localStorage:', error);
        }
        try {
            const local = localStorage.getItem(`cached_goals_${uid}`);
            if (local) return JSON.parse(local);
        } catch (e) {
            console.error('Local storage goals parsing error:', e);
        }
        return [];
    },
    createGoal: async (goal: Omit<Goal, 'id'> & { id?: string }, token: string) => {
        const uid = token || auth.currentUser?.uid;
        if (!uid) throw new Error("Unauthorized");
        const { id, ...data } = goal;

        // Clean milestones to guarantee no undefined fields (e.g. completedAt)
        const cleanMilestones = Array.isArray(data.milestones) ? data.milestones.map((m: any, idx: number) => ({
            id: String(m.id || `m_${idx + 1}_${Date.now()}`),
            monthNumber: Number(m.monthNumber) || (idx + 1),
            monthLabel: String(m.monthLabel || `Mês ${idx + 1}`),
            targetAmount: Number(m.targetAmount) || 0,
            savedAmount: Number(m.savedAmount) || 0,
            isCompleted: Boolean(m.isCompleted || ((Number(m.savedAmount) || 0) >= (Number(m.targetAmount) || 1) && Number(m.targetAmount) > 0)),
            ...(m.completedAt ? { completedAt: String(m.completedAt) } : {})
        })) : [];

        // Clean contributions
        const cleanContributions = Array.isArray(data.contributions) ? data.contributions.map((c: any) => ({
            id: String(c.id || `c_${Date.now()}`),
            amount: Number(c.amount) || 0,
            date: String(c.date || new Date().toISOString().slice(0, 10)),
            ...(c.milestoneId ? { milestoneId: String(c.milestoneId) } : {}),
            ...(c.note ? { note: String(c.note) } : {}),
            deductFromBalance: Boolean(c.deductFromBalance),
            createdAt: String(c.createdAt || new Date().toISOString())
        })) : [];

        const payload: Record<string, any> = {
            ...data,
            title: String(data.title || '').trim(),
            description: String(data.description || '').trim(),
            category: String(data.category || 'Reserva').trim(),
            targetAmount: Number(data.targetAmount) || 0,
            currentAmount: Number(data.currentAmount) || 0,
            currency: ((data.currency || 'BRL').toUpperCase() === 'USD' ? 'USD' : 'BRL'),
            targetMonths: Number(data.targetMonths) || 6,
            startDate: String(data.startDate || new Date().toISOString().slice(0, 7)),
            deadlineDate: String(data.deadlineDate || ''),
            distributionType: data.distributionType === 'CUSTOM' ? 'CUSTOM' : 'EQUAL',
            status: (Number(data.currentAmount) || 0) >= (Number(data.targetAmount) || 1) ? 'COMPLETED' : (data.status || 'IN_PROGRESS'),
            milestones: cleanMilestones,
            contributions: cleanContributions,
            userId: uid,
            updatedAt: new Date().toISOString()
        };

        const cleanedPayload = cleanFirestoreData(payload);

        try {
            if (id && !id.startsWith('local_')) {
                await setDoc(doc(db, 'goals', id), cleanedPayload, { merge: true });
                const updatedGoal = { ...cleanedPayload, id } as Goal;
                const local = localStorage.getItem(`cached_goals_${uid}`);
                if (local) {
                    const parsed: Goal[] = JSON.parse(local);
                    const updated = parsed.map(g => g.id === id ? updatedGoal : g);
                    localStorage.setItem(`cached_goals_${uid}`, JSON.stringify(updated));
                }
                return { error: false, id, goal: updatedGoal };
            } else {
                const docRef = await addDoc(collection(db, 'goals'), cleanedPayload);
                const newGoal = { ...cleanedPayload, id: docRef.id } as Goal;
                const local = localStorage.getItem(`cached_goals_${uid}`);
                const parsed: Goal[] = local ? JSON.parse(local) : [];
                const filtered = parsed.filter(g => g.id !== id);
                filtered.unshift(newGoal);
                localStorage.setItem(`cached_goals_${uid}`, JSON.stringify(filtered));
                return { error: false, id: docRef.id, goal: newGoal };
            }
        } catch (error) {
            console.error('Firestore createGoal error:', error);
            const goalId = id || ('local_goal_' + Date.now());
            const localGoal = { ...cleanedPayload, id: goalId } as Goal;
            const local = localStorage.getItem(`cached_goals_${uid}`);
            const parsed: Goal[] = local ? JSON.parse(local) : [];
            const existingIndex = parsed.findIndex(g => g.id === goalId);
            if (existingIndex >= 0) {
                parsed[existingIndex] = localGoal;
            } else {
                parsed.unshift(localGoal);
            }
            localStorage.setItem(`cached_goals_${uid}`, JSON.stringify(parsed));
            return { error: false, id: goalId, goal: localGoal };
        }
    },
    deleteGoal: async (id: string, token: string) => {
        const uid = token || auth.currentUser?.uid;
        try {
            if (!id.startsWith('local_')) {
                await deleteDoc(doc(db, 'goals', id));
            }
        } catch (error) {
            console.warn('Firestore deleteGoal error:', error);
        }
        try {
            const invId = `goal_inv_${id}`;
            await deleteDoc(doc(db, 'investments', invId));
        } catch (e) {}

        if (uid) {
            const local = localStorage.getItem(`cached_goals_${uid}`);
            if (local) {
                const parsed: Goal[] = JSON.parse(local);
                const filtered = parsed.filter(g => g.id !== id);
                localStorage.setItem(`cached_goals_${uid}`, JSON.stringify(filtered));
            }
        }
        return { error: false };
    },
    getBankConnections: async (userId: string): Promise<BankConnection[]> => {
        try {
            const raw = localStorage.getItem(`pluggy_connections_${userId}`);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },
    saveBankConnection: async (connection: BankConnection, userId: string) => {
        try {
            const raw = localStorage.getItem(`pluggy_connections_${userId}`);
            const list: BankConnection[] = raw ? JSON.parse(raw) : [];
            const filtered = list.filter(c => c.itemId !== connection.itemId);
            filtered.unshift(connection);
            localStorage.setItem(`pluggy_connections_${userId}`, JSON.stringify(filtered));
            return { error: false };
        } catch (e) {
            return { error: true };
        }
    },
    deleteBankConnection: async (itemId: string, userId: string) => {
        try {
            const raw = localStorage.getItem(`pluggy_connections_${userId}`);
            if (raw) {
                const list: BankConnection[] = JSON.parse(raw);
                localStorage.setItem(`pluggy_connections_${userId}`, JSON.stringify(list.filter(c => c.itemId !== itemId)));
            }
            return { error: false };
        } catch (e) {
            return { error: true };
        }
    },
    getBankAccounts: async (userId: string): Promise<BankAccount[]> => {
        try {
            const raw = localStorage.getItem(`pluggy_accounts_${userId}`);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },
    saveBankAccount: async (account: BankAccount, userId: string) => {
        try {
            const raw = localStorage.getItem(`pluggy_accounts_${userId}`);
            const list: BankAccount[] = raw ? JSON.parse(raw) : [];
            const filtered = list.filter(a => a.id !== account.id);
            filtered.push(account);
            localStorage.setItem(`pluggy_accounts_${userId}`, JSON.stringify(filtered));
            return { error: false };
        } catch (e) {
            return { error: true };
        }
    },
    deleteBankAccount: async (accountId: string, userId: string) => {
        try {
            const raw = localStorage.getItem(`pluggy_accounts_${userId}`);
            if (raw) {
                const list: BankAccount[] = JSON.parse(raw);
                localStorage.setItem(`pluggy_accounts_${userId}`, JSON.stringify(list.filter(a => a.id !== accountId && a.itemId !== accountId)));
            }
            return { error: false };
        } catch (e) {
            return { error: true };
        }
    }
};
