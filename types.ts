import { ThreeElements } from '@react-three/fiber';

export interface User {
  id: string;
  name: string;
  avatar: string; // URL or base64
  code: string; // Lottery number
  phoneNumber?: string; // Mobile phone number for verification
  joinedAt: number;
}

export interface Prize {
  id: string;
  name: string;
  count: number;
  image: string;
}

export type LotteryStatus = 'idle' | 'rolling' | 'exploded' | 'winner-revealed';

export type DisplayMode = 'sphere' | 'helix' | 'grid';

export interface AppState {
  users: User[];
  winners: User[];
  currentPrize: Prize;
  prizes: Prize[]; // List of all configured prizes
  status: LotteryStatus;
  lastInteraction: number; // Timestamp for visual effects sync
  presetWinnerId: string | null; // ID of the user guaranteed to win next
  displayMode: DisplayMode;
  
  // Actions
  addUser: (user: User) => void;
  setStatus: (status: LotteryStatus) => void;
  drawWinner: () => void;
  resetLottery: () => void;
  updatePrize: (prize: Partial<Prize>) => void;
  removeUser: (userId: string) => void; // For moderation
  triggerInteraction: () => void; // Mobile user wave interaction
  setPresetWinner: (userId: string | null) => void; // Set or clear preset winner
  setDisplayMode: (mode: DisplayMode) => void;
  
  // Prize Management Actions
  addPrize: (prize: Prize) => void;
  deletePrize: (id: string) => void;
  selectPrize: (prizeId: string) => void;
}

export const DEFAULT_PRIZES: Prize[] = [
  {
    id: '1',
    name: '特等奖：维珍银河太空船票',
    count: 1,
    image: 'https://picsum.photos/seed/space/200/200',
  },
  {
    id: '2',
    name: '一等奖：最新款 Mac Studio',
    count: 3,
    image: 'https://picsum.photos/seed/mac/200/200',
  },
  {
    id: '3',
    name: '二等奖：iPhone 16 Pro',
    count: 10,
    image: 'https://picsum.photos/seed/iphone/200/200',
  }
];

export const DEFAULT_PRIZE = DEFAULT_PRIZES[0];

// Extend JSX.IntrinsicElements for React Three Fiber to fix missing element type errors
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}