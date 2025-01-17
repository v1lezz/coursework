import { FirstLevel } from "./levels/firstLevel/firstLevel.js"
import { SecondLevel } from "./levels/secondLevel/secondLevel.js"
import { ThirdLevel } from "./levels/thirdLevel/thirdLevel.js"
import { Timer } from "./timer.js"
import { Modal } from "./modal.js"
import { getRandomType } from "./levels/global.js"
import { localStorageManager } from "./localStorageManager.js"
import { ButtonNextLevel } from "./buttons/buttonNextLevel.js"

const getPointsFirstLevel = (firstLevel) => {
    const { isCorrect, firstPoint, secondPoint } = firstLevel.checkDistribution()
    if (isCorrect) {
        return {
            points: Number(firstPoint) + Number(secondPoint),
            maxPoints: 10
        };
    }
    return false;
}

const defaultState = {
    firstLevel: {
        maxPoints: 10,
        points: 0,
    },
    secondLevel: {
        maxPoints: 10,
        points: 0,
    },
    thirdLevel: {
        maxPoints: 10,
        points: 0,
    }
}

class Game {
    constructor() {
        this.pointsState = defaultState;

        this.firstLevel = new FirstLevel(getRandomType()).init()
        this.secondLevel = null;
        this.thirdLevel = null;

        this.timer = new Timer(60 * 4, () => this.onEndTimer()).init()
        this.modal = new Modal();

        this.activeLevel = "first";
        this.activeLevelDom = null;
        this.buttonRestart = null;
        this.buttonNextLevel = new ButtonNextLevel(() => this.onNextLevel()).init();

        this.gameComplete = false;
    }

    init() {
        this.getDomElements()
        this.addListeners()
    }

    getDomElements() {
        this.buttonRestart = document.getElementById("restart")
        this.activeLevelDom = document.getElementById("level")
    }

    addListeners() {
        this.buttonRestart.addEventListener("click", () => this.onClickRestart());

        // document.getElementById("html").addEventListener('keyup', event => {
        //     if (event.key === "Enter") {
        //         this.onNextLevel()
        //     }
        // })
        //
        window.addEventListener('keydown', event => {
            if (event.key === "Enter") {
                this.onNextLevel()
            }
        })
    }

    onNextLevel() {
        switch (this.activeLevel) {
            case "first":
                let points = getPointsFirstLevel(this.firstLevel)
                // points = {
                //     points: 0,
                //     maxPoints: 10,
                // }
                if (points) {
                    this.buttonNextLevel.changeTheme();

                    setTimeout(() => {
                        this.pointsState.firstLevel = points;
                        this.modal.openModal()
                        this.modal.changeModalText(`Баллы за первый уровень: ${points.points} из ${points.maxPoints} баллов`)
                        this.buttonNextLevel.deleteTheme();
                        this.changeActiveLevel("second")
                    }, 2000)
                } else {
                    this.modal.changeModalText("Вы не добавили все числа в ячейки, чтобы перейти на следующий уровень. Пожалуйста, попробуйте еще раз")
                    this.modal.openModal()
                }
                break;
            case "second":
                if (!this.secondLevel.inputIsClear()) {
                    let modalMessage = "";
                    let correctAns = this.secondLevel.getAnswer();
                    if (this.secondLevel.checkCorrectAnswer()) {
                        this.pointsState.secondLevel = {
                            points: 10,
                            maxPoints: 10
                        };
                        modalMessage = "Вы получили за второй уровень: 10 из 10 баллов.\n"
                    } else {
                        this.pointsState.secondLevel = {
                            points: 0,
                            maxPoints: 10
                        };
                        modalMessage = "Вы получили за второй уровень: 0 из 10 баллов.\n"
                    }
                    this.modal.changeModalText(modalMessage + `\nПравильный ответ на второй уровень: ${correctAns}`)
                    this.modal.openModal()

                    this.changeActiveLevel("third")
                } else {
                    // open modal with message
                    this.modal.changeModalText("Вы не ввели ответ, попробуйте еще раз")
                    this.modal.openModal()
                }
                break;
            case "third":
                this.thirdLevel.setColor();
                this.buttonNextLevel.changeTheme();
                setTimeout(() => {
                    this.pointsState.thirdLevel = {
                        points: this.thirdLevel.calculateCorrectSelections(),
                        maxPoints: 20
                    };
                    localStorageManager.addResultToRating(this.pointsState, localStorageManager.getUser());
                    localStorageManager.addUserResult({ username: localStorageManager.getUser(), ...this.pointsState })
                    this.gameComplete = true;
                    this.buttonNextLevel.deleteTheme();
                    window.location.href = "rating.html"
                    }, 2000)

    

                break;
        }
    }


    changeActiveLevel(newLevel) {
        this.activeLevel = newLevel;
        switch (newLevel) {
            case "second":
                this.activeLevelDom.textContent = "2";
                this.secondLevel = new SecondLevel().init();
                break;
            case "third":
                this.activeLevelDom.textContent = "3";
                this.thirdLevel = new ThirdLevel().init();
                break;
        }
    }

    onClickRestart() {
        window.location.reload();
    }

    onEndTimer() {
        this.modal.openModal()
        this.modal.changeModalText("К сожалению, время вышло. Вас перебросит на регистрацию, где вы можете повторно попробовать пройти тест")
        document.location.href = "auth.html"
    }
}

new Game().init()