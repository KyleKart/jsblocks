(function (Scratch) {
    'use strict';

    const context = {};

    class extension {
        constructor(runtime) {
            this.runtime = runtime;
            this.globalCodeBuffer = "";
        }

        getInfo() {
            return {
                id: 'js',
                name: 'JSBlocks',
                blocks: [
                    {
                        blockType: Scratch.BlockType.XML,
                        xml: `<block type="event_whenflagclicked"></block>`
                    },
                    {
                        opcode: 'cblock',
                        blockType: Scratch.BlockType.CONDITIONAL,
                        text: '[B0]',
                        color1: 300,
                        color3: '#7C447C',
                        arguments: {
                            B0: {
                                type: Scratch.ArgumentType.NULL,
                            }
                        },
                        branchCount: 1
                    },
                    {
                        opcode: 'generic',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '[ADD0]',
                        color1: 230,
                        color3: '#444D7C',
                        arguments: {
                            ADD0: {
                                type: Scratch.ArgumentType.NULL,
                            }
                        }
                    },
                    {
                        opcode: 'expr',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[EXPR]',
                        color1: 120,
                        arguments: {
                            EXPR: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '1 + 1'
                            }
                        }
                    },
                    {
                        opcode: 'evalCode',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'exec'
                    },
                    "---",
                    {
                        opcode: 'getCode',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'code'
                    },
                    {
                        opcode: 'clearCode',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'clear'
                    }
                ]
            };
        }

        generic(args) {
            if (args.ADD0) {
                this.globalCodeBuffer += args.ADD0 + "\n";
            }
            return args.ADD0;
        }

        expr(args) {
            return args.EXPR;
        }

        cblock(args, util) {
            if (args.B0) {
                this.globalCodeBuffer += args.B0 + " {\n";
            }
            util.startBranch(1, true);
            this.globalCodeBuffer += "}\n";
            return true;
        }

        getCode() {
            return this.globalCodeBuffer;
        }

        evalCode(args, util) {
            if (!this.globalCodeBuffer.trim()) {
                return;
            }
                    const wrappedCode = `
const target = util.target;
const run = Scratch.vm.runtime;

function moveSteps(STEPS) { run.ext_scratch3_motion.moveSteps({STEPS}, {target}); }
function turnRight(DEGREES) { run.ext_scratch3_motion.turnRight({DEGREES}, {target}); }
function turnLeft(DEGREES) { run.ext_scratch3_motion.turnLeft({DEGREES}, {target}); }
function goToXY(X, Y) { run.ext_scratch3_motion.goToXY({X, Y}, {target}); }
function goTo(TO) { run.ext_scratch3_motion.goTo({TO}, {target}); }
function glide(SECS, X, Y) { run.ext_scratch3_motion.glide({SECS, X, Y}, {target}); }
function glideTo(SECS, TO) { run.ext_scratch3_motion.glideTo({SECS, TO}, {target}); }
function pointInDirection(DIRECTION) { run.ext_scratch3_motion.pointInDirection({DIRECTION}, {target}); }
function pointTowards(TOWARDS) { run.ext_scratch3_motion.pointTowards({TOWARDS}, {target}); }
function ifOnEdgeBounce() { run.ext_scratch3_motion.ifOnEdgeBounce({}, {target}); }
function setRotationStyle(STYLE) { run.ext_scratch3_motion.setRotationStyle({STYLE}, {target}); }
function changeX(DX) { run.ext_scratch3_motion.changeXby({DX}, {target}); }
function setX(X) { run.ext_scratch3_motion.setX({X}, {target}); }
function changeY(DY) { run.ext_scratch3_motion.changeYby({DY}, {target}); }
function setY(Y) { run.ext_scratch3_motion.setY({Y}, {target}); }
function getX() { return run.ext_scratch3_motion.getX({}, {target}); }
function getY() { return run.ext_scratch3_motion.getY({}, {target}); }
function getDirection() { return run.ext_scratch3_motion.getDirection({}, {target}); }

function say(MESSAGE) { run.ext_scratch3_looks.say({MESSAGE}, {target}); }
function sayForSecs(MESSAGE, SECS) { run.ext_scratch3_looks.sayforsecs({MESSAGE, SECS}, {target}); }
function think(MESSAGE) { run.ext_scratch3_looks.think({MESSAGE}, {target}); }
function thinkForSecs(MESSAGE, SECS) { run.ext_scratch3_looks.thinkforsecs({MESSAGE, SECS}, {target}); }
function switchCostume(COSTUME) { run.ext_scratch3_looks.switchCostume({COSTUME}, {target}); }
function switchBackdrop(BACKDROP) { run.ext_scratch3_looks.switchBackdrop({BACKDROP}, {target}); }
function nextCostume() { run.ext_scratch3_looks.nextCostume({}, {target}); }
function nextBackdrop() { run.ext_scratch3_looks.nextBackdrop({}, {target}); }
function changeSize(CHANGE) { run.ext_scratch3_looks.changeSize({CHANGE}, {target}); }
function setSize(SIZE) { run.ext_scratch3_looks.setSize({SIZE}, {target}); }
function getSize() { return run.ext_scratch3_looks.getSize({}, {target}); }

function playSound(SOUND_MENU) { run.ext_scratch3_sound.playSound({SOUND_MENU}, {target}); }
function stopAllSounds() { run.ext_scratch3_sound.stopAllSounds({}, {target}); }
function changeVolume(VOLUME) { run.ext_scratch3_sound.changeVolume({VOLUME}, {target}); }
function setVolume(VOLUME) { run.ext_scratch3_sound.setVolume({VOLUME}, {target}); }

function touchingObject(TOUCHINGOBJECTMENU) { 
    return run.ext_scratch3_sensing.touchingObject({TOUCHINGOBJECTMENU}, {target}); 
}
function touchingColor(COLOR) { 
    return run.ext_scratch3_sensing.touchingColor({COLOR}, {target}); 
}
function askAndWait(QUESTION) { 
    return run.ext_scratch3_sensing.askAndWait({QUESTION}, {target}); 
}
function answer() { 
    return run.ext_scratch3_sensing._answer; 
}
function getMouseX() { 
    return run.ext_scratch3_sensing.getMouseX({}, {target}); 
}
function getMouseY() { 
    return run.ext_scratch3_sensing.getMouseY({}, {target}); 
}
function getMouseDown() { 
    return run.ext_scratch3_sensing.getMouseDown({}, {target}); 
}
function getVariable(VARIABLE) {
    return run.ext_scratch3_data.getVariable({VARIABLE}, {target});
}

function setVariableTo(VARIABLE, VALUE) {
    return run.ext_scratch3_data.setVariableTo({VARIABLE, VALUE}, {target});
}

function changeVariableBy(VARIABLE, VALUE) {
    return run.ext_scratch3_data.changeVariableBy({VARIABLE, VALUE}, {target});
}

function showVariable(VARIABLE) {
    return run.ext_scratch3_data.showVariable({VARIABLE}, {target});
}

function hideVariable(VARIABLE) {
    return run.ext_scratch3_data.hideVariable({VARIABLE}, {target});
}

function getListContents(LIST) {
    return run.ext_scratch3_data.getListContents({LIST}, {target});
}

function addToList(ITEM, LIST) {
    return run.ext_scratch3_data.addToList({ITEM, LIST}, {target});
}

function deleteOfList(INDEX, LIST) {
    return run.ext_scratch3_data.deleteOfList({INDEX, LIST}, {target});
}

function deleteAllOfList(LIST) {
    return run.ext_scratch3_data.deleteAllOfList({LIST}, {target});
}

function insertAtList(INDEX, ITEM, LIST) {
    return run.ext_scratch3_data.insertAtList({INDEX, ITEM, LIST}, {target});
}

function replaceItemOfList(INDEX, ITEM, LIST) {
    return run.ext_scratch3_data.replaceItemOfList({INDEX, ITEM, LIST}, {target});
}

function getItemOfList(INDEX, LIST) {
    return run.ext_scratch3_data.getItemOfList({INDEX, LIST}, {target});
}

function getItemNumOfList(ITEM, LIST) {
    return run.ext_scratch3_data.getItemNumOfList({ITEM, LIST}, {target});
}

function lengthOfList(LIST) {
    return run.ext_scratch3_data.lengthOfList({LIST}, {target});
}

function listContainsItem(LIST, ITEM) {
    return run.ext_scratch3_data.listContainsItem({LIST, ITEM}, {target});
}

function showList(LIST) {
    return run.ext_scratch3_data.showList({LIST}, {target});
}

function hideList(LIST) {
    return run.ext_scratch3_data.hideList({LIST}, {target});
}

function add(NUM1, NUM2) { return run.ext_scratch3_operators.add({NUM1, NUM2}); }
function subtract(NUM1, NUM2) { return run.ext_scratch3_operators.subtract({NUM1, NUM2}); }
function multiply(NUM1, NUM2) { return run.ext_scratch3_operators.multiply({NUM1, NUM2}); }
function divide(NUM1, NUM2) { return run.ext_scratch3_operators.divide({NUM1, NUM2}); }
function random(FROM, TO) { return run.ext_scratch3_operators.random({FROM, TO}); }
function greaterThan(OPERAND1, OPERAND2) { return run.ext_scratch3_operators.greaterThan({OPERAND1, OPERAND2}); }
function lessThan(OPERAND1, OPERAND2) { return run.ext_scratch3_operators.lessThan({OPERAND1, OPERAND2}); }
function equals(OPERAND1, OPERAND2) { return run.ext_scratch3_operators.equals({OPERAND1, OPERAND2}); }
function and(OPERAND1, OPERAND2) { return run.ext_scratch3_operators.and({OPERAND1, OPERAND2}); }
function or(OPERAND1, OPERAND2) { return run.ext_scratch3_operators.or({OPERAND1, OPERAND2}); }
function not(OPERAND) { return run.ext_scratch3_operators.not({OPERAND}); }
function join(STRING1, STRING2) { return run.ext_scratch3_operators.join({STRING1, STRING2}); }
function letterOf(STRING, LETTER) { return run.ext_scratch3_operators.letterOf({STRING, LETTER}); }
function stringLength(STRING) { return run.ext_scratch3_operators.length({STRING}); }
function contains(STRING1, STRING2) { return run.ext_scratch3_operators.contains({STRING1, STRING2}); }
function mod(NUM1, NUM2) { return run.ext_scratch3_operators.mod({NUM1, NUM2}); }
function round(NUM) { return run.ext_scratch3_operators.round({NUM}); }
function mathop(OPERATOR, NUM) { return run.ext_scratch3_operators.mathop({OPERATOR, NUM}); }

function wait(DURATION) {
    return run.ext_scratch3_control.wait({DURATION});
}

function waitUntil(CONDITION) {
    return run.ext_scratch3_control.waitUntil({CONDITION}, {target});
}

function stop(STOP_OPTION) {
    return run.ext_scratch3_control.stop({STOP_OPTION}, {target});
}

function createClone(CLONE_OPTION) {
    return run.ext_scratch3_control.createClone({CLONE_OPTION}, {target});
}

function deleteClone() {
    return run.ext_scratch3_control.deleteClone({}, {target});
}

try {
    ${this.globalCodeBuffer}
} catch (error) {
    console.error("User Code Execution Error:", error);
}
        `;

            try {
                return (function (context, util) {
                    return eval(wrappedCode);
                }).call(this, context, util);
            } catch (err) {
                console.error("Eval Error:", err);
                console.error(
                    "Generated code:\n" +
                    this.globalCodeBuffer
                );
            }
        }

        clearCode() {
            this.globalCodeBuffer = "";
        }
    }

    Scratch.extensions.register(new extension());

})(Scratch);