'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Users, Trophy, Play, RotateCcw, Settings, BookOpen, ChevronRight, Home, Pause, PlayCircle, Edit2, Check, Eye, EyeOff } from 'lucide-react';

// Типи
type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'team' | 'individual';
type GameState = 'setup' | 'names' | 'playing' | 'results';

interface Word {
  text: string;
  difficulty: Difficulty;
}

interface Player {
  id: number;
  name: string;
  score: number;
}

interface Team {
  id: number;
  name: string;
  score: number;
  streak: number;
}

// База слів
const WORDS: Record<Difficulty, string[]> = {
  easy: ['Кішка', 'Літак', 'Плавання', 'Дерево', 'Танець', 'Телефон', 'Біг', 'Сніг', "М'яч", 'Їжа'],
  medium: ['Спогад', 'Бібліотека', 'Фотографія', 'Презентація', 'Турбота', 'Екскаватор', 'Конфлікт', 'Ветеринар', 'Баланс', 'Парашут'],
  hard: ['Ностальгія', 'Компроміс', 'Інтуїція', 'Еволюція', 'Демократія', 'Прокрастинація', 'Байдужість', 'Метафора', 'Інфляція', 'Саботаж']
};

const POINTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3
};

const CrocodileGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [gameMode, setGameMode] = useState<GameMode>('team');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(['easy', 'medium', 'hard']);
  const [singleDifficulty, setSingleDifficulty] = useState<boolean>(false);
  const [roundsCount, setRoundsCount] = useState<number>(10);

  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: 'Команда 1', score: 0, streak: 0 },
    { id: 2, name: 'Команда 2', score: 0, streak: 0 }
  ]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);

  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [showWord, setShowWord] = useState<boolean>(false);
  const [isWordVisible, setIsWordVisible] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [startTime, setStartTime] = useState<number>(0);

  const [showRules, setShowRules] = useState<boolean>(false);

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, isPaused]);

  // Ініціалізація гравців
  useEffect(() => {
    if (gameMode === 'individual') {
      const newPlayers: Player[] = Array.from({ length: playerCount }, (_, i) => ({
        id: i + 1,
        name: `Гравець ${i + 1}`,
        score: 0
      }));
      setPlayers(newPlayers);
    }
  }, [gameMode, playerCount]);

  const getRandomWord = useCallback((): Word => {
    const difficulty = selectedDifficulties[Math.floor(Math.random() * selectedDifficulties.length)];
    const wordsArray = WORDS[difficulty];
    const word = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    return { text: word, difficulty };
  }, [selectedDifficulties]);

  const startGame = () => {
    setGameState('names');
    if (gameMode === 'individual') {
      const newPlayers = Array.from({ length: playerCount }, (_, i) => ({
        id: i + 1,
        name: `Гравець ${i + 1}`,
        score: 0
      }));
      setPlayers(newPlayers);
    }
  };

  const startGameFromNames = () => {
    setGameState('playing');
    setCurrentRound(1);
    if (gameMode === 'team') {
      setTeams(prev => prev.map(t => ({ ...t, score: 0, streak: 0 })));
    } else {
      setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    }
    setCurrentTeamIndex(0);
    setCurrentPlayerIndex(0);
  };

  const getNewWord = () => {
    const word = getRandomWord();
    setCurrentWord(word);
    setShowWord(true);
    setIsWordVisible(true);
    setTimeLeft(60);
    setStartTime(Date.now());
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const handleGuessed = () => {
    if (!currentWord) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const timeTaken = 60 - timeLeft;

    let points = POINTS[currentWord.difficulty];

    // Швидкісний бонус
    if (timeTaken <= 20) points += 2;
    else if (timeTaken <= 40) points += 1;

    if (gameMode === 'team') {
      const updatedTeams = [...teams];
      updatedTeams[currentTeamIndex].score += points;
      updatedTeams[currentTeamIndex].streak += 1;

      // Серійний бонус
      if (updatedTeams[currentTeamIndex].streak === 3) {
        updatedTeams[currentTeamIndex].score += 1;
      } else if (updatedTeams[currentTeamIndex].streak === 5) {
        updatedTeams[currentTeamIndex].score += 3;
        updatedTeams[currentTeamIndex].streak = 0;
      }

      setTeams(updatedTeams);
    } else {
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].score += points;
      setPlayers(updatedPlayers);
    }

    nextTurn();
  };

  const handleTimeUp = () => {
    if (gameMode === 'team') {
      const updatedTeams = [...teams];
      updatedTeams[currentTeamIndex].streak = 0;
      setTeams(updatedTeams);
    }

    setTimeout(() => {
      nextTurn();
    }, 2000);
  };

  const nextTurn = () => {
    setIsTimerRunning(false);
    setShowWord(false);
    setCurrentWord(null);
    setIsWordVisible(true);
    setTimeLeft(60);

    if (currentRound >= roundsCount) {
      setGameState('results');
      return;
    }

    if (gameMode === 'team') {
      setCurrentTeamIndex((currentTeamIndex + 1) % 2);
    } else {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }

    setCurrentRound(prev => prev + 1);
  };

  const resetGame = () => {
    setGameState('setup');
    setCurrentWord(null);
    setShowWord(false);
    setTimeLeft(60);
    setIsTimerRunning(false);
    setCurrentRound(1);
    setCurrentTeamIndex(0);
    setCurrentPlayerIndex(0);
    setIsPaused(false);
    setTeams([
      { id: 1, name: 'Команда 1', score: 0, streak: 0 },
      { id: 2, name: 'Команда 2', score: 0, streak: 0 }
    ]);
    setPlayers([]);
  };

  const toggleDifficulty = (diff: Difficulty) => {
    if (singleDifficulty) {
      // В режимі одної складності просто змінюємо вибір
      setSelectedDifficulties([diff]);
    } else {
      // В режимі кількох складностей
      if (selectedDifficulties.includes(diff)) {
        if (selectedDifficulties.length > 1) {
          setSelectedDifficulties(selectedDifficulties.filter(d => d !== diff));
        }
      } else {
        setSelectedDifficulties([...selectedDifficulties, diff]);
      }
    }
  };

  const toggleDifficultyMode = () => {
    if (!singleDifficulty) {
      // Переходимо в режим одної складності - залишаємо тільки першу вибрану
      setSelectedDifficulties([selectedDifficulties[0]]);
    }
    setSingleDifficulty(!singleDifficulty);
  };

  const updateTeamName = (teamId: number, newName: string) => {
    setTeams(teams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
    ));
  };

  const updatePlayerName = (playerId: number, newName: string) => {
    setPlayers(players.map(player =>
        player.id === playerId ? { ...player, name: newName } : player
    ));
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const toggleWordVisibility = () => {
    setIsWordVisible(!isWordVisible);
  };

  const goToMainMenu = () => {
    if (confirm('Ви впевнені? Прогрес гри буде втрачено.')) {
      resetGame();
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch(diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
    }
  };

  const getDifficultyLabel = (diff: Difficulty) => {
    switch(diff) {
      case 'easy': return 'Легко';
      case 'medium': return 'Середньо';
      case 'hard': return 'Важко';
    }
  };

  // Екран налаштувань
  if (gameState === 'setup') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 mt-8">
              <h1 className="text-6xl font-bold text-white mb-4">🐊 Крокодил</h1>
              <p className="text-xl text-white/90">Покажи слово жестами!</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">Режим гри</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                      onClick={() => setGameMode('team')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                          gameMode === 'team'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Команди</div>
                    <div className="text-sm text-gray-600">4-20 гравців</div>
                  </button>
                  <button
                      onClick={() => setGameMode('individual')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                          gameMode === 'individual'
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Trophy className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-semibold">Індивідуально</div>
                    <div className="text-sm text-gray-600">2-10 гравців</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Кількість гравців: {playerCount}
                </label>
                <input
                    type="range"
                    min={gameMode === 'team' ? 4 : 2}
                    max={gameMode === 'team' ? 20 : 10}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-lg font-semibold text-gray-800">Складність слів</label>
                  <button
                      onClick={toggleDifficultyMode}
                      className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    {singleDifficulty ? '🔒 Одна' : '🔓 Змішано'}
                  </button>
                </div>
                <div className="flex gap-3">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                      <button
                          key={diff}
                          onClick={() => toggleDifficulty(diff)}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                              selectedDifficulties.includes(diff)
                                  ? `${getDifficultyColor(diff)} text-white border-transparent`
                                  : singleDifficulty && selectedDifficulties.length > 0
                                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                      : 'border-gray-200 hover:border-gray-300'
                          }`}
                          disabled={singleDifficulty && !selectedDifficulties.includes(diff)}
                      >
                        {getDifficultyLabel(diff)}
                      </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {singleDifficulty ? 'Всі слова однієї складності' : 'Слова різної складності'}
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Кількість раундів: {roundsCount}
                </label>
                <input
                    type="range"
                    min={5}
                    max={20}
                    value={roundsCount}
                    onChange={(e) => setRoundsCount(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                  onClick={() => setShowRules(true)}
                  className="w-full p-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Правила гри
              </button>

              <button
                  onClick={startGame}
                  className="w-full p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
                Далі
              </button>
            </div>
          </div>

          {showRules && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRules(false)}>
                <div className="bg-white rounded-2xl p-8 max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h2 className="text-3xl font-bold mb-6 text-gray-800">📋 Правила гри</h2>

                  <div className="space-y-4 text-gray-700">
                    <div>
                      <h3 className="font-bold text-xl mb-2 text-red-600">❌ ЗАБОРОНЕНО:</h3>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Говорити будь-які слова</li>
                        <li>Писати в повітрі літери</li>
                        <li>Шепотіти або видавати звуки</li>
                        <li>Малювати</li>
                        <li>Вказувати на предмети з відповіддю</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-xl mb-2 text-green-600">✅ ДОЗВОЛЕНО:</h3>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Жести руками та пальцями</li>
                        <li>Рухи всім тілом</li>
                        <li>Міміка обличчя</li>
                        <li>Імітація дій</li>
                        <li>Вказувати на частини тіла</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-xl mb-2">⏱️ Час та очки:</h3>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>На кожне слово — 60 секунд</li>
                        <li>Легке слово: 1 очко</li>
                        <li>Середнє слово: 2 очки</li>
                        <li>Важке слово: 3 очки</li>
                        <li>Бонус за швидкість (0-20 сек): +2 очки</li>
                      </ul>
                    </div>
                  </div>

                  <button
                      onClick={() => setShowRules(false)}
                      className="mt-6 w-full p-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                  >
                    Зрозуміло!
                  </button>
                </div>
              </div>
          )}
        </div>
    );
  }

  // Екран введення імен
  if (gameState === 'names') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 mt-8">
              <h1 className="text-5xl font-bold text-white mb-4">✏️ Введіть імена</h1>
              <p className="text-xl text-white/90">
                {gameMode === 'team' ? 'Назвіть свої команди' : 'Як вас звати?'}
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
              {gameMode === 'team' ? (
                  <>
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        🔵 Перша команда
                      </label>
                      <input
                          type="text"
                          value={teams[0].name}
                          onChange={(e) => updateTeamName(1, e.target.value)}
                          className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
                          placeholder="Наприклад: Блискавки"
                          maxLength={20}
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        🔴 Друга команда
                      </label>
                      <input
                          type="text"
                          value={teams[1].name}
                          onChange={(e) => updateTeamName(2, e.target.value)}
                          className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
                          placeholder="Наприклад: Вогники"
                          maxLength={20}
                      />
                    </div>
                  </>
              ) : (
                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                    {players.map((player, idx) => (
                        <div key={player.id}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            👤 Гравець {idx + 1}
                          </label>
                          <input
                              type="text"
                              value={player.name}
                              onChange={(e) => updatePlayerName(player.id, e.target.value)}
                              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
                              placeholder={`Ім'я гравця ${idx + 1}`}
                              maxLength={15}
                          />
                        </div>
                    ))}
                  </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                    onClick={() => setGameState('setup')}
                    className="flex-1 p-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  Назад
                </button>
                <button
                    onClick={startGameFromNames}
                    className="flex-[2] p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Play className="w-6 h-6" />
                  Почати гру!
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  }

  // Ігровий екран
  if (gameState === 'playing') {
    const currentEntity = gameMode === 'team' ? teams[currentTeamIndex] : players[currentPlayerIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Хедер */}
            <div className="bg-white/95 rounded-2xl shadow-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                      onClick={goToMainMenu}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      title="Головне меню"
                  >
                    <Home className="w-6 h-6 text-gray-600" />
                  </button>
                  <div>
                    <div className="text-sm text-gray-600">Раунд {currentRound} з {roundsCount}</div>
                    <div className="text-xl font-bold text-gray-800">
                      {gameMode === 'team' ? currentEntity.name : `Показує: ${currentEntity.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTimerRunning && (
                      <button
                          onClick={togglePause}
                          className={`p-2 rounded-lg transition-all ${
                              isPaused ? 'bg-green-100 hover:bg-green-200' : 'bg-yellow-100 hover:bg-yellow-200'
                          }`}
                          title={isPaused ? 'Продовжити' : 'Пауза'}
                      >
                        {isPaused ? <PlayCircle className="w-6 h-6 text-green-600" /> : <Pause className="w-6 h-6 text-yellow-600" />}
                      </button>
                  )}
                  <button
                      onClick={goToMainMenu}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      title="Налаштування"
                  >
                    <Settings className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Таблиця очок */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {gameMode === 'team' ? (
                  teams.map((team, idx) => (
                      <div
                          key={team.id}
                          className={`bg-white rounded-2xl p-6 shadow-lg transition-all ${
                              idx === currentTeamIndex ? 'ring-4 ring-yellow-400' : ''
                          }`}
                      >
                        <div className="text-lg font-semibold text-gray-700">{team.name}</div>
                        <div className="text-4xl font-bold text-purple-600">{team.score}</div>
                        {team.streak > 0 && (
                            <div className="text-sm text-orange-600 font-semibold mt-1">
                              🔥 Серія: {team.streak}
                            </div>
                        )}
                      </div>
                  ))
              ) : (
                  players.slice(0, 2).map((player, idx) => (
                      <div
                          key={player.id}
                          className={`bg-white rounded-2xl p-6 shadow-lg transition-all ${
                              idx === currentPlayerIndex ? 'ring-4 ring-yellow-400' : ''
                          }`}
                      >
                        <div className="text-lg font-semibold text-gray-700">{player.name}</div>
                        <div className="text-4xl font-bold text-purple-600">{player.score}</div>
                      </div>
                  ))
              )}
            </div>

            {/* Основна ігрова зона */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              {/* Таймер */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Timer className="w-8 h-8 text-gray-600" />
                  <div className="text-6xl font-bold text-gray-800">{timeLeft}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                      className={`h-full transition-all duration-1000 ${
                          timeLeft > 40 ? 'bg-green-500' : timeLeft > 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(timeLeft / 60) * 100}%` }}
                  />
                </div>
              </div>

              {/* Слово */}
              {!currentWord ? (
                  <div className="text-center space-y-6">
                    <p className="text-xl text-gray-700">Показувач готовий?</p>
                    <button
                        onClick={getNewWord}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      Отримати слово
                    </button>
                  </div>
              ) : !isTimerRunning ? (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-6 relative">
                      <button
                          onClick={toggleWordVisibility}
                          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-all shadow-md"
                          title={isWordVisible ? 'Сховати слово' : 'Показати слово'}
                      >
                        {isWordVisible ? (
                            <EyeOff className="w-6 h-6 text-purple-600" />
                        ) : (
                            <Eye className="w-6 h-6 text-purple-600" />
                        )}
                      </button>

                      <div className="text-sm text-purple-600 font-semibold mb-2 uppercase">
                        {getDifficultyLabel(currentWord.difficulty)}
                      </div>

                      {isWordVisible ? (
                          <>
                            <div className="text-5xl font-bold text-purple-900 mb-4">
                              {currentWord.text}
                            </div>
                            <div className="text-gray-600">
                              Подумайте 5 секунд, як показати це слово
                            </div>
                          </>
                      ) : (
                          <>
                            <div className="text-5xl font-bold text-purple-300 mb-4 select-none">
                              ••••••
                            </div>
                            <div className="text-gray-600">
                              Слово приховано
                            </div>
                          </>
                      )}
                    </div>
                    <button
                        onClick={startTimer}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                    >
                      Почати показувати!
                    </button>
                  </div>
              ) : (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-12 relative">
                      <button
                          onClick={toggleWordVisibility}
                          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-all shadow-md"
                          title={isWordVisible ? 'Сховати слово' : 'Показати слово'}
                      >
                        {isWordVisible ? (
                            <EyeOff className="w-6 h-6 text-orange-600" />
                        ) : (
                            <Eye className="w-6 h-6 text-orange-600" />
                        )}
                      </button>

                      {isWordVisible ? (
                          <>
                            <div className="text-sm text-orange-600 font-semibold mb-2 uppercase">
                              {getDifficultyLabel(currentWord.difficulty)}
                            </div>
                            <div className="text-4xl font-bold text-gray-800 mb-4">
                              {currentWord.text}
                            </div>
                          </>
                      ) : (
                          <>
                            <div className="text-6xl mb-4">🎭</div>
                            <div className="text-2xl font-bold text-gray-800">
                              {isPaused ? 'Гра на паузі' : 'Показуємо слово...'}
                            </div>
                          </>
                      )}

                      {!isWordVisible && (
                          <div className="text-gray-600 mt-2">
                            {isPaused ? 'Натисніть кнопку паузи щоб продовжити' : 'Показувач бачить слово на своєму екрані'}
                          </div>
                      )}
                    </div>

                    {!isPaused && (
                        <div className="flex gap-4 justify-center">
                          <button
                              onClick={handleGuessed}
                              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                          >
                            ✓ Вгадали!
                          </button>
                        </div>
                    )}
                  </div>
              )}
            </div>

            {/* Показуємо всіх гравців в індивідуальному режимі */}
            {gameMode === 'individual' && players.length > 2 && (
                <div className="mt-6 bg-white/90 rounded-2xl p-4">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Всі гравці:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {players.map((player, idx) => (
                        <div
                            key={player.id}
                            className={`p-2 rounded-lg text-center ${
                                idx === currentPlayerIndex ? 'bg-purple-100 ring-2 ring-purple-400' : 'bg-gray-50'
                            }`}
                        >
                          <div className="text-xs font-semibold">{player.name}</div>
                          <div className="text-lg font-bold text-purple-600">{player.score}</div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>
        </div>
    );
  }

  // Екран результатів
  if (gameState === 'results') {
    const winner = gameMode === 'team'
        ? teams.reduce((prev, current) => (prev.score > current.score ? prev : current))
        : players.reduce((prev, current) => (prev.score > current.score ? prev : current));

    const sortedEntities = gameMode === 'team'
        ? [...teams].sort((a, b) => b.score - a.score)
        : [...players].sort((a, b) => b.score - a.score);

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">🏆</div>
              <h1 className="text-5xl font-bold text-white mb-2">Переможець!</h1>
              <div className="text-3xl font-bold text-white/90">
                {winner.name}
              </div>
              <div className="text-6xl font-bold text-white mt-4">
                {winner.score} очок
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Підсумкова таблиця</h2>
              <div className="space-y-3">
                {sortedEntities.map((entity, idx) => (
                    <div
                        key={entity.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                            idx === 0 ? 'bg-gradient-to-r from-yellow-100 to-orange-100' :
                                idx === 1 ? 'bg-gray-100' :
                                    'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-400">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                        </div>
                        <div className="text-xl font-semibold text-gray-800">{entity.name}</div>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">{entity.score}</div>
                    </div>
                ))}
              </div>
            </div>

            <button
                onClick={resetGame}
                className="w-full p-6 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              Грати знову
            </button>
          </div>
        </div>
    );
  }

  return null;
};

export default CrocodileGame;