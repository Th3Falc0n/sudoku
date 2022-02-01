import React, {Ref, RefObject} from "react";
import "./Sudoku.css"

type CellProps = {
    x: number;
    y: number;
    playingField: Sudoku;
}

type CellState = {
    value: number;
    proposed: number[];
    isEditable: boolean;
    classes: string[];
}

class Cell extends React.Component<CellProps, CellState> {
    constructor(props: CellProps) {
        super(props);
        this.state = {
            value: Math.floor((Math.random() * 3) * (Math.random() * 3)),
            proposed: [1, 5],
            isEditable: true,
            classes: []
        };
    }

    informUpdate = (event: string) => {
        switch (event) {
            case "mouseEnter":
                this.setState({
                    classes: ["hoverN"]
                });
                break;
            case "mouseLeave":
                this.setState({
                    classes: [""]
                });
                break;
        }
    }

    increase = () => {
        this.setState(state => ({
            value: state.value + 1
        }));
    }

    onClick = () => {
        this.increase();

        this.updateNeighbors("click")
    }

    mouseEnter = () => {
        this.updateNeighbors("mouseEnter")
        this.setState(state => ({
            classes: ["hover"]
        }));
    }

    mouseLeave = () => {
        this.updateNeighbors("mouseLeave")
        this.setState(state => ({
            classes: [""]
        }));
    }

    updateNeighbors = (event: string) => {
        this.props.playingField.updateRow(this.props.y, event);
        this.props.playingField.updateColumn(this.props.x, event);
        this.props.playingField.updateSquare(this.props.x, this.props.y, event);
    }

    buildCSSClasses = () => ["cell", "col-" + this.props.x, "row-" + this.props.y].concat(this.state.classes).join(" ")

    renderWithNumber = () => <div className="content active">{this.state.value}</div>

    renderProposals = () => {
        let elements = [];
        for(let a = 0; a < 3; a++) {
            let row = [];
            for(let b = 1; b < 4; b++) {
                row.push(<div className={"fcell idx-" + a + "-" + b} key={a * 3 + b}>{this.state.proposed.includes(a * 3 + b) ? a * 3 + b : ""}</div>);
            }

            elements.push(<div className="frow">{row}</div>);
        }

        return <div className="content">{elements}</div>;
    }

    render() {
        return (
            <div
                className={this.buildCSSClasses()}
                onClick={this.onClick}
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
};

class Sudoku extends React.Component<SudokuProps, SudokuState> {
    constructor(props: SudokuProps) {
        super(props);

        this.state = {
            field: []
        };

        for(let i = 0; i < 9; i++) {
            let row: RefObject<Cell>[] = [];
            for(let j = 0; j < 9; j++) {
                row.push(React.createRef<Cell>());
            }
            this.state.field.push(row);
        }
    }

    tick() {

    }

    componentDidMount() {
        setInterval(() => this.tick(), 1000);
    }

    render() {
        return (
            <div className="gameField">
                {this.state.field.map((row, y) => (
                    <div className="row" key={y}>
                        {row.map((cell, x) => (
                            <Cell x={x} y={y} playingField={this} ref={cell}/>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    updateColumn = (x: number, event: string) => {
        for(let y = 0; y < 9; y++) {
            this.state.field[y][x].current?.informUpdate(event)
        }
    }

    updateRow = (y: number, event: string) => {
        for(let x = 0; x < 9; x++) {
            this.state.field[y][x].current?.informUpdate(event)
        }
    }

    updateSquare = (x: number, y: number, event: string) => {
        let ix = Math.floor(x / 3);
        let iy = Math.floor(y / 3);

        for(let i = ix * 3; i < ix * 3 + 3; i++) {
            for(let j = iy * 3; j < iy * 3 + 3; j++) {
                this.state.field[j][i].current?.informUpdate(event)
            }
        }
    }
}

export default Sudoku
