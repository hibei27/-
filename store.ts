import { create } from 'zustand';
import { AppState, DEFAULT_PRIZE, DEFAULT_PRIZES, LotteryStatus, User } from './types';

// BroadcastChannel for cross-tab communication (Simulating WebSocket)
const channel = new BroadcastChannel('lottery_sync');

interface StoreState extends AppState {
  _hasHydrated: boolean;
}

export const useStore = create<StoreState>((set, get) => {
  
  // Listen for updates from other tabs
  channel.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === 'SYNC_STATE') {
      set((state) => ({ ...state, ...payload }));
    }
  };

  const broadcast = (state: Partial<StoreState>) => {
    channel.postMessage({ type: 'SYNC_STATE', payload: state });
  };

  return {
    users: [],
    winners: [],
    currentPrize: DEFAULT_PRIZE,
    prizes: DEFAULT_PRIZES,
    status: 'idle',
    lastInteraction: 0,
    presetWinnerId: null,
    displayMode: 'sphere',
    _hasHydrated: true,

    addUser: (user: User) => {
      set((state) => {
        // Deduplicate
        if (state.users.find((u) => u.id === user.id)) return state;
        const newUsers = [...state.users, user];
        const newState = { users: newUsers };
        broadcast(newState);
        return newState;
      });
    },

    setStatus: (status: LotteryStatus) => {
      set(() => {
        const newState = { status };
        broadcast(newState);
        return newState;
      });
    },

    drawWinner: () => {
      set((state) => {
        const eligibleUsers = state.users.filter(
          (u) => !state.winners.find((w) => w.id === u.id)
        );

        if (eligibleUsers.length === 0) return state;

        let winner: User;

        // Check for preset winner
        if (state.presetWinnerId) {
            const presetUser = eligibleUsers.find(u => u.id === state.presetWinnerId);
            if (presetUser) {
                winner = presetUser;
            } else {
                // Fallback to random if preset user is not found (e.g., left) or already won
                const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
                winner = eligibleUsers[randomIndex];
            }
        } else {
            // Standard random draw
            const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
            winner = eligibleUsers[randomIndex];
        }
        
        const newWinners = [winner, ...state.winners]; // Add to history
        
        // Reset preset winner after successful draw
        const newState = { 
            winners: newWinners, 
            status: 'winner-revealed' as LotteryStatus,
            presetWinnerId: null 
        };
        
        broadcast(newState);
        return newState;
    });
    },

    resetLottery: () => {
      set(() => {
        const newState = { winners: [], status: 'idle' as LotteryStatus, presetWinnerId: null };
        broadcast(newState);
        return newState;
      });
    },

    updatePrize: (prize) => {
      set((state) => {
        const newState = { currentPrize: { ...state.currentPrize, ...prize } };
        // Also update in the list if it exists
        const newPrizes = state.prizes.map(p => 
            p.id === state.currentPrize.id ? { ...p, ...prize } : p
        );
        
        const finalState = { ...newState, prizes: newPrizes };
        broadcast(finalState);
        return finalState;
      });
    },

    removeUser: (userId) => {
      set((state) => {
        const newUsers = state.users.filter(u => u.id !== userId);
        
        // If removed user was preset, clear preset
        const newPresetId = state.presetWinnerId === userId ? null : state.presetWinnerId;

        const newState = { users: newUsers, presetWinnerId: newPresetId };
        broadcast(newState);
        return newState;
      });
    },

    triggerInteraction: () => {
      set(() => {
        // Update timestamp to trigger effects on other clients
        const newState = { lastInteraction: Date.now() };
        broadcast(newState);
        return newState;
      });
    },

    setPresetWinner: (userId) => {
        set(() => {
            const newState = { presetWinnerId: userId };
            broadcast(newState);
            return newState;
        });
    },

    addPrize: (prize) => {
        set((state) => {
            const newPrizes = [...state.prizes, prize];
            const newState = { prizes: newPrizes };
            broadcast(newState);
            return newState;
        });
    },

    deletePrize: (id) => {
        set((state) => {
            const newPrizes = state.prizes.filter(p => p.id !== id);
            // If we deleted the current prize, reset to first available or default
            let newCurrentPrize = state.currentPrize;
            if (state.currentPrize.id === id) {
                newCurrentPrize = newPrizes.length > 0 ? newPrizes[0] : DEFAULT_PRIZE;
            }
            
            const newState = { prizes: newPrizes, currentPrize: newCurrentPrize };
            broadcast(newState);
            return newState;
        });
    },

    selectPrize: (prizeId) => {
        set((state) => {
            const selected = state.prizes.find(p => p.id === prizeId);
            if (!selected) return state;
            
            const newState = { currentPrize: selected };
            broadcast(newState);
            return newState;
        });
    },

    setDisplayMode: (mode) => {
        set(() => {
            const newState = { displayMode: mode };
            broadcast(newState);
            return newState;
        });
    }
  };
});