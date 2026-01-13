
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, DEFAULT_PRIZE, DEFAULT_PRIZES, LotteryStatus, User, Barrage, AppTheme } from './types';

// BroadcastChannel for cross-tab communication (Simulating WebSocket)
const channel = new BroadcastChannel('lottery_sync');

interface StoreState extends AppState {
  _hasHydrated: boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // Listen for updates from other tabs
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SYNC_STATE') {
          // When syncing from another tab, we merge state.
          // Note: In a real app with persist, you might want to be careful about 
          // race conditions, but for this setup, broadcast acts as the "server push"
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
        lastBarrage: null,
        barrageEnabled: true,
        theme: 'nebula',
        
        // Auth defaults
        adminPassword: '123456',
        isAuthenticated: false,
        
        _hasHydrated: false,

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
            
            // Change: Set status to 'exploded' (Tension phase) instead of revealing immediately
            const newState = { 
                winners: newWinners, 
                status: 'exploded' as LotteryStatus,
                presetWinnerId: null 
            };
            
            broadcast(newState);
            return newState;
        });
        },

        revealWinner: () => {
            set(() => {
                const newState = { status: 'winner-revealed' as LotteryStatus };
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
        },

        sendBarrage: (text, user) => {
            // Neon palette
            const colors = [
                '#ef4444', // red
                '#f97316', // orange
                '#f59e0b', // amber
                '#84cc16', // lime
                '#10b981', // emerald
                '#06b6d4', // cyan
                '#3b82f6', // blue
                '#8b5cf6', // violet
                '#d946ef', // fuchsia
                '#f43f5e', // rose
                '#ffffff'  // white
            ];
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const barrage: Barrage = {
                id: crypto.randomUUID(),
                text,
                senderName: user.name,
                avatar: user.avatar,
                color,
                timestamp: Date.now()
            };

            set(() => {
                const newState = { lastBarrage: barrage };
                broadcast(newState);
                return newState;
            });
        },

        setBarrageEnabled: (enabled) => {
            set(() => {
                const newState = { barrageEnabled: enabled };
                broadcast(newState);
                return newState;
            });
        },

        setTheme: (theme: AppTheme) => {
            set(() => {
                const newState = { theme };
                broadcast(newState);
                return newState;
            });
        },

        // Auth Logic
        login: (password) => {
            const state = get();
            if (password === state.adminPassword) {
                set({ isAuthenticated: true });
                return true;
            }
            return false;
        },

        logout: () => {
            set({ isAuthenticated: false });
        },

        changePassword: (newPassword) => {
            set({ adminPassword: newPassword });
            // Note: Does not broadcast security changes to prevent sync issues across public/private
        },

        generateMockUsers: (count) => {
            set((state) => {
                const avatars = [
                    'https://picsum.photos/seed/a1/200', 'https://picsum.photos/seed/a2/200', 
                    'https://picsum.photos/seed/a3/200', 'https://picsum.photos/seed/a4/200',
                    'https://picsum.photos/seed/a5/200', 'https://picsum.photos/seed/a6/200'
                ];
                const newUsers: User[] = Array.from({ length: count }).map((_, i) => ({
                    id: crypto.randomUUID(),
                    name: `Guest ${Math.floor(Math.random() * 9000)}`,
                    avatar: avatars[Math.floor(Math.random() * avatars.length)],
                    code: Math.floor(10000 + Math.random() * 90000).toString(),
                    phoneNumber: `138${Math.floor(Math.random()*100000000)}`,
                    joinedAt: Date.now()
                }));
                
                // Merge and deduplicate just in case
                const combined = [...state.users, ...newUsers];
                const newState = { users: combined };
                broadcast(newState);
                return newState;
            });
        },

        clearAllUsers: () => {
            set(() => {
                const newState = { users: [], winners: [], presetWinnerId: null };
                broadcast(newState);
                return newState;
            });
        }
      };
    },
    {
      name: 'nebula-lottery-storage', // unique name
      storage: createJSONStorage(() => localStorage),
      // IMPORTANT: Add adminPassword to persistence, but EXCLUDE isAuthenticated to require login on refresh
      partialize: (state) => ({ 
        users: state.users,
        winners: state.winners,
        prizes: state.prizes,
        currentPrize: state.currentPrize,
        presetWinnerId: state.presetWinnerId,
        barrageEnabled: state.barrageEnabled,
        displayMode: state.displayMode,
        theme: state.theme,
        adminPassword: state.adminPassword 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      }
    }
  )
);
