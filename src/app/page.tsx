'use client'
import React, { useState, useEffect } from 'react';
import { Play, Settings, Eye, EyeOff, Volume2, VolumeX, X } from 'lucide-react';
import {easyWords} from "@/app/components/words/easyWords";
import {mediumWords} from "@/app/components/words/mediumWords";
import {hardWords} from "@/app/components/words/hardWords";

const CrocodileGame = () => {
  const [screen, setScreen] = useState('welcome');
  const [gameMode, setGameMode] = useState<'solo' | 'teams' | null>(null);
  const [teamCount, setTeamCount] = useState(2);
  const [playerCount, setPlayerCount] = useState(2);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [teams, setTeams] = useState([{ id: 0, name: '', score: 0 }]);
  const [players, setPlayers] = useState([{ id: 0, name: '', score: 0 }]);
  const [teamNames, setTeamNames] = useState(['Команда 1', 'Команда 2']);
  const [playerNames, setPlayerNames] = useState(['Гравець 1', 'Гравець 2']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState(120);
  const [scoreTarget, setScoreTarget] = useState(35);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [wordHidden, setWordHidden] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showGuesserMenu, setShowGuesserMenu] = useState(false);
  const [currentExplainer, setCurrentExplainer] = useState(0);
  const [penaltyEnabled, setPenaltyEnabled] = useState(true);
  const [lastWordNoTime, setLastWordNoTime] = useState(false);
  const [lastWordUsed, setLastWordUsed] = useState(false);



 const words = {
    easy: easyWords,
    medium: mediumWords,
    hard: hardWords,
  };

  const playSound = (type: 'start' | 'tick' | 'end' | 'correct' | 'skip' = 'end') => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'start') {
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } else if (type === 'tick') {
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
      } else if (type === 'correct') {
        // Приємний звук успіху (дві ноти вгору)
        oscillator.frequency.value = 523; // C5
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);

        // Друга нота
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 659; // E5
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.start(audioContext.currentTime + 0.1);
        osc2.stop(audioContext.currentTime + 0.3);
      } else if (type === 'skip') {
        // Звук пропуску (коротка нота вниз)
        oscillator.frequency.value = 300;
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else {
        oscillator.frequency.value = 400;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    }
  };


  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          playSound('end');
          if (lastWordNoTime) {
            setLastWordUsed(false);
          }
          return 0;
        }
        // Звук тиканя на останніх 3 секундах
        if (prev <= 5) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, lastWordNoTime, soundEnabled]);

  const initializeTeamGame = () => {
    const newTeams = Array(teamCount).fill(null).map((_, i) => ({
      id: i,
      name: teamNames[i] || `Команда ${i + 1}`,
      score: 0
    }));
    setTeams(newTeams);
    setCurrentTeam(0);
    setTimeLeft(timeLimit);
    setWordHidden(true);
    pickNewWord();
    setScreen('game');
  };

  const initializeSoloGame = () => {
    const newPlayers = Array(playerCount).fill(null).map((_, i) => ({
      id: i,
      name: playerNames[i] || `Гравець ${i + 1}`,
      score: 0
    }));
    setPlayers(newPlayers);
    setCurrentPlayer(0);
    setCurrentExplainer(0);
    setTimeLeft(timeLimit);
    setWordHidden(true);
    pickNewWord();
    setScreen('game');
  };

  const pickNewWord = () => {
    const wordList = words[difficulty];
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(word);
  };

  const handleGuessCorrect = (playerId: number | null = null) => {
    playSound('correct');
    if (lastWordNoTime && timeLeft === 0) {
      setLastWordUsed(true);
    }

    if (gameMode === 'teams') {
      const newTeams = [...teams];
      newTeams[currentTeam].score += 1;
      setTeams(newTeams);

      if (newTeams[currentTeam].score >= scoreTarget) {
        setScreen('gameOver');
        return;
      }
    } else {
      if (playerId !== null) {
        const newPlayers = [...players];
        const index = newPlayers.findIndex(p => p.id === playerId);
        if (index !== -1) {
          newPlayers[index].score += 1;
          setPlayers(newPlayers);

          if (newPlayers[index].score >= scoreTarget) {
            setScreen('gameOver');
            return;
          }
        }
      }
    }

    pickNewWord();
    setShowGuesserMenu(false);
  };

  const handleSkipWord = () => {
    playSound('skip');
    if (lastWordNoTime && timeLeft === 0) {
      setLastWordUsed(true);
    }

    if (penaltyEnabled) {
      if (gameMode === 'teams') {
        const newTeams = [...teams];
        newTeams[currentTeam].score -= 1;
        setTeams(newTeams);
      } else {
        const newPlayers = [...players];
        newPlayers[currentExplainer].score -= 1;
        setPlayers(newPlayers);
      }
    }
    pickNewWord();
    setShowGuesserMenu(false);
  };

  const handleNextTeam = () => {
    setCurrentTeam((prev) => (prev + 1) % teamCount);
    setTimeLeft(timeLimit);
    setIsRunning(false);
    setWordHidden(true);
    setLastWordUsed(false);
    pickNewWord();
  };

  const handleNextPlayer = () => {
    setCurrentExplainer((prev) => (prev + 1) % playerCount);
    setTimeLeft(timeLimit);
    setIsRunning(false);
    setWordHidden(true);
    setLastWordUsed(false);
    pickNewWord();
  };

  const startNewRound = () => {
    setTimeLeft(timeLimit);
    setIsRunning(true);
    setWordHidden(false);
    playSound('start')
  };

  const handleExitGame = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setScreen('welcome');
    setGameMode(null);
    setCurrentTeam(0);
    setCurrentPlayer(0);
    setCurrentExplainer(0);
    setTeams([]);
    setPlayers([]);
    setTeamCount(2);
    setPlayerCount(2);
    setTeamNames(['Команда 1', 'Команда 2']);
    setPlayerNames(['Гравець 1', 'Гравець 2']);
    setDifficulty('medium');
    setTimeLimit(120);
    setScoreTarget(35);
    setPenaltyEnabled(true);
    setLastWordNoTime(false);
    setLastWordUsed(false);
    setTimeLeft(timeLimit);
    setIsRunning(false);
    setShowExitConfirm(false);
    setShowGuesserMenu(false);
  };

  // Екран 1: Ласкаво просимо
  if (screen === 'welcome') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-md w-full">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-green-600 mb-2 flex justify-center items-center">
                <img
                    src="/cute.png"
                    alt="крокодил"
                    className="w-8 h-8 sm:w-12 sm:h-12 mr-2"
                />
                Крокодил
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Захопливо, весело та цікаво!</p>
            </div>


            {showRules ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-gray-800">Правила гри:</h3>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                      <li><strong>Мета:</strong> Один гравець показує слово жестами, а всі інші вгадують слово.</li>
                      <li><strong>Правила:</strong> Не можна говорити, писати або показувати букви.</li>
                      <li><strong>Таймер:</strong> На кожне слово виділено обмежений час.</li>
                      <li><strong>Перемога:</strong> Перша команда, що досягне більше білв, перемагає.</li>
                      <li><strong>Складність:</strong> Вибирайте рівень: легкий, середній або важкий.</li>
                    </ul>
                  </div>
                  <button
                      onClick={() => setShowRules(false)}
                      className="w-full bg-gray-500 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-600 transition"
                  >
                    ← Назад
                  </button>
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                  <button
                      onClick={() => setScreen('gameMode')}
                      className="w-full bg-green-500 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                  >
                    <Play size={18} className="sm:w-5 sm:h-5"/> Нова гра
                  </button>
                  <button
                      onClick={() => setShowRules(true)}
                      className="w-full bg-blue-500 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-600 transition"
                  >
                    📖 Переглянути правила
                  </button>
                  <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="w-full bg-gray-500 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2"
                  >
                    {soundEnabled ? <Volume2 size={18} className="sm:w-5 sm:h-5"/> : <VolumeX size={18} className="sm:w-5 sm:h-5"/>}
                    {soundEnabled ? 'Звук: Увімкнений' : 'Звук: Вимкнений'}
                  </button>
                </div>
            )}
          </div>
        </div>
    );
  }
// Екран 2: Вибір режиму гри - ЗМІНЕНО
  if (screen === 'gameMode') {
    return (
        <div
            className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold text-center text-green-600 mb-8">Виберіть режим</h2>

            <div className="space-y-4">
              <button
                  onClick={() => {
                    setGameMode('teams');
                    setScreen('setupTeams');
                  }}
                  className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold hover:bg-blue-600 transition text-lg"
              >
                👥 Командна гра
              </button>
              <button
                  onClick={() => {
                    setGameMode('solo');
                    setScreen('setupPlayers');
                  }}
                  className="w-full bg-purple-500 text-white py-4 rounded-lg font-semibold hover:bg-purple-600 transition text-lg"
              >
                🎯 Режим гравців
              </button>
            </div>

            <button
                onClick={() => setScreen('welcome')}
                className="w-full mt-6 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              ← Назад
            </button>
          </div>
        </div>
    );
  }
  //


// НОВИЙ ЕКРАН 3a: Налаштування команд (тільки кількість та назви)
  if (screen === 'setupTeams') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-center text-green-600 mb-6">
              👥 Налаштування команд
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Кількість команд
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 7, 8].map(num => (
                      <button
                          key={num}
                          onClick={() => {
                            setTeamCount(num);
                            setTeamNames(Array(num).fill(null).map((_, i) => `Команда ${i + 1}`));
                          }}
                          className={`flex-1 py-2 rounded-lg font-semibold transition ${
                              teamCount === num
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                      >
                        {num}
                      </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Назви команд
                </label>
                <div className="space-y-2">
                  {Array(teamCount).fill(null).map((_, i) => (
                      <input
                          key={i}
                          type="text"
                          value={teamNames[i] || ''}
                          onChange={(e) => {
                            const newNames = [...teamNames];
                            newNames[i] = e.target.value;
                            setTeamNames(newNames);
                          }}
                          placeholder={`Назва команди ${i + 1}`}
                          className="w-full px-3 py-2 border-2 border-gray-300 text-black rounded-lg focus:border-green-500 outline-none"
                      />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                  onClick={() => setScreen('gameMode')}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                ← Назад
              </button>
              <button
                  onClick={() => setScreen('settingsTeams')}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition"
              >
                Далі →
              </button>
            </div>
          </div>
        </div>
    );
  }

// НОВИЙ ЕКРАН 3b: Налаштування гравців (тільки кількість та імена)
  if (screen === 'setupPlayers') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-center text-purple-600 mb-6">
              🎯 Налаштування гравців
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Кількість гравців
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                      <button
                          key={num}
                          onClick={() => {
                            setPlayerCount(num);
                            setPlayerNames(Array(num).fill(null).map((_, i) => `Гравець ${i + 1}`));
                          }}
                          className={`flex-1 min-w-[60px] py-2 rounded-lg font-semibold transition ${
                              playerCount === num
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-200 text-black hover:bg-gray-300'
                          }`}
                      >
                        {num}
                      </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Імена гравців
                </label>
                <div className="space-y-2">
                  {Array(playerCount).fill(null).map((_, i) => (
                      <input
                          key={i}
                          type="text"
                          value={playerNames[i] || ''}
                          onChange={(e) => {
                            const newNames = [...playerNames];
                            newNames[i] = e.target.value;
                            setPlayerNames(newNames);
                          }}
                          placeholder={`Ім'я гравця ${i + 1}`}
                          className="text-black w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
                      />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                  onClick={() => setScreen('gameMode')}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                ← Назад
              </button>
              <button
                  onClick={() => setScreen('settingsSolo')}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition"
              >
                Далі →
              </button>
            </div>
          </div>
        </div>
    );
  }

// Екран 4a: Інші налаштування для команд (ЗМІНЕНО назву з settingsTeams)
  if (screen === 'settingsTeams') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-center text-green-600 mb-6">
              <Settings className="inline mr-2" size={28}/>
              Налаштування гри
            </h2>
            <div className="space-y-6">

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Таймер: {timeLimit} сек
                </label>
                <input
                    type="range"
                    min="30"
                    max="360"
                    step="10"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full text-black"
                />
                <div className="flex gap-2 text-xs text-gray-600 mt-2">
                  <span>30с</span>
                  <span className="flex-1 text-center">{timeLimit}с</span>
                  <span>360с</span>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Цільовий бал: {scoreTarget}
                </label>
                <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={scoreTarget}
                    onChange={(e) => setScoreTarget(Number(e.target.value))}
                    className="w-full"
                />
                <div className="flex gap-2 text-xs text-gray-600 mt-2">
                  <span>10</span>
                  <span className="flex-1 text-center">{scoreTarget}</span>
                  <span>100</span>
                </div>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Рівень складності
                </label>
                <div className="space-y-2">
                  {(['easy', 'medium', 'hard'] as const).map(level => (
                      <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`w-full py-2 rounded-lg font-semibold transition ${
                              difficulty === level
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                      >
                        {level === 'easy' && '⭐ Легкий'}
                        {level === 'medium' && '⭐⭐ Середній'}
                        {level === 'hard' && '⭐⭐⭐ Важкий'}
                      </button>
                  ))}
                </div>
              </div>

            </div>
            <div className="my-[10px]">
              <label className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                <input
                    type="checkbox"
                    checked={penaltyEnabled}
                    onChange={(e) => setPenaltyEnabled(e.target.checked)}
                    className="w-5 h-5"
                />
                Штраф за пропуск слова
              </label>
            </div>

            <div>
              <label className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                <input
                    type="checkbox"
                    checked={lastWordNoTime}
                    onChange={(e) => setLastWordNoTime(e.target.checked)}
                    className="w-5 h-5"
                />
                Останнє слово без часу
              </label>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                  onClick={() => setScreen('setupTeams')}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                ← Назад
              </button>
              <button
                  onClick={initializeTeamGame}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <Play size={18}/> Грати
              </button>
            </div>
          </div>
        </div>
    );
  }

// Екран 4b: Інші налаштування для гравців (ЗМІНЕНО назву з settingsSolo)
  if (screen === 'settingsSolo') {
    return (
        <div
            className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-center text-purple-600 mb-6">
              <Settings className="inline mr-2" size={28}/>
              Налаштування гри
            </h2>

            <div className="space-y-6">

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Таймер: {timeLimit} сек
                </label>
                <input
                    type="range"
                    min="30"
                    max="360"
                    step="10"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full"
                />
                <div className="flex gap-2 text-xs text-gray-600 mt-2">
                  <span>30с</span>
                  <span className="flex-1 text-center">{timeLimit}с</span>
                  <span>360с</span>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Цільовий бал: {scoreTarget}
                </label>
                <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={scoreTarget}
                    onChange={(e) => setScoreTarget(Number(e.target.value))}
                    className="w-full"
                />
                <div className="flex gap-2 text-xs text-gray-600 mt-2">
                  <span>10</span>
                  <span className="flex-1 text-center">{scoreTarget}</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Рівень складності
                </label>
                <div className="space-y-2">
                  {(['easy', 'medium', 'hard'] as const).map(level => (
                      <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`w-full py-2 rounded-lg font-semibold transition ${
                              difficulty === level
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                      >
                        {level === 'easy' && '⭐ Легкий'}
                        {level === 'medium' && '⭐⭐ Середній'}
                        {level === 'hard' && '⭐⭐⭐ Важкий'}
                      </button>
                  ))}
                </div>
              </div>


              <div className="my-[5px]">
                <label className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                  <input
                      type="checkbox"
                      checked={penaltyEnabled}
                      onChange={(e) => setPenaltyEnabled(e.target.checked)}
                      className="w-5 h-5"
                  />
                  Штраф за пропуск слова
                </label>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                <input
                    type="checkbox"
                    checked={lastWordNoTime}
                    onChange={(e) => setLastWordNoTime(e.target.checked)}
                    className="w-5 h-5"
                />
                Останнє слово без часу
              </label>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                  onClick={() => setScreen('setupPlayers')}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                ← Назад
              </button>
              <button
                  onClick={initializeSoloGame}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
              >
                <Play size={18}/> Грати
              </button>
            </div>
          </div>
        </div>
    );
  }

  // Екран 5Штраф : Гра
  if (screen === 'game') {
    return (
        <div
            className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center p-3 sm:p-4 relative">

          {showGuesserMenu && gameMode === 'solo' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-purple-600 mb-4">Хто вгадав?</h3>

                  <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                    {players
                        .filter((_, index) => index !== currentExplainer)
                        .map((player) => (
                            <button
                                key={player.id}
                                onClick={() => handleGuessCorrect(player.id)}
                                className="w-full bg-purple-500 text-white py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-purple-600 transition"
                            >
                              {player.name} ({player.score})
                            </button>
                        ))}
                  </div>
                  <button
                      onClick={() => setShowGuesserMenu(false)}
                      className="w-full mt-3 sm:mt-4 bg-gray-500 text-white py-2 sm:py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-600 transition"
                  >
                    ← Скасувати
                  </button>
                </div>
              </div>
          )}

          {showExitConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-red-600 mb-4 sm:mb-6">Ви впевнені?</h3>
                  <p className="text-sm sm:text-base text-center text-gray-700 mb-4 sm:mb-6">Поточна гра буде втрачена</p>
                  <div className="flex gap-3">
                    <button
                        onClick={() => setShowExitConfirm(false)}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-600 transition"
                    >
                      ← Назад
                    </button>
                    <button
                        onClick={confirmExit}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-600 transition"
                    >
                      Вийти
                    </button>
                  </div>
                </div>
              </div>
          )}

          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4 sm:mb-8">
              <h1 className="text-xl sm:text-3xl font-bold text-green-600">
                {gameMode === 'teams' ? teams[currentTeam]?.name : 'Режим гравців'}
              </h1>
              <button
                  onClick={handleExitGame}
                  className="bg-red-500 text-white p-1.5 sm:p-2 rounded-lg hover:bg-red-600 transition"
                  title="Вийти в меню"
              >
                <X size={20} className="sm:w-6 sm:h-6"/>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
              {gameMode === 'teams' ? (
                  teams.map((team, idx) => (
                      <div
                          key={team.id}
                          className={`p-2 sm:p-4 rounded-lg text-center ${
                              idx === currentTeam
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-800'
                          }`}
                      >
                        <div className="text-sm sm:text-base font-semibold">{team.name}</div>
                        <div className="text-2xl sm:text-3xl font-bold">{team.score}</div>
                      </div>
                  ))
              ) : (
                  <>
                    {players.slice(0, 2).map((player) => (
                        <div
                            key={player.id}
                            className="p-2 sm:p-4 rounded-lg text-center bg-purple-100"
                        >
                          <div className="text-sm sm:text-base font-semibold text-gray-800">{player.name}</div>
                          <div className="text-2xl sm:text-3xl font-bold text-purple-600">{player.score}</div>
                        </div>
                    ))}
                    {players.slice(2, 4).map((player) => (
                        <div
                            key={player.id}
                            className="p-2 sm:p-4 rounded-lg text-center bg-purple-100"
                        >
                          <div className="text-sm sm:text-base font-semibold text-gray-800">{player.name}</div>
                          <div className="text-2xl sm:text-3xl font-bold text-purple-600">{player.score}</div>
                        </div>
                    ))}
                  </>
              )}
            </div>

            {gameMode === 'solo' && players.length > 4 && (
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-8">
                  {players.slice(4).map((player) => (
                      <div
                          key={player.id}
                          className="p-2 sm:p-4 rounded-lg text-center bg-purple-100"
                      >
                        <div className="text-sm sm:text-base font-semibold text-gray-800">{player.name}</div>
                        <div className="text-2xl sm:text-3xl font-bold text-purple-600">{player.score}</div>
                      </div>
                  ))}
                </div>
            )}

            <div className={`text-center mb-4 sm:mb-8 p-4 sm:p-8 rounded-lg ${
                timeLeft <= 10 ? 'bg-red-100' : 'bg-blue-100'
            }`}>

              {gameMode === 'solo' && (
                  <p className="text-center text-sm sm:text-base text-gray-600 mb-3 sm:mb-6">
                    Показує: <span className="font-bold text-purple-600">{players[currentExplainer]?.name}</span>
                  </p>
              )}
              <div className="text-sm sm:text-base text-gray-700 font-semibold">Час для вгадування:</div>
              <div className="text-4xl sm:text-6xl font-bold text-blue-600 mb-2 sm:mb-4">
                {timeLeft}
              </div>

            </div>

            <div
                onClick={() => setWordHidden(!wordHidden)}
                className="bg-yellow-50 p-4 sm:p-8 rounded-lg mb-4 sm:mb-6 text-center border-2 sm:border-4 border-yellow-300 cursor-pointer hover:bg-yellow-100 transition"
            >
              {wordHidden ? (
                  <div className="text-3xl sm:text-5xl font-bold text-gray-400 mb-2 sm:mb-4"></div>
              ) : (
                  <div className="text-3xl sm:text-5xl font-bold text-green-600">{currentWord}</div>
              )}

              <div className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 mx-auto">
                {wordHidden ? <Eye size={18} className="sm:w-6 sm:h-6"/> : <EyeOff size={18} className="sm:w-6 sm:h-6"/>}
                {wordHidden ? 'Показати слово' : 'Сховати слово'}
              </div>
            </div>


            <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
              <button
                  onClick={startNewRound}
                  disabled={isRunning || timeLeft === 0}
                  className={`flex-1 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                      isRunning || timeLeft === 0
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
              >
                {isRunning ? 'Гра йде...' : 'Почати раунд'}
              </button>
              {gameMode === 'teams' && (
                  <>
                    <button
                        onClick={() => handleGuessCorrect()}
                        disabled={!isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)}
                        className={`flex-1 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                            !isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                      Правильно
                    </button>
                    <button
                        onClick={handleSkipWord}
                        disabled={!isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)}
                        className={`flex-1 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                            !isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                    >
                      Пропустити {penaltyEnabled && '(-1)'}
                    </button>
                  </>
              )}
              {gameMode === 'solo' && (
                  <>
                    <button
                        onClick={() => setShowGuesserMenu(true)}
                        disabled={!isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)}
                        className={`flex-1 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                            !isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                      Вгадав
                    </button>
                    <button
                        onClick={handleSkipWord}
                        disabled={!isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)}
                        className={`flex-1 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                            !isRunning && !(lastWordNoTime && timeLeft === 0 && !lastWordUsed)
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                    >
                      Пропустити
                    </button>
                  </>
              )}
            </div>

            {gameMode === 'teams' && timeLeft === 0 && !isRunning && (
                <button
                    onClick={handleNextTeam}
                    disabled={lastWordNoTime && !lastWordUsed}
                    className={`w-full py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                        lastWordNoTime && !lastWordUsed
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                >
                  → Наступна команда
                </button>
            )}

            {gameMode === 'solo' && timeLeft === 0 && !isRunning && (
                <button
                    onClick={handleNextPlayer}
                    disabled={lastWordNoTime && !lastWordUsed}
                    className={`w-full py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition ${
                        lastWordNoTime && !lastWordUsed
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                >
                  → Наступний гравець
                </button>
            )}
          </div>
        </div>
    );
  }

  // Екран 5: Кінець гри
  if (screen === 'gameOver') {
    const winner = gameMode === 'teams'
        ? teams.reduce((prev, current) => current.score > prev.score ? current : prev)
        : players.reduce((prev, current) => current.score > prev.score ? current : prev);

    const allScores = gameMode === 'teams' ? teams : players;

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-6">🎉 Перемога!</h1>

            <div className="bg-yellow-100 p-6 rounded-lg mb-6">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {winner.name}
              </div>
              <div className="text-5xl font-bold text-green-600 mb-2">
                {winner.score}
              </div>
              <div className="text-gray-700">очків зібрано</div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 max-h-48 overflow-y-auto">
              <h3 className="font-semibold text-gray-800 mb-3">
                {gameMode === 'teams' ? 'Результати команд:' : 'Результати гравців:'}
              </h3>
              {allScores
                  .sort((a, b) => b.score - a.score)
                  .map((item, idx) => (
                      <div key={item.id} className="flex justify-between mb-2 text-gray-700">
                        <span>{idx + 1}. {item.name}</span>
                        <span className="font-semibold">{item.score}</span>
                      </div>
                  ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                  onClick={() => {
                    setTeamCount(2);
                    setPlayerCount(2);
                    setTeamNames(['Команда 1', 'Команда 2']);
                    setPlayerNames(['Гравець 1', 'Гравець 2']);
                    setDifficulty('medium');
                    setTimeLimit(120);
                    setScoreTarget(35);
                    setPenaltyEnabled(true);
                    setScreen('welcome');
                  }}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                ← На головне меню
              </button>

            </div>
          </div>
        </div>
    );
  }
};

export default CrocodileGame;