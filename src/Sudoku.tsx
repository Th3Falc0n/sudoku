import React, {RefObject} from "react";
import "./Sudoku.css"
import SudokuSolver from "./Solver";
import {json} from "stream/consumers";

type CellProps = {
    x: number;
    y: number;
    playingField: Sudoku;
}

enum ErrorType {
    INVALID_ROW,
    INVALID_COLUMN,
    INVALID_SQUARE
}

enum HoverType {
    NONE,
    HOVERED,
    HOVERED_NEIGHBOR
}

type CellState = {
    value: number;
    editable: boolean;
    proposed: Set<number>;
    errors: Set<ErrorType>;
    hoverState: HoverType;
}

class Cell extends React.Component<CellProps, CellState> {
    constructor(props: CellProps) {
        super(props);
        this.state = {
            value: 0,
            editable: true,
            proposed: new Set(),
            errors: new Set(),
            hoverState: HoverType.NONE
        }
        this.reset();
    }

    reset = async (hard?: boolean) => {
        if(hard) {
            return new Promise(resolve =>
                this.setState(state => ({
                    value: 0,
                    editable: true,
                    proposed: new Set(),
                    errors: new Set(),
                    hoverState: HoverType.NONE
                }), () => resolve(null))
            );
        }
        return new Promise(resolve =>
            this.setState(state => ({
                value: state.editable ? 0 : state.value,
                editable: state.editable,
                proposed: new Set(),
                errors: new Set(),
                hoverState: HoverType.NONE
            }), () => resolve(null))
        );
    }

    getColumnSet = (): Set<number> => {
        const columnSet = new Set<number>();
        for (let i = 0; i < 9; i++) {
            if(i === this.props.y) continue;
            columnSet.add(this.props.playingField.getCell(this.props.x, i).current?.state.value as number);
        }
        return columnSet;
    }

    getRowSet = (): Set<number> => {
        const rowSet = new Set<number>();
        for (let i = 0; i < 9; i++) {
            if(i === this.props.x) continue;
            rowSet.add(this.props.playingField.getCell(i, this.props.y).current?.state.value as number);
        }
        return rowSet;
    }

    getSquareSet = (): Set<number> => {
        const squareSet = new Set<number>();
        const x = Math.floor(this.props.x / 3) * 3;
        const y = Math.floor(this.props.y / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if(x + i === this.props.x && y + j === this.props.y) {
                    continue;
                }
                squareSet.add(this.props.playingField.getCell(x + i, y + j).current?.state.value as number);
            }
        }
        return squareSet;
    }

    cellUpdate = () => {
        const columnSet = this.getColumnSet();
        const rowSet = this.getRowSet();
        const squareSet = this.getSquareSet();

        const errors = new Set<ErrorType>();

        if(this.state.value !== 0) {
            if(columnSet.has(this.state.value)) {
                errors.add(ErrorType.INVALID_COLUMN);
            }
            if(rowSet.has(this.state.value)) {
                errors.add(ErrorType.INVALID_ROW);
            }
            if(squareSet.has(this.state.value)) {
                errors.add(ErrorType.INVALID_SQUARE);
            }
        }

        this.setState({errors});
    }

    setProposedToAllAvailable = () => {
        const columnSet = this.getColumnSet();
        const rowSet = this.getRowSet();
        const squareSet = this.getSquareSet();

        const proposed = new Set<number>();
        for(let i = 1; i <= 9; i++) {
            if(!columnSet.has(i) && !rowSet.has(i) && !squareSet.has(i)) {
                proposed.add(i);
            }
        }

        this.setState({proposed});
    }

    isAvailable = (n: number) => {
        const columnSet = this.getColumnSet();
        const rowSet = this.getRowSet();
        const squareSet = this.getSquareSet();

        return !columnSet.has(n) && !rowSet.has(n) && !squareSet.has(n);
    }

    setValue = async (n: number, disableEdit?: boolean) => new Promise (resolve => {
        this.setState({value: n, editable: !(disableEdit as boolean)}, () => resolve(null));
    })

    informUpdate = (event: string) => {
        switch (event) {
            case "mouseEnter":
                this.setState({
                    hoverState: HoverType.HOVERED_NEIGHBOR
                });
                break;
            case "mouseLeave":
                this.setState({
                    hoverState: HoverType.NONE
                });
                break;
            case "cellUpdate":
                this.cellUpdate();
                break;
        }
    }

    setProposal = () => {
        if(!this.state.editable) return;

        this.setState(
            state => {
                let picked = this.props.playingField.state.pickerSelected

                if(state.proposed.has(picked)) {
                    state.proposed.delete(picked);
                } else {
                    state.proposed.add(picked);
                }

                return { proposed: new Set<number>(state.proposed) };
            },
            () => {
                this.cellUpdate();
                this.updateNeighbors("cellUpdate")
            }
        );
    }

    setActive = (e: React.MouseEvent) => {
        e.preventDefault()
        if(!this.state.editable) return;

        this.setState(
            state => {
                if(state.value !== this.props.playingField.state.pickerSelected) {
                    return {
                        value: this.props.playingField.state.pickerSelected
                    }
                } else {
                    return {
                        value: 0
                    }
                }
            },
            () => {
                this.cellUpdate();
                this.updateNeighbors("cellUpdate")
            }
        )
    }

    mouseEnter = () => {
        this.updateNeighbors("mouseEnter")
        this.setState({
            hoverState: HoverType.HOVERED
        });
    }

    mouseLeave = () => {
        this.updateNeighbors("mouseLeave")
        this.setState({
            hoverState: HoverType.NONE
        });
    }

    updateNeighbors = (event: string) => {
        this.props.playingField.updateRow(this.props.x, this.props.y, event)
        this.props.playingField.updateColumn(this.props.x, this.props.y, event)
        this.props.playingField.updateSquare(this.props.x, this.props.y, event)
    }

    buildCSSClasses = () => {
        return [
            "cell",
            "col-" + this.props.x, "row-" + this.props.y,
            (this.state.errors.size > 0) ? "invalid" : "valid",
            this.state.hoverState === HoverType.HOVERED ? "hovered" : "",
            this.state.hoverState === HoverType.HOVERED_NEIGHBOR ? "hovered-neighbor" : ""
        ].join(" ")
    }

    renderWithNumber = () => {
        let hl = this.state.value === this.props.playingField.state.pickerSelected ? "highlight" : "";
        return <div className={"content active " + hl}>{this.state.value}</div>
    }

    renderProposals = () => {
        let elements = [];
        for(let a = 0; a < 3; a++) {
            let row = [];
            for(let b = 1; b < 4; b++) {
                let n = a * 3 + b;
                let hl = (this.props.playingField.state.pickerSelected === n) ? "highlight" : ""
                row.push(<div className={"fcell " + hl} key={n}>{this.state.proposed.has(n) ? n : ""}</div>);
            }

            elements.push(<div className="frow">{row}</div>);
        }

        return <div className="content">{elements}</div>;
    }

    render = () =>
        <div
            className={this.buildCSSClasses()}
            onClick={this.setProposal}
            onContextMenu={this.setActive}
            onDoubleClick={this.setActive}
            onMouseEnter={this.mouseEnter}
            onMouseLeave={this.mouseLeave}
        >
            {this.state.value !== 0 ? this.renderWithNumber() : this.renderProposals()}
        </div>
}

type SudokuProps = {
};

type SudokuState = {
    board: RefObject<Cell>[][];
    pickerSelected: number;
    solver: SudokuSolver;
};

class Sudoku extends React.Component<SudokuProps, SudokuState> {
    constructor(props: SudokuProps) {
        super(props);

        this.state = {
            board: [],
            pickerSelected: 1,
            solver: new SudokuSolver(this)
        };

        for(let i = 0; i < 9; i++) {
            let row: RefObject<Cell>[] = [];
            for(let j = 0; j < 9; j++) {
                row.push(React.createRef<Cell>());
            }
            this.state.board.push(row);
        }
    }

    componentDidMount() {
        document.onkeydown = (e) => {
            switch (e.key) {
                case "1":
                    this.setState(state => ({ pickerSelected: 1 }));
                    break;
                case "2":
                    this.setState(state => ({ pickerSelected: 2 }));
                    break;
                case "3":
                    this.setState(state => ({ pickerSelected: 3 }));
                    break;
                case "4":
                    this.setState(state => ({ pickerSelected: 4 }));
                    break;
                case "5":
                    this.setState(state => ({ pickerSelected: 5 }));
                    break;
                case "6":
                    this.setState(state => ({ pickerSelected: 6 }));
                    break;
                case "7":
                    this.setState(state => ({ pickerSelected: 7 }));
                    break;
                case "8":
                    this.setState(state => ({ pickerSelected: 8 }));
                    break;
                case "9":
                    this.setState(state => ({ pickerSelected: 9 }));
                    break;
                case "f":
                    this.hints();
                    break;
                case "r":
                    this.reset();
                    break;
                case "g":
                    this.generate();
                    break;
            }
        }
    }

    picker = () => {
        let elements = []

        for(let i = 1; i <= 9; i++) {
            elements.push(
                <div className="cell">
                    <div
                        className={"content active picker " + (this.state.pickerSelected === i ? "picker-selected" : "")}
                        onClick={() => this.setState({pickerSelected: i})}
                    >
                        {i}
                    </div>
                </div>
            )
        }

        return <>{elements}</>
    }

    render = () => {
        return <>
            <div className="row legend">
                <div onClick={this.generate}>g - Generate new sudoku</div>
                <div onClick={() => this.reset()}>r - Reset sudoku</div>
                <div onClick={this.hints}>f - Fill all cells with hints</div>
            </div>
            <div className="row numberPicker">
                <this.picker />
            </div>
            <div className="gameField">
                {this.state.board.map((row, y) => (
                    <div className="row" key={y}>
                        {row.map((cell, x) => (
                            <Cell x={x} y={y} playingField={this} ref={cell}/>
                        ))}
                    </div>
                ))}
            </div>
        </>;
    }

    hints = () => {
        for(let x = 0; x < 9; x++) {
            for(let y = 0; y < 9; y++) {
                this.state.board[x][y].current?.setProposedToAllAvailable();
            }
        }
    }

    reset = async (hard?: boolean) => {
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                await this.state.board[x][y].current?.reset(hard);
            }
        }
    }

    generate = async () => {
        await this.reset(true);
        this.state.solver.solve();
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                await this.state.board[x][y].current?.setValue(this.state.solver.board[x][y], true);
            }
        }
        await this.removeRandom(50);
    }

    removeRandom = async (amount: number) => {
        for(let i = amount; i > 0;) {
            let oldNumber = 0, x, y;

            do {
                x = Math.floor(Math.random() * 9);
                y = Math.floor(Math.random() * 9);

                oldNumber = this.state.board[x][y].current?.state.value as number;
            } while (oldNumber === 0)

            await this.state.board[x][y].current?.reset(true);
            let solutions = this.state.solver.approximateNumberOfSolutions()

            console.log("Left: " + i + " | " + solutions + " solutions");

            if(solutions === 1) {
                i--;
            }
            else {
                await this.state.board[x][y].current?.setValue(oldNumber, true);
            }
        }
    }

    toBoardString = () => {
        let saveBoard = [];

        for(let x = 0; x < 9; x++) {
            let row = [];
            for(let y = 0; y < 9; y++) {
                row.push(this.state.board[x][y].current?.state as CellState);
            }
            saveBoard.push(row);
        }

        return JSON.stringify(saveBoard);
    }

    fromBoardString = (boardString: string) => {
        let board = JSON.parse(boardString);

        for(let x = 0; x < 9; x++) {
            for(let y = 0; y < 9; y++) {
                this.state.board[x][y].current?.setState(board[x][y] as CellState);
            }
        }
    }

    getCell = (x: number, y: number) => {
        return this.state.board[y][x];
    }

    updateColumn = (x: number, y: number, event: string) => {
        let numbers = new Set<number>([]);
        for(let iy = 0; iy < 9; iy++) {
            if (iy === y) {
                continue;
            }
            numbers.add(this.state.board[iy][x].current?.state.value as number);
        }

        for(let iy = 0; iy < 9; iy++) {
            if(iy === y) {
                continue;
            }
            this.state.board[iy][x].current?.informUpdate(event)
        }
    }

    updateRow = (x: number, y: number, event: string) => {
        for(let ix = 0; ix < 9; ix++) {
            if(ix === x) {
                continue;
            }
            this.state.board[y][ix].current?.informUpdate(event)
        }
    }

    updateSquare = (x: number, y: number, event: string) => {
        let ix = Math.floor(x / 3);
        let iy = Math.floor(y / 3);

        let numbers = new Set<number>([]);

        for(let i = ix * 3; i < ix * 3 + 3; i++) {
            for(let j = iy * 3; j < iy * 3 + 3; j++) {
                if (i === x && j === y) {
                    continue;
                }
                numbers.add(this.state.board[j][i].current?.state.value as number);
            }
        }

        for(let i = ix * 3; i < ix * 3 + 3; i++) {
            for(let j = iy * 3; j < iy * 3 + 3; j++) {
                if (i === x && j === y) {
                    continue;
                }
                this.state.board[j][i].current?.informUpdate(event)
            }
        }
    }
}

export default Sudoku
