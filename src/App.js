import React, { useState, useEffect, useRef } from 'react';

// --- Configuration ---
const GRID_SIZE = 15; // Grid will be GRID_SIZE x GRID_SIZE
const HAUSA_ALPHABET_CHARS = 'abcdefghijklmnopqrstuwyzɓɗƙ'; // Simplified, single-character Hausa alphabet for random fill

// Sample word lists for different languages.
// In a real application, these would be much larger and loaded from external JSON files or an API.
const WORD_LISTS = {
  'Hausa': [
    'abinchi', 'asibiti', 'kwakwa', 'gida', 'ɗaki', 'ƙafa',
    'ɓarawo', 'shago', 'tsalle', 'mutum', 'ingarma', 'kifi',
    'ruwa', 'rana', 'wuta', 'iska', 'ido', 'kunne',
    'baki', 'hannu', 'zaɓi', 'karfe', 'bura', 'ciki', 'daji',
    'fari', 'hoto', 'jira', 'kala', 'kusa', 'lemu', 'lura',
    'mota', 'nono', 'rafi', 'sabo', 'taro', 'uku', 'yara', 'zane'
  ],
  'English': [
    'apple', 'banana', 'orange', 'grape', 'kiwi', 'mango',
    'pear', 'plum', 'lemon', 'peach', 'berry', 'melon',
    'fruit', 'sweet', 'juice', 'seeds', 'tree', 'plant'
  ],
  'Yoruba': [
    'ilu', 'omo', 'owo', 'ile', 'esin', 'oja',
    'ogun', 'iya', 'baba', 'eja', 'oògùn', 'òkúta',
    'òfin', 'irin', 'orí', 'ẹranko', 'òjò', 'ìyàwó',
    'olùkọ́', 'ẹni', 'igi', 'ilé', 'ọkọ', 'ẹran'
  ],
  'Igbo': [
    'mmiri', 'aka', 'ụkwụ', 'isi', 'anya', 'ọnụ',
    'nwoke', 'nwanyị', 'ezi', 'ọdụ', 'mkpụrụ', 'osisi',
    'akwa', 'ego', 'ude', 'ụlọ', 'akwụkwọ', 'ụmụaka',
    'ala', 'azu', 'oke', 'ututu', 'eziokwu'
  ]
};


// Directions for placing words: (row_change, col_change)
const DIRECTIONS = [
  { name: "horizontal", dr: 0, dc: 1 },    // Right
  { name: "vertical", dr: 1, dc: 0 },      // Down
  { name: "diagonal_dr", dr: 1, dc: 1 },   // Down-Right
  { name: "diagonal_ul", dr: -1, dc: -1 }, // Up-Left (Backward diagonal)
  { name: "horizontal_rev", dr: 0, dc: -1 }, // Left (Backward horizontal)
  { name: "vertical_rev", dr: -1, dc: 0 },   // Up (Backward vertical)
  { name: "diagonal_dl", dr: 1, dc: -1 },  // Down-Left
  { name: "diagonal_ur", dr: -1, dc: 1 }   // Up-Right
];

// --- Helper Functions (Pure JavaScript/Utility Functions) ---

/**
 * Checks if a word can be placed at a given position and direction without conflicts.
 * @param {string} word - The word to place.
 * @param {number} row - Starting row.
 * @param {number} col - Starting column.
 * @param {number} dr - Row change per character.
 * @param {number} dc - Column change per character.
 * @param {Array<Array<string>>} currentGrid - The current state of the grid.
 * @returns {boolean} True if the word can be placed, false otherwise.
 */
const canPlaceWord = (word, row, col, dr, dc, currentGrid) => {
  const n = word.length;
  for (let i = 0; i < n; i++) {
    const r = row + i * dr;
    const c = col + i * dc;

    // Check bounds
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
      return false;
    }
    // Check for conflicts with existing letters (unless it's the same letter)
    if (currentGrid[r][c] !== ' ' && currentGrid[r][c] !== word[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Places a word onto the grid.
 * @param {string} word - The word to place.
 * @param {number} row - Starting row.
 * @param {number} col - Starting column.
 * @param {number} dr - Row change per character.
 * @param {number} dc - Column change per character.
 * @param {Array<Array<string>>} currentGrid - The grid to modify.
 * @returns {Array<Array<string>>} The updated grid.
 */
const placeWord = (word, row, col, dr, dc, currentGrid) => {
  const newGrid = currentGrid.map(arr => [...arr]); // Deep copy to avoid direct mutation
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    newGrid[r][c] = word[i];
  }
  return newGrid;
};

/**
 * Generates the word search puzzle grid.
 * @param {Array<string>} words - List of words to hide.
 * @returns {{grid: Array<Array<string>>, hiddenWords: Object}} Generated grid and hidden word locations.
 */
const generatePuzzle = (words) => {
  let grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(' '));
  const hiddenWordLocations = {}; // Stores word: array of {r, c} for each letter
  // Filter out words that are too long for the grid, then sort by length (longest first)
  const wordsToHide = [...words]
    .filter(word => word.length <= GRID_SIZE)
    .sort((a, b) => b.length - a.length);

  let placedCount = 0;
  wordsToHide.forEach(word => {
    let placed = false;
    let attempts = 0;
    const maxAttempts = GRID_SIZE * GRID_SIZE * DIRECTIONS.length * 2; // Prevent infinite loops

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const startRow = Math.floor(Math.random() * GRID_SIZE);
      const startCol = Math.floor(Math.random() * GRID_SIZE);
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

      if (canPlaceWord(word, startRow, startCol, direction.dr, direction.dc, grid)) {
        grid = placeWord(word, startRow, startCol, direction.dr, direction.dc, grid);
        placedCount++;
        // Store precise locations of each letter for validation
        hiddenWordLocations[word] = [];
        for (let i = 0; i < word.length; i++) {
          hiddenWordLocations[word].push({ r: startRow + i * direction.dr, c: startCol + i * direction.dc });
        }
        placed = true;
      }
    }
  });

  console.log(`Successfully placed ${placedCount} out of ${wordsToHide.length} words.`);

  // Fill remaining empty spaces with random Hausa alphabet letters
  // Note: For English, Yoruba, Igbo, this will use the Hausa alphabet if not modified
  // For a real app, define alphabet sets per language
  const currentAlphabet = HAUSA_ALPHABET_CHARS; // Use Hausa alphabet for now, or expand this logic

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === ' ') {
        grid[r][c] = currentAlphabet[Math.floor(Math.random() * currentAlphabet.length)];
      }
    }
  }

  return { grid, hiddenWords: hiddenWordLocations };
};

// --- React Component ---

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('Hausa');
  const [grid, setGrid] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [selectedCells, setSelectedCells] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hiddenWordLocations, setHiddenWordLocations] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [hintsAvailable, setHintsAvailable] = useState(3); // Number of hints
  const [flashingCells, setFlashingCells] = useState([]); // Cells to flash for hint
  const [showInstructions, setShowInstructions] = useState(false); // State for instructions modal

  const gameStateRef = useRef({
    grid: [],
    hiddenWordLocations: {},
    wordsToFind: [],
    foundWords: new Set()
  });

  useEffect(() => {
    // Update ref whenever state changes
    gameStateRef.current = { grid, hiddenWordLocations, wordsToFind, foundWords };
  }, [grid, hiddenWordLocations, wordsToFind, foundWords]);


  // --- Game Initialization / Language Change ---
  useEffect(() => {
    // Reset game state when language changes
    setFoundWords(new Set());
    setSelectedCells([]);
    setIsMouseDown(false);
    setHintsAvailable(3); // Reset hints for new game
    setFlashingCells([]); // Clear any flashing cells

    const wordsForSelectedLanguage = WORD_LISTS[selectedLanguage] || WORD_LISTS['Hausa']; // Fallback
    
    const { grid: newGrid, hiddenWords: newHiddenWordLocations } = generatePuzzle(wordsForSelectedLanguage);
    
    setGrid(newGrid);
    setWordsToFind(Object.keys(newHiddenWordLocations).sort());
    setHiddenWordLocations(newHiddenWordLocations);
    setCurrentMessage(`Find all the hidden ${selectedLanguage} words!`);
  }, [selectedLanguage]); // Regenerate puzzle when language changes

  // --- User Interaction Logic ---

  /**
   * Handles mouse down event on a cell, starting selection.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   */
  const handleMouseDown = (r, c) => {
    // Only allow selection if not flashing a hint
    if (flashingCells.length > 0) return; 
    setIsMouseDown(true);
    setSelectedCells([{ r, c }]);
  };

  /**
   * Handles mouse enter event on a cell while selection is active.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   */
  const handleMouseEnter = (r, c) => {
    if (!isMouseDown) return;

    // Add cell to selection if not already present
    const newCell = { r, c };
    const isCellAlreadySelected = selectedCells.some(
      cell => cell.r === newCell.r && cell.c === newCell.c
    );
    if (!isCellAlreadySelected) {
      setSelectedCells(prev => [...prev, newCell]);
    }
  };

  /**
   * Handles mouse up event, triggering word validation.
   */
  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (selectedCells.length > 1) { // A word must be at least 2 characters long to be considered
      validateSelection();
    }
    setSelectedCells([]); // Clear selection after validation
  };

  /**
   * Validates the currently selected cells against the hidden words.
   */
  const validateSelection = () => {
    const { grid, hiddenWordLocations, wordsToFind, foundWords } = gameStateRef.current;
    if (selectedCells.length === 0) return;

    // 1. Reconstruct the selected word
    let selectedWord = '';
    const sortedSelectedCells = [...selectedCells].sort((a, b) => {
      // Sort cells consistently to reconstruct the word
      if (a.r === b.r) return a.c - b.c; // Horizontal: sort by column
      if (a.c === b.c) return a.r - b.r; // Vertical: sort by row
      
      // Diagonal: sort by r, then by c
      // If it's a diagonal, it will either be r increasing with c increasing, or r increasing with c decreasing
      // or vice-versa. Sorting by r, then c usually works.
      return a.r - b.r;
    });

    // Check if the selection forms a straight line first
    const startCell = sortedSelectedCells[0];
    const endCell = sortedSelectedCells[sortedSelectedCells.length - 1];
    const len = sortedSelectedCells.length;

    let isStraight = false;
    if (len === 1) { // Single cell selection is not a word
        isStraight = false;
    } else {
        const dr = (endCell.r - startCell.r);
        const dc = (endCell.c - startCell.c);

        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
            // It's a candidate for a straight line (horizontal, vertical, or diagonal slope)
            isStraight = true;
            // Verify all intermediate cells are indeed part of this line and in order
            for (let i = 1; i < len; i++) {
                const expectedR = startCell.r + (dr / (len - 1)) * i;
                const expectedC = startCell.c + (dc / (len - 1)) * i;
                const currentCell = sortedSelectedCells[i];
                if (currentCell.r !== expectedR || currentCell.c !== expectedC) {
                    isStraight = false;
                    break;
                }
            }
        }
    }

    if (!isStraight) {
      setCurrentMessage("Selection must be in a straight line!");
      return;
    }

    // Reconstruct word based on grid letters using the determined order
    for (const cell of sortedSelectedCells) {
      selectedWord += grid[cell.r][cell.c];
    }
    selectedWord = selectedWord.toLowerCase(); // Compare in lowercase

    let foundMatch = false;

    for (const word of wordsToFind) {
      const hiddenLocs = hiddenWordLocations[word];
      if (!hiddenLocs) continue;

      let actualHiddenWord = '';
      for (const loc of hiddenLocs) {
        actualHiddenWord += grid[loc.r][loc.c];
      }
      actualHiddenWord = actualHiddenWord.toLowerCase();

      // Check if selected cells exactly match the hidden word's cells AND forms the word
      const selectedSet = new Set(sortedSelectedCells.map(c => `${c.r},${c.c}`));
      const hiddenSet = new Set(hiddenLocs.map(c => `${c.r},${c.c}`));

      const isExactMatch = selectedSet.size === hiddenSet.size && 
                           [...selectedSet].every(cellStr => hiddenSet.has(cellStr));

      if (isExactMatch && (selectedWord === actualHiddenWord || selectedWord === actualHiddenWord.split('').reverse().join('')) && !foundWords.has(word)) {
        setFoundWords(prev => new Set(prev).add(word));
        setCurrentMessage(`'${word.toUpperCase()}' found! Great job!`);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch && selectedCells.length > 1) {
      setCurrentMessage("Not a hidden word, or already found. Try again!");
    }
  };

  /**
   * Helper to determine if a cell is currently part of the active selection.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   * @returns {boolean} True if selected, false otherwise.
   */
  const isCellSelected = (r, c) => {
    return selectedCells.some(cell => cell.r === r && cell.c === c);
  };

  /**
   * Helper to determine if a cell is part of a word that has been found.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   * @returns {boolean} True if part of a found word, false otherwise.
   */
  const isCellFound = (r, c) => {
    for (const word of foundWords) {
      const locations = hiddenWordLocations[word];
      if (locations && locations.some(loc => loc.r === r && loc.c === c)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Helper to determine if a cell is currently flashing for a hint.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   * @returns {boolean} True if flashing, false otherwise.
   */
  const isCellFlashing = (r, c) => {
    return flashingCells.some(cell => cell.r === r && cell.c === c);
  };

  // Check for game completion
  useEffect(() => {
    if (wordsToFind.length > 0 && foundWords.size === wordsToFind.length) {
      setCurrentMessage("Congratulations! You found all the words!");
    }
  }, [foundWords, wordsToFind]);

  // --- Hint Logic ---
  const handleGetHint = () => {
    if (hintsAvailable <= 0) {
      setCurrentMessage("No hints left! Keep searching!");
      return;
    }

    const unfoundWords = wordsToFind.filter(word => !foundWords.has(word));
    if (unfoundWords.length === 0) {
      setCurrentMessage("All words already found! No need for hints!");
      return;
    }

    const wordToHint = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
    const locations = hiddenWordLocations[wordToHint];

    if (locations) {
      setFlashingCells(locations); // Start flashing
      setCurrentMessage(`Hint: The word '${wordToHint.toUpperCase()}' is flashing!`);

      // Stop flashing after a delay
      setTimeout(() => {
        setFlashingCells([]);
        setHintsAvailable(prev => prev - 1);
        // Reset message if it was only a hint message
        if (currentMessage.includes("Hint:")) {
             setCurrentMessage(`Find all the hidden ${selectedLanguage} words!`);
        }
      }, 2000); // Flash for 2 seconds
    } else {
      setCurrentMessage("Hmm, couldn't find a hint for some reason. Try again!");
    }
  };


  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white font-inter flex flex-col items-center justify-center p-4"
      onMouseLeave={() => isMouseDown && handleMouseUp()} // End selection if mouse leaves game area
    >
      {/* Ensure font-family: inter is set in src/index.css or via Tailwind config */}

      <h1 className="text-5xl font-bold mb-6 text-yellow-300 drop-shadow-lg text-center">
        {selectedLanguage} Word Search
      </h1>
      <p className="text-xl mb-6 text-gray-200 text-center px-4">{currentMessage}</p>

      {/* Language Selector */}
      <div className="mb-8 flex items-center space-x-4">
        <label htmlFor="language-select" className="text-lg font-semibold">Select Language:</label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="p-2 rounded-md bg-purple-700 border-2 border-yellow-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
        >
          {Object.keys(WORD_LISTS).map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {/* Instructions Button */}
        <button
          onClick={() => setShowInstructions(true)}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full shadow-md hover:bg-blue-400 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          How to Play
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-8 w-full max-w-6xl">
        {/* Word Search Grid */}
        <div
          className="flex-shrink-0 bg-purple-700 border-4 border-yellow-400 rounded-xl shadow-2xl overflow-hidden p-2 flex-grow-0"
          onMouseUp={handleMouseUp}
        >
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((char, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center
                    text-lg md:text-xl lg:text-2xl font-bold cursor-pointer select-none
                    border border-purple-600
                    ${isCellFound(rowIndex, colIndex) ? 'bg-green-500 text-white animate-pulse' : ''}
                    ${isCellSelected(rowIndex, colIndex) && !isCellFound(rowIndex, colIndex) && !isCellFlashing(rowIndex, colIndex) ? 'bg-blue-400 text-white' : ''}
                    ${isCellFlashing(rowIndex, colIndex) ? 'bg-yellow-300 text-purple-900 animate-pulse-hint' : ''}
                    ${!isCellSelected(rowIndex, colIndex) && !isCellFound(rowIndex, colIndex) && !isCellFlashing(rowIndex, colIndex) ? 'hover:bg-purple-500' : ''}
                    rounded-sm
                  `}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  // onMouseUp is handled at the parent div level for consistency
                >
                  {char.toUpperCase()}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Words to Find List */}
        <div className="flex-grow bg-purple-700 border-4 border-yellow-400 rounded-xl shadow-2xl p-6 lg:w-1/3">
          <h2 className="text-3xl font-semibold mb-4 text-yellow-300">Words to Find:</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-y-2 text-lg">
            {wordsToFind.map((word) => (
              <p
                key={word}
                className={`
                  ${foundWords.has(word) ? 'line-through text-gray-400' : 'text-white'}
                  transition-all duration-300 ease-in-out transform hover:scale-105
                `}
              >
                {word.toUpperCase()}
              </p>
            ))}
          </div>
          {/* Hint Button */}
          <button
            onClick={handleGetHint}
            disabled={hintsAvailable <= 0 || foundWords.size === wordsToFind.length}
            className="mt-6 px-6 py-3 bg-blue-500 text-white font-bold rounded-full shadow-lg hover:bg-blue-400 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            Get Hint ({hintsAvailable} left)
          </button>
        </div>
      </div>
      
      {/* Restart Button */}
      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 px-6 py-3 bg-yellow-500 text-purple-900 font-bold rounded-full shadow-lg hover:bg-yellow-400 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
      >
        Restart Game
      </button>

      {/* Copyright Notice */}
      <footer className="mt-8 text-center text-gray-400 text-sm">
        Copyright &copy; {new Date().getFullYear()} IconView Tech Ent. All rights reserved.
      </footer>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-purple-800 border-4 border-yellow-400 rounded-xl shadow-2xl p-8 max-w-lg w-full text-center relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-yellow-300 transition-colors"
            >
              &times;
            </button>
            <h2 className="text-4xl font-bold mb-6 text-yellow-300">How to Play</h2>
            <div className="text-left text-lg text-gray-200 space-y-4">
              <p>Welcome to the {selectedLanguage} Word Search game! Your goal is to find all the hidden words in the grid.</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>**Select Language:** Choose your preferred language from the dropdown.</li>
                <li>**Find Words:** Look for the words listed on the right side of the screen within the letter grid.</li>
                <li>**Highlight:** To select a word, click and hold your mouse on the first letter, then drag it in a straight line (horizontally, vertically, or diagonally) to the last letter of the word. Release the mouse button to confirm your selection.</li>
                <li>**Validation:** If your selection matches a hidden word, it will be marked as found, and the cells will turn green.</li>
                <li>**Hints:** If you get stuck, use the "Get Hint" button. It will temporarily flash an unfound word on the grid. You have a limited number of hints!</li>
                <li>**Completion:** The game is completed when all words in the list are found.</li>
              </ol>
              <p className="mt-4 text-center">Have fun and improve your vocabulary!</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for flashing hint (needs to be in index.css for actual build) */}
      <style>
        {`
          @keyframes pulse-hint {
            0% {
              background-color: #fde047; /* Tailwind yellow-300 */
              transform: scale(1);
            }
            50% {
              background-color: #fbbf24; /* Tailwind yellow-400 */
              transform: scale(1.05);
            }
            100% {
              background-color: #fde047;
              transform: scale(1);
            }
          }
          .animate-pulse-hint {
            animation: pulse-hint 1s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}