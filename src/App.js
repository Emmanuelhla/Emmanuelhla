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
    'baki', 'hannu', 'zaɓi', 'karfe', 'gora', 'ciki', 'daji',
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
// These cover all 8 standard straight directions in a square grid.
const DIRECTIONS = [
  { name: "horizontal_right", dr: 0, dc: 1 },    // Right
  { name: "vertical_down", dr: 1, dc: 0 },       // Down
  { name: "diagonal_down_right", dr: 1, dc: 1 }, // Down-Right
  { name: "diagonal_up_left", dr: -1, dc: -1 },  // Up-Left (Backward diagonal)
  { name: "horizontal_left", dr: 0, dc: -1 },    // Left (Backward horizontal)
  { name: "vertical_up", dr: -1, dc: 0 },        // Up (Backward vertical)
  { name: "diagonal_down_left", dr: 1, dc: -1 }, // Down-Left
  { name: "diagonal_up_right", dr: -1, dc: 1 }   // Up-Right
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
  const currentAlphabet = HAUSA_ALPHABET_CHARS; 

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
  // FIX: Constructor Set requires 'new'
  const [foundWords, setFoundWords] = useState(new Set()); 
  const [grid, setGrid] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false); // Used for both mouse and touch
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

  // Ref to the grid element to calculate cell positions for touch events
  const gridRef = useRef(null);

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

  // --- User Interaction Logic (Unified for Mouse & Touch) ---

  /**
   * Starts selection on a cell.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   */
  const startSelection = (r, c) => {
    if (flashingCells.length > 0) return; 
    setIsMouseDown(true);
    setSelectedCells([{ r, c }]);
  };

  /**
   * Adds a cell to the current selection.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   */
  const addCellToSelection = (r, c) => {
    if (!isMouseDown) return;

    const newCell = { r, c };
    const isCellAlreadySelected = selectedCells.some(
      cell => cell.r === newCell.r && cell.c === newCell.c
    );
    if (!isCellAlreadySelected) {
      setSelectedCells(prev => [...prev, newCell]);
    }
  };

  /**
   * Ends selection and triggers word validation.
   */
  const endSelection = () => {
    setIsMouseDown(false);
    if (selectedCells.length > 1) {
      validateSelection();
    }
    setSelectedCells([]);
  };

  // --- Mouse Handlers ---
  const handleMouseDown = (r, c) => startSelection(r, c);
  const handleMouseEnter = (r, c) => addCellToSelection(r, c);
  const handleMouseUp = () => endSelection();
  const handleMouseLeaveGrid = () => isMouseDown && endSelection(); // End selection if mouse leaves grid area

  // --- Touch Handlers ---
  const handleTouchStart = (e, r, c) => {
    e.preventDefault(); // Prevent default browser scrolling/zooming
    startSelection(r, c);
  };

  const handleTouchMove = (e) => {
    if (!isMouseDown) return;
    e.preventDefault(); // Prevent default browser scrolling while dragging

    const touch = e.touches[0];
    // Use the gridRef to calculate the position relative to the grid
    if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const cellSize = gridRect.width / GRID_SIZE; // Assuming square cells

        // Calculate row/col based on touch position relative to grid
        const col = Math.floor((touch.clientX - gridRect.left) / cellSize);
        const row = Math.floor((touch.clientY - gridRect.top) / cellSize);

        // Ensure calculated row/col are within grid bounds
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            const lastCell = selectedCells[selectedCells.length - 1];
            if (!lastCell || row !== lastCell.r || col !== lastCell.c) {
                addCellToSelection(row, col);
            }
        }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    endSelection();
  };

  /**
   * Validates the currently selected cells against the hidden words.
   */
  const validateSelection = () => {
    const { grid, hiddenWordLocations, wordsToFind, foundWords } = gameStateRef.current;
    if (selectedCells.length === 0) return;

    const startCell = selectedCells[0];
    const endCell = selectedCells[selectedCells.length - 1];
    const len = selectedCells.length;

    let pathCells = []; // This will hold the "ideal" straight path
    let selectedWord = '';

    // Determine the ideal path and reconstruct the word from it
    if (len === 1) { // A single cell cannot form a word
      setCurrentMessage("Please select at least two letters to form a word!");
      return;
    } else {
        const dr_total = endCell.r - startCell.r;
        const dc_total = endCell.c - startCell.c;

        let isStraight = false;

        // Horizontal, Vertical, or 45-degree Diagonal
        if (dr_total === 0 || dc_total === 0 || Math.abs(dr_total) === Math.abs(dc_total)) {
            // Calculate step size (e.g., 1 or -1)
            const stepR = dr_total === 0 ? 0 : dr_total / Math.abs(dr_total);
            const stepC = dc_total === 0 ? 0 : dc_total / Math.abs(dc_total);
            
            // Reconstruct the ideal straight path
            for (let i = 0; i < len; i++) {
                const r = startCell.r + i * stepR;
                const c = startCell.c + i * stepC;
                pathCells.push({ r, c });
            }
            isStraight = true;
        }

        if (!isStraight) {
            setCurrentMessage("Selection must be in a straight line (horizontal, vertical, or 45-degree diagonal)!");
            return;
        }

        // Now, verify that all cells in the actual `selectedCells` array are precisely on this `pathCells`
        const pathSet = new Set(pathCells.map(cell => `${cell.r},${cell.c}`));
        const actualSelectedSet = new Set(selectedCells.map(cell => `${cell.r},${cell.c}`));

        if (pathSet.size !== actualSelectedSet.size || ![...actualSelectedSet].every(cellStr => pathSet.has(cellStr))) {
            setCurrentMessage("Your selection strayed from a precise straight line. Try again!");
            return;
        }

        // If it's a valid straight line, reconstruct the word from pathCells (correct order)
        for (const cell of pathCells) {
            selectedWord += grid[cell.r][cell.c];
        }
        selectedWord = selectedWord.toLowerCase();
    }


    let foundMatch = false;

    // Check against hidden words
    for (const word of wordsToFind) {
      const hiddenLocs = hiddenWordLocations[word];
      if (!hiddenLocs) continue;

      let actualHiddenWord = '';
      // It's crucial that `actualHiddenWord` is reconstructed in a consistent order
      // to match how `selectedWord` is constructed (from start to end of drag).
      // The `hiddenLocs` already store the word's cells in placement order.
      for (const loc of hiddenLocs) {
        actualHiddenWord += grid[loc.r][loc.c];
      }
      actualHiddenWord = actualHiddenWord.toLowerCase();
      
      const hiddenSet = new Set(hiddenLocs.map(c => `${c.r},${c.c}`));
      const selectedSet = new Set(selectedCells.map(c => `${c.r},${c.c}`)); // Use original selected cells for this check

      const isExactMatchByCells = selectedSet.size === hiddenSet.size && 
                                  [...selectedSet].every(cellStr => hiddenSet.has(cellStr));

      // Check both forward and reverse of the selected word
      if (isExactMatchByCells && (selectedWord === actualHiddenWord || selectedWord === actualHiddenWord.split('').reverse().join('')) && !foundWords.has(word)) {
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

  // --- AdSense Ad Unit Rendering (Important: Placeholder IDs) ---
  useEffect(() => {
    // Check if AdSense script is loaded and if adsbygoogle array exists
    if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
      try {
        // Push the ad unit to load
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    } else {
      console.warn("AdSense script not yet loaded or window.adsbygoogle is not available.");
      // You might want to retry loading ads after a short delay
      // or ensure the main AdSense script in index.html is loaded first.
    }
  }, [selectedLanguage]); // Reload ad on language change (new game)

  return (
    <div
      // Set min-h-screen to ensure it takes full viewport height and prevent vertical scroll unless content truly overflows
      // Use overflow-hidden on the body (or a parent) if you want to aggressively prevent *all* scrolling.
      className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white font-inter flex flex-col items-center justify-center p-4 overflow-hidden"
      onMouseLeave={handleMouseLeaveGrid} // End selection if mouse leaves game area
      // Global touch end/cancel handlers to clear selection if touch goes off grid
      onTouchCancel={handleTouchEnd} 
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="text-5xl font-bold mb-6 text-yellow-300 drop-shadow-lg text-center">
        {selectedLanguage} Word Search
      </h1>
      <p className="text-xl mb-6 text-gray-200 text-center px-4">{currentMessage}</p>

      {/* Language Selector and How to Play Button */}
      <div className="mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
        <button
          onClick={() => setShowInstructions(true)}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-full shadow-md hover:bg-blue-400 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          How to Play
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-8 w-full max-w-6xl overflow-auto p-2"> {/* Added overflow-auto for content within this div */}
        {/* Word Search Grid */}
        <div
          ref={gridRef} // Assign ref to the grid container
          className="flex-shrink-0 bg-purple-700 border-4 border-yellow-400 rounded-xl shadow-2xl overflow-hidden p-2 flex-grow-0
                     mx-auto lg:mx-0 word-search-grid-container" /* Center grid on small screens, added touch-action class */
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove} /* Added touch move handler to grid container */
        >
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((char, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  data-row={rowIndex} /* Added for touch event lookup */
                  data-col={colIndex} /* Added for touch event lookup */
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
                  onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)} /* Added touch start */
                  // onTouchMove and onTouchEnd are handled by the parent grid container
                >
                  {char.toUpperCase()}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Words to Find List */}
        <div className="flex-grow bg-purple-700 border-4 border-yellow-400 rounded-xl shadow-2xl p-6 lg:w-1/3 w-full">
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
      
      {/* Google AdSense Display Ad Unit */}
      {/* IMPORTANT: Replace 'data-ad-slot="XXXXXXXXXX"' with your actual AdSense ad unit slot ID */}
      <div className="my-8 w-full max-w-lg bg-gray-800 p-4 rounded-lg shadow-md text-center">
        <p className="text-gray-300 mb-2 text-sm">Advertisement</p>
        <ins className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '300px' }} // Adjust size as needed
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Your publisher ID (from index.html)
            data-ad-slot="XXXXXXXXXX"></ins> {/* Your specific ad unit slot ID */}
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
                <li>**Highlight:** To select a word, click and hold your mouse (or tap and drag your finger) on the first letter, then drag it in a **straight line** (horizontally, vertically, or diagonally) to the last letter of the word. Release the mouse button or lift your finger to confirm your selection.</li>
                <li>**Validation:** If your selection matches a hidden word, it will be marked as found, and the cells will turn green.</li>
                <li>**Hints:** If you get stuck, use the "Get Hint" button. It will temporarily flash an unfound word on the grid. You have a limited number of hints!</li>
                <li>**Completion:** The game is completed when all words in the list are found.</li>
              </ol>
              <p className="mt-4 text-center">Have fun and improve your vocabulary!</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for flashing hint AND preventing touch scrolling (move to index.css for actual build) */}
      {/* Moved `touch-action: none` class to the grid div */}
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