import React, {RefObject} from "react";
import "./Sudoku.css"

type CellProps = {
    x: number;
    y: number;
    given?: number;
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
    proposed: Set<number>;
    errors: Set<ErrorType>;
    hoverState: HoverType;
}

class Cell extends React.Component<CellProps, CellState> {
    constructor(props: CellProps) {
        super(props);
        this.state = {
            value: props.given || 0,
            proposed: new Set(),
            errors: new Set(),
            hoverState: HoverType.NONE
        }
        this.reset();
    }

    reset = () => {
        this.setState({
            value: this.props.given || 0,
            proposed: new Set<number>([]),
            errors: new Set<ErrorType>(),
            hoverState: HoverType.NONE
        });
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

    setValue = (n: number) => {
        this.setState({value: n});
    }

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

    onClick = () => {
        if(this.props.given) return;

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

    onDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if(this.props.given) return;

        this.setState(
            state => {
                if(state.value !== this.props.playingField.state.pickerSelected) {
                    return {
                        value: this.props.playingField.state.pickerSelected,
                        proposed: new Set<number>([this.props.playingField.state.pickerSelected])
                    }
                } else {
                    return {
                        value: 0,
                        proposed: new Set<number>([])
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
            (this.state.errors.size > 0 && !this.props.given) ? "invalid" : "valid",
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

    render = () => {
        return (
            <div
                className={this.buildCSSClasses()}
                onClick={this.onClick}
                onContextMenu={this.onDoubleClick}
                onDoubleClick={this.onDoubleClick}
                onMouseEnter={this.mouseEnter}
                onMouseLeave={this.mouseLeave}
            >
                {this.state.value !== 0 ? this.renderWithNumber() : this.renderProposals()}
            </div>
        );
    }
}

type SudokuProps = {
};

type SudokuState = {
    field: RefObject<Cell>[][];
    pickerSelected: number;
};

class Sudoku extends React.Component<SudokuProps, SudokuState> {
    constructor(props: SudokuProps) {
        super(props);

        this.state = {
            field: [],
            pickerSelected: 1
        };

        for(let i = 0; i < 9; i++) {
            let row: RefObject<Cell>[] = [];
            for(let j = 0; j < 9; j++) {
                row.push(React.createRef<Cell>());
            }
            this.state.field.push(row);
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
                    for(let x = 0; x < 9; x++) {
                        for(let y = 0; y < 9; y++) {
                            this.state.field[x][y].current?.setProposedToAllAvailable();
                        }
                    }
                    break;
                case "r":
                    this.reset();
                    break;
                case "s":
                    this.solve();
                    break;
                case "g":
                    this.reset();
                    this.solve();
                    this.removeRandom(150)
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
            <div className="row numberPicker">
                <this.picker />
            </div>
            <div className="gameField">
                {this.state.field.map((row, y) => (
                    <div className="row" key={y}>
                        {row.map((cell, x) => (
                            <Cell x={x} y={y} playingField={this} ref={cell}/>
                        ))}
                    </div>
                ))}
            </div>
        </>;
    }

    reset = () => {
        for(let x = 0; x < 9; x++) {
            for(let y = 0; y < 9; y++) {
                this.state.field[x][y].current?.reset();
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

    solve = (x?: number, y?: number): boolean => {
        x = x || 0;
        y = y || 0;

        if(x === 9) {
            x = 0;
            y++;
        }

        if(y === 9) {
            return true;
        }

        if(this.state.field[x][y].current?.state.value !== 0) {
            return this.solve(x + 1, y);
        }

        let stepBias = this.arrayShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for(let i = 1; i <= 9; i++) {
            let biasedValue = stepBias[i - 1];

            if(this.state.field[x][y].current?.isAvailable(biasedValue)) {
                this.state.field[x][y].current?.setValue(biasedValue);
                if(this.solve(x + 1, y)) {
                    return true;
                }
                this.state.field[x][y].current?.reset();
            }
        }

        return false;
    }

    removeRandom = (amount: number) => {
        for(let i = 0; i < amount; i++) {
            let x = Math.floor(Math.random() * 9);
            let y = Math.floor(Math.random() * 9);

            this.state.field[x][y].current?.reset();
        }
    }

    getCell = (x: number, y: number) => {
        return this.state.field[y][x];
    }

    updateColumn = (x: number, y: number, event: string) => {
        let numbers = new Set<number>([]);
        for(let iy = 0; iy < 9; iy++) {
            if (iy === y) {
                continue;
            }
            numbers.add(this.state.field[iy][x].current?.state.value as number);
        }

        for(let iy = 0; iy < 9; iy++) {
            if(iy === y) {
                continue;
            }
            this.state.field[iy][x].current?.informUpdate(event)
        }
    }

    updateRow = (x: number, y: number, event: string) => {
        for(let ix = 0; ix < 9; ix++) {
            if(ix === x) {
                continue;
            }
            this.state.field[y][ix].current?.informUpdate(event)
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
                numbers.add(this.state.field[j][i].current?.state.value as number);
            }
        }

        for(let i = ix * 3; i < ix * 3 + 3; i++) {
            for(let j = iy * 3; j < iy * 3 + 3; j++) {
                if (i === x && j === y) {
                    continue;
                }
                this.state.field[j][i].current?.informUpdate(event)
            }
        }
    }
}

export default Sudoku
