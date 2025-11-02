import {easyWords} from "@/app/components/words/easyWords";
import {mediumWords} from "@/app/components/words/mediumWords";
import {hardWords} from "@/app/components/words/hardWords";

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'team' | 'individual';
export type GameState = 'setup' | 'names' | 'playing' | 'results';

export interface Word {
    text: string;
    difficulty: Difficulty;
}

export interface Player {
    id: number;
    name: string;
    score: number;
}

export interface Team {
    id: number;
    name: string;
    score: number;
    streak: number;
}

export interface GameConfig {
    gameMode: GameMode;
    playerCount: number;
    selectedDifficulties: Difficulty[];
    singleDifficulty: boolean;
    roundsCount: number;
}

export interface GamePlayState {
    currentWord: Word | null;
    showWord: boolean;
    isWordVisible: boolean;
    timeLeft: number;
    isTimerRunning: boolean;
    currentRound: number;
    startTime: number;
    isPaused: boolean;
    currentTeamIndex: number;
    currentPlayerIndex: number;
}

export const POINTS: Record<Difficulty, number> = {
    easy: 1,
    medium: 2,
    hard: 3
};

export const WORDS: Record<Difficulty, string[]> = {
    easy: easyWords,
    medium: mediumWords,
    hard: hardWords,
};

export const INITIAL_TEAMS: Team[] = [
    { id: 1, name: 'Команда 1', score: 0, streak: 0 },
    { id: 2, name: 'Команда 2', score: 0, streak: 0 }
];

export const TIMER_DURATION = 60;
export const SPEED_BONUS_FAST = 20;
export const SPEED_BONUS_MEDIUM = 40;
export const STREAK_BONUS_SMALL = 3;
export const STREAK_BONUS_LARGE = 5;