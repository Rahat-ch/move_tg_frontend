import { useState } from 'react';
import './App.css';

function App() {
  // State variables to store game state
  const [board, setBoard] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0]); // 3x3 Tic Tac Toe board
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionLink, setTransactionLink] = useState('');
  const [gameMessage, setGameMessage] = useState(''); // New state for game messages

  // Function to fetch the initial game state
  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setTransactionLink('');
    setGameMessage(''); // Clear any existing messages
    try {
      const response = await fetch('https://move-tg.onrender.com/state');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Initial Game State:', data);

      // Update state variables with fetched data
      setBoard(data.board);
      setWins(data.wins);
      setLosses(data.losses);
    } catch (error) {
      console.error('Error fetching game state:', error);
      setError('Failed to fetch game state. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle cell click (for making a move)
  const handleCellClick = async (index) => {
    if (loading || board[index] !== 0) {
      // If loading is in progress or cell is already occupied, do nothing
      return;
    }

    // Create a copy of the board to modify
    const newBoard = [...board];
    newBoard[index] = 1; // '1' represents the player's move (e.g., 'X')

    // Check if the player wins
    if (checkWin(newBoard, 1)) {
      try {
        setLoading(true);
        setError(null);

        // Increment wins and reset board
        const updatedWins = wins + 1;
        const resetBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        // Make a POST request to update wins and reset board
        const response = await fetch('https://move-tg.onrender.com/state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: resetBoard,
            wins: updatedWins,
            losses: losses,
            inProgress: false, // Always set to false
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Player Won! Updated Game State:', data);

        // Update state variables
        setWins(updatedWins);
        setBoard(resetBoard);
        setTransactionLink(data.transactionLink);
        setGameMessage('🎉 You won! The board has been reset.');
      } catch (error) {
        console.error('Error updating game state:', error);
        setError('Failed to update game state. Please try again later.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Computer's turn: make a random move
    const computerMoveIndex = getRandomMove(newBoard);
    if (computerMoveIndex === null) {
      // No available moves (draw is ignored as per requirements)
      return;
    }

    newBoard[computerMoveIndex] = 2; // '2' represents the computer's move (e.g., 'O')

    // Check if the computer wins
    if (checkWin(newBoard, 2)) {
      try {
        setLoading(true);
        setError(null);

        // Increment losses and reset board
        const updatedLosses = losses + 1;
        const resetBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        // Make a POST request to update losses and reset board
        const response = await fetch('https://move-tg.onrender.com/state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: resetBoard,
            wins: wins,
            losses: updatedLosses,
            inProgress: false, // Always set to false
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Computer Won! Updated Game State:', data);

        // Update state variables
        setLosses(updatedLosses);
        setBoard(resetBoard);
        setTransactionLink(data.transactionLink);
        setGameMessage('😞 You lost! The board has been reset.');
      } catch (error) {
        console.error('Error updating game state:', error);
        setError('Failed to update game state. Please try again later.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // If no win/loss, update the board on the backend
    try {
      setLoading(true);
      setError(null);

      // Make a POST request to update the board
      const response = await fetch('https://move-tg.onrender.com/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: newBoard,
          wins: wins,
          losses: losses,
          inProgress: false, // Always set to false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Updated Game State:', data);

      // Update state variables
      setBoard(newBoard);
      setTransactionLink(data.transactionLink);
      setGameMessage(''); // Clear any existing messages
    } catch (error) {
      console.error('Error updating game state:', error);
      setError('Failed to update game state. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to check for a win
  const checkWin = (board, player) => {
    const winPatterns = [
      [0, 1, 2], // Top row
      [3, 4, 5], // Middle row
      [6, 7, 8], // Bottom row
      [0, 3, 6], // Left column
      [1, 4, 7], // Middle column
      [2, 5, 8], // Right column
      [0, 4, 8], // Diagonal from top-left
      [2, 4, 6], // Diagonal from top-right
    ];

    return winPatterns.some((pattern) =>
      pattern.every((index) => board[index] === player)
    );
  };

  // Function to get a random available move for the computer
  const getRandomMove = (board) => {
    const availableMoves = board
      .map((value, index) => (value === 0 ? index : null))
      .filter((val) => val !== null);

    if (availableMoves.length === 0) {
      return null; // No available moves
    }

    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  };

  // Function to reset the transaction link
  const handleResetLink = () => {
    setTransactionLink('');
  };

  // Function to render the Tic Tac Toe board
  const renderBoard = () => {
    return (
      <div className="board">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`cell ${cell !== 0 ? 'occupied' : ''}`}
            onClick={() => handleCellClick(index)}
          >
            {cell === 1 && 'X'}
            {cell === 2 && 'O'}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      <h1>Move Tic Tac Toe</h1>
      <div className="controls">
        <button onClick={handleStart} disabled={loading}>
          {loading ? 'Loading...' : 'Start'}
        </button>
        <button
          onClick={handleResetLink}
          disabled={loading || !transactionLink}
          className="clear-link-button"
        >
          Clear Transaction Link
        </button>
      </div>
      <p className="instructions">
        Click on the "Start" button to fetch the initial game state. Click on a cell to make a move.
      </p>

      {/* Display error messages */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Display game message (win/loss) */}
      {gameMessage && (
        <div className="game-message">
          <p>{gameMessage}</p>
        </div>
      )}

      {/* Display game state */}
      <div className="game-info">
        <p>
          <strong>Wins:</strong> {wins}
        </p>
        <p>
          <strong>Losses:</strong> {losses}
        </p>
      </div>

      {/* Render the game board */}
      {renderBoard()}

      {/* Display transaction link */}
      {transactionLink && (
        <div className="transaction-link">
          <p>
            Transaction Link:{' '}
            <a href={transactionLink} target="_blank" rel="noopener noreferrer">
              View Transaction
            </a>
          </p>
          <button onClick={handleResetLink} className="clear-link-button">
            Clear Link
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
