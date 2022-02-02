import Sudoku from "./Sudoku";

class SudokuSolver {
    input: Sudoku;
    board: number[][];

    constructor(input: Sudoku) {
        this.input = input;
        this.board = [];
    }

    reset = () => {
        this.board = [];
        for(let x = 0; x < 9; x++) {
            this.board.push([]);
            for(let y = 0; y < 9; y++) {
                this.board[x].push(this.input.getCell(x, y).current?.state.value || 0);
            }
        }
    }

    arrayShuffle = (array: number[]) => {
        let currentIndex = array.length, randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    rowSet = (y: number) => {
        let set = new Set();
        for(let x = 0; x < 9; x++) {
            set.add(this.board[x][y]);
        }
        return set;
    }

    colSet = (x: number) => {
        let set = new Set();
        for(let y = 0; y < 9; y++) {
            set.add(this.board[x][y]);
        }
        return set;
    }

    squareSet = (x: number, y: number) => {
        let set = new Set();
        let xStart = Math.floor(x / 3) * 3;
        let yStart = Math.floor(y / 3) * 3;
        for(let x = xStart; x < xStart + 3; x++) {
            for(let y = yStart; y < yStart + 3; y++) {
                set.add(this.board[x][y]);
            }
        }
        return set;
    }

    isAvailabe = (x: number, y: number, value: number) => {
        let row = this.rowSet(y);
        let col = this.colSet(x);
        let square = this.squareSet(x, y);
        return !row.has(value) && !col.has(value) && !square.has(value);
    }

    solve = (x?: number, y?: number): boolean => {
        x = x || 0;
        y = y || 0;

        if(x === 0 && y === 0) {
            this.reset();
        }

        if(x === 9) {
            x = 0;
            y++;
        }

        if(y === 9) {
            return true;
        }

        if(this.board[x][y] !== 0) {
            return this.solve(x + 1, y);
        }

        let stepBias = this.arrayShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for(let i = 1; i <= 9; i++) {
            let biasedValue = stepBias[i - 1];

            if(this.isAvailabe(x, y, biasedValue)) {
                this.board[x][y] = biasedValue;

                if(this.solve(x + 1, y)) {
                    return true;
                }

                this.board[x][y] = 0;
            }
        }

        return false;
    }

    boardToString = () => {
        let board = "";

        for(let x = 0; x < 9; x++) {
            for(let y = 0; y < 9; y++) {
                board += this.board[x][y];
            }
        }

        return board;
    }

    approximateNumberOfSolutions = () => {
        let solutions = new Set<string>()

        for(let i = 0; i < 15; i++) {
            this.solve()
            solutions.add(this.boardToString())
        }

        return solutions.size;
    }
}

export default SudokuSolver
