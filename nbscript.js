Blockly.Blocks['js_expr'] = {
  init() {
    this._defaultColour = 120;
    this.appendDummyInput().appendField(new Blockly.FieldTextInput("1 + 1"), "EXPR");
    this.setOutput(true, null);
    this.setColour(this._defaultColour);
    addColourContextMenu(this);
  },
  saveExtraState() { return this._userColour ? { colour: this._userColour } : null; },
  loadExtraState(state) {
    if (state && state.colour) {
      this._userColour = state.colour;
      this.setColour(state.colour);
    }
  }
};

Blockly.Blocks['js_generic'] = {
  init() {
    this._defaultColour = 230;
    this.itemCount_ = 1;
    this.updateShape_();
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setColour(this._defaultColour);
    this.setMutator(new Blockly.icons.MutatorIcon(['js_generic_item'], this));
    addColourContextMenu(this);
  },
  saveExtraState() {
    return {
      'itemCount': this.itemCount_,
      ...(this._userColour ? { colour: this._userColour } : {})
    };
  },
  loadExtraState(state) {
    if (state) {
      this.itemCount_ = state.itemCount || 1;
      this.updateShape_();
      if (state.colour) {
        this._userColour = state.colour;
        this.setColour(state.colour);
      }
    }
  },
  decompose(workspace) {
    const containerBlock = workspace.newBlock('js_generic_container');
    containerBlock.initSvg();
    let connection = containerBlock.getInput('STACK').connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('js_generic_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose(containerBlock) {
    let itemBlock = containerBlock.getInput('STACK').connection.targetBlock();
    const connections = [];
    while (itemBlock && !itemBlock.isInsertionMarker()) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    this.itemCount_ = connections.length || 1;
    this.updateShape_();
    for (let i = 0; i < this.itemCount_; i++) {
      if (connections[i]) {
        this.getInput('ADD' + i).connection.connect(connections[i]);
      }
    }
  },
  saveConnections(containerBlock) {
    let itemBlock = containerBlock.getInput('STACK').connection.targetBlock();
    let i = 0;
    while (itemBlock) {
      const input = this.getInput('ADD' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      i++;
    }
  },
  updateShape_() {
    let i = 0;
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    for (i = 0; i < this.itemCount_; i++) {
      this.appendValueInput('ADD' + i).setCheck(null);
    }
  }
};

Blockly.Blocks['js_generic_container'] = {
  init() {
    this.setStyle('list_blocks');
    this.appendDummyInput().appendField("Inputs");
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  }
};
Blockly.Blocks['js_generic_item'] = {
  init() {
    this.setStyle('list_blocks');
    this.appendDummyInput().appendField("Input");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};


Blockly.Blocks['js_cblock'] = {
  init() {
    this._defaultColour = 300;
    this.branchHeaders_ = [1]; 
    this.updateShape_();
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setColour(this._defaultColour);
    this.setMutator(new Blockly.icons.MutatorIcon(['js_cblock_branch', 'js_cblock_item'], this));
    addColourContextMenu(this);
  },
  saveExtraState() {
    return {
      'branchHeaders': this.branchHeaders_,
      ...(this._userColour ? { colour: this._userColour } : {})
    };
  },
  loadExtraState(state) {
    if (state) {
      this.branchHeaders_ = state.branchHeaders || [1];
      this.updateShape_();
      if (state.colour) {
        this._userColour = state.colour;
        this.setColour(state.colour);
      }
    }
  },
  decompose(workspace) {
    const containerBlock = workspace.newBlock('js_cblock_container');
    containerBlock.initSvg();
    let connection = containerBlock.getInput('STACK').connection;
    
    for (let j = 1; j < this.branchHeaders_[0]; j++) {
      const itemBlock = workspace.newBlock('js_cblock_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    
    for (let i = 1; i < this.branchHeaders_.length; i++) {
      const branchBlock = workspace.newBlock('js_cblock_branch');
      branchBlock.initSvg();
      connection.connect(branchBlock.previousConnection);
      connection = branchBlock.nextConnection;
      
      for (let j = 1; j < this.branchHeaders_[i]; j++) {
        const itemBlock = workspace.newBlock('js_cblock_item');
        itemBlock.initSvg();
        connection.connect(itemBlock.previousConnection);
        connection = itemBlock.nextConnection;
      }
    }
    return containerBlock;
  },
  compose(containerBlock) {
    let currentBlock = containerBlock.getInput('STACK').connection.targetBlock();
    
    const newHeaders = [1];
    const connections = [[]];
    let branchIndex = 0;

    while (currentBlock && !currentBlock.isInsertionMarker()) {
      if (currentBlock.type === 'js_cblock_item') {
        newHeaders[branchIndex]++;
        connections[branchIndex].push(currentBlock.valueConnection_);
      } else if (currentBlock.type === 'js_cblock_branch') {
        branchIndex++;
        newHeaders.push(1);
        connections.push([currentBlock.valueConnection_]);
      }
      currentBlock = currentBlock.nextConnection && currentBlock.nextConnection.targetBlock();
    }

    this.branchHeaders_ = newHeaders;
    this.updateShape_();

    for (let b = 0; b < this.branchHeaders_.length; b++) {
      if (b > 0 && this.branchConnections_[b]) {
        const doInput = this.getInput('DO' + b);
        if (doInput && this.branchConnections_[b]) doInput.connection.connect(this.branchConnections_[b]);
      } else if (b === 0 && this.branchConnections_[0]) {
        const doInput = this.getInput('DO0');
        if (doInput) doInput.connection.connect(this.branchConnections_[0]);
      }

      for (let i = 0; i < this.branchHeaders_[b]; i++) {
        const conn = (i === 0) ? this.baseConnections_[b] : connections[b][i - 1];
        const input = this.getInput(`B${b}_ADD${i}`);
        if (input && conn) input.connection.connect(conn);
      }
    }
  },
  saveConnections(containerBlock) {
    this.baseConnections_ = [];
    this.branchConnections_ = [];
    
    for (let b = 0; b < this.branchHeaders_.length; b++) {
      const baseIn = this.getInput(`B${b}_ADD0`);
      this.baseConnections_.push(baseIn ? baseIn.connection.targetConnection : null);
      
      const doIn = this.getInput('DO' + b);
      this.branchConnections_.push(doIn ? doIn.connection.targetConnection : null);
    }

    let currentBlock = containerBlock.getInput('STACK').connection.targetBlock();
    let branchIndex = 0;
    let itemIndex = 0;

    while (currentBlock) {
      if (currentBlock.type === 'js_cblock_item') {
        itemIndex++;
        const input = this.getInput(`B${branchIndex}_ADD${itemIndex}`);
        currentBlock.valueConnection_ = input ? input.connection.targetConnection : null;
      } else if (currentBlock.type === 'js_cblock_branch') {
        branchIndex++;
        itemIndex = 0;
        const input = this.getInput(`B${branchIndex}_ADD0`);
        currentBlock.valueConnection_ = input ? input.connection.targetConnection : null;
      }
      currentBlock = currentBlock.nextConnection && currentBlock.nextConnection.targetBlock();
    }
  },
  updateShape_() {
    let b = 0;
    while (this.getInput('DO' + b) || this.getInput(`B${b}_ADD0`)) {
      if (this.getInput('DO' + b)) this.removeInput('DO' + b);
      let i = 0;
      while (this.getInput(`B${b}_ADD${i}`)) {
        this.removeInput(`B${b}_ADD${i}`);
        i++;
      }
      b++;
    }

    for (b = 0; b < this.branchHeaders_.length; b++) {
      for (let i = 0; i < this.branchHeaders_[b]; i++) {
        this.appendValueInput(`B${b}_ADD${i}`).setCheck(null);
      }
      this.appendStatementInput('DO' + b);
    }
  }
};

Blockly.Blocks['js_cblock_container'] = {
  init() {
    this.setStyle('logic_blocks');
    this.appendDummyInput().appendField("Inputs");
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  }
};
Blockly.Blocks['js_cblock_branch'] = {
  init() {
    this.setStyle('logic_blocks');
    this.appendDummyInput().appendField("Branch");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};
Blockly.Blocks['js_cblock_item'] = {
  init() {
    this.setStyle('logic_blocks');
    this.appendDummyInput().appendField("Input");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};


Blockly.Blocks['js_hat'] = {
  init() {
    this._defaultColour = 190;
    this.appendDummyInput().appendField("Run");
    this.appendStatementInput("DO");
    this.setColour(this._defaultColour);
    addColourContextMenu(this);
  },
  saveExtraState() { return this._userColour ? { colour: this._userColour } : null; },
  loadExtraState(state) {
    if (state && state.colour) {
      this._userColour = state.colour;
      this.setColour(state.colour);
    }
  }
};

const jsGen = Blockly.JavaScript;
jsGen.forBlock = jsGen.forBlock || {};

jsGen.forBlock['js_expr'] = (block) => {
    const expr = block.getFieldValue('EXPR') || '';
    return [expr, jsGen.ORDER_ATOMIC];
};

jsGen.forBlock['js_generic'] = (block, generator) => {
    const elements = [];
    for (let i = 0; i < block.itemCount_; i++) {
      const codePart = generator.valueToCode(block, 'ADD' + i, jsGen.ORDER_ATOMIC);
      if (codePart) elements.push(codePart);
    }
    const combinedCode = elements.join(' ');
    return combinedCode ? combinedCode + ';\n' : '';
};

jsGen.forBlock['js_cblock'] = (block, generator) => {
    let code = '';
    
    for (let b = 0; b < block.branchHeaders_.length; b++) {
      const headerElements = [];
      for (let i = 0; i < block.branchHeaders_[b]; i++) {
        const codePart = generator.valueToCode(block, `B${b}_ADD${i}`, jsGen.ORDER_ATOMIC);
        if (codePart) headerElements.push(codePart);
      }
      
      const combinedHeader = headerElements.join(' ');
      const branchBody = generator.statementToCode(block, 'DO' + b);
      
      if (b === 0) {
        code += `${combinedHeader} {\n${branchBody}}`;
      } else {
        code += ` ${combinedHeader} {\n${branchBody}}`;
      }
    }
    
    return code + '\n';
};

jsGen.forBlock['js_hat'] = (block, generator) => {
    return generator.statementToCode(block, 'DO');
};

const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1, maxScale: 3, minScale: 0.4 },
    move: { scrollbars: true, drag: true, wheel: true },
    grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
    renderer: 'geras',
    plugins: { backpack: Blockly.WorkspaceBackpack }
});

let currentFontFamily = null;
let currentFontSize = null;

function updateBlocklyTypography(fontFamily, fontSize) {
  currentFontFamily = fontFamily;
  currentFontSize = fontSize ? Number(fontSize) : null;

  if (!currentFontFamily && !currentFontSize) {
    resetBlocklyTypography();
    return;
  }

  const dynamicTheme = Blockly.Theme.defineTheme('dynamicFontTheme', {
    'base': Blockly.Themes.Classic,
    'fontStyle': {
      ...(currentFontFamily ? { 'family': currentFontFamily } : {}),
      'weight': 'normal',
      ...(currentFontSize ? { 'size': currentFontSize } : {})
    }
  });

  workspace.setTheme(dynamicTheme);

  let styleEl = document.getElementById('blockly-dynamic-font-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'blockly-dynamic-font-style';
    document.head.appendChild(styleEl);
  }

  let cssRules = '';
  if (currentFontFamily || currentFontSize) {
    cssRules = `
      .blocklyText, .blocklyEditableText, .blocklyHtmlInput {
        ${currentFontFamily ? `font-family: ${currentFontFamily} !important;` : ''}
        ${currentFontSize ? `font-size: ${currentFontSize}px !important;` : ''}
        font-variant-ligatures: common-ligatures contextual !important;
        -webkit-font-feature-settings: "liga" 1, "calt" 1 !important;
        font-feature-settings: "liga" 1, "calt" 1 !important;
      }
    `;
  }
  styleEl.innerHTML = cssRules;
}

function resetBlocklyTypography() {
  currentFontFamily = null;
  currentFontSize = null;

  workspace.setTheme(Blockly.Themes.Classic);

  const styleEl = document.getElementById('blockly-dynamic-font-style');
  if (styleEl) {
    styleEl.innerHTML = '';
  }
}

document.querySelectorAll('.font-select:not(.font-default)').forEach(el => {
  el.addEventListener('click', (e) => {
    updateBlocklyTypography(e.target.getAttribute('data-font'), currentFontSize);
  });
});

document.querySelector('.font-default').addEventListener('click', () => {
  if (currentFontSize) {
    updateBlocklyTypography(null, currentFontSize);
  } else {
    resetBlocklyTypography();
  }
});

document.querySelectorAll('.size-select').forEach(el => {
  el.addEventListener('click', (e) => {
    updateBlocklyTypography(currentFontFamily, e.target.getAttribute('data-size'));
  });
});

document.getElementById('menuResetTheme').addEventListener('click', () => {
  resetBlocklyTypography();
  setBlocklyRenderer("geras");
});

document.querySelectorAll('.size-select:not(.size-default)').forEach(el => {
  el.addEventListener('click', (e) => {
    updateBlocklyTypography(currentFontFamily, e.target.getAttribute('data-size'));
  });
});

document.querySelector('.size-default').addEventListener('click', () => {
  if (currentFontFamily) {
    updateBlocklyTypography(currentFontFamily, null);
  } else {
    resetBlocklyTypography();
  }
});

let currentRenderer = 'geras';

function setBlocklyRenderer(rendererName) {
  currentRenderer = rendererName;

  const xmlDom = Blockly.Xml.workspaceToDom(workspace);

  const blocklyDiv = document.getElementById('blocklyDiv');
  blocklyDiv.innerHTML = '';

  workspace = Blockly.inject(blocklyDiv, {
    toolbox: document.getElementById('toolbox'),
    renderer: currentRenderer,
  });

  Blockly.Xml.domToWorkspace(xmlDom, workspace);

  if (currentFontFamily || currentFontSize) {
    updateBlocklyTypography(currentFontFamily, currentFontSize);
  }
}

document.querySelectorAll('.renderer-select').forEach(el => {
  el.addEventListener('click', (e) => {
    setBlocklyRenderer(e.target.getAttribute('data-renderer'));
  });
});

document.querySelector('.renderer-default').addEventListener('click', () => {
    setBlocklyRenderer("geras");
});

function addColourContextMenu(block) {
  block.customContextMenu = function (options) {
    options.push({
      text: 'Set Colour',
      enabled: true,
      callback: () => {
        const input = document.createElement('input');
        input.type = 'color';
        try { input.value = Blockly.utils.colour.rgbToHex(block.getColour()); } catch {}
        input.oninput = () => {
          block._userColour = input.value;
          block.setColour(input.value);
        };
        input.click();
      }
    });
    if (block._userColour) {
      options.push({
        text: 'Reset Colour',
        enabled: true,
        callback: () => {
          delete block._userColour;
          block.setColour(block._defaultColour);
        }
      });
    }
  };
}

function runUserCode(userCode) {
    const vmFrame = document.getElementById('stage');
    if (vmFrame && vmFrame.contentWindow) {
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
    ${userCode}
} catch (error) {
    console.error("User Code Execution Error:", error);
}
        `;

        vmFrame.contentWindow.postMessage({
            type: "eval",
            code: wrappedCode
        }, "*");
    } else {
        alert("VM Frame not found.");
    }
}

document.getElementById('menuExportHTML').addEventListener('click', () => {
    let code = '';
    workspace.getTopBlocks(true).forEach(block => {
        if (block.type === 'js_hat') code += jsGen.forBlock['js_hat'](block, jsGen);
    });

    const html = `<!DOCTYPE html>
<html>
<body>
<iframe id="stage" src="https://kylekart.github.io/jsblocks/vm.html" width="480" height="360"></iframe>
<script>
window.addEventListener("message", (e) => {
  if (e.data.type === "eval") {  }
});
</script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.html';
    a.click();
});

function parseBlock(lines, start, end, parentBlock) {
    let lastBlock = null;
    let i = start;
    while (i < end) {
        let line = lines[i].trim();
        if (!line) { i++; continue; }
        if (line === '}') return;
        
        const isCBlock = line.endsWith('{');
        const block = workspace.newBlock(isCBlock ? 'js_cblock' : 'js_generic');
        block.initSvg();
        block.render();
        
        const exprBlock = workspace.newBlock('js_expr');
        exprBlock.setFieldValue(isCBlock ? line.slice(0, -1).trim() : line.replace(/;$/, ''), 'EXPR');
        exprBlock.initSvg();
        exprBlock.render();
        
        const inputName = isCBlock ? 'B0_ADD0' : 'ADD0';
        block.getInput(inputName).connection.connect(exprBlock.outputConnection);

        if (!lastBlock) {
            const doInput = parentBlock.getInput('DO') || parentBlock.getInput('DO0');
            if (doInput) doInput.connection.connect(block.previousConnection);
        } else {
            lastBlock.nextConnection.connect(block.previousConnection);
        }
        
        if (isCBlock) {
            let depth = 1;
            let j = i + 1;
            while (j < end && depth > 0) {
                if (lines[j].includes('{')) depth++;
                if (lines[j].includes('}')) depth--;
                j++;
            }
            parseBlock(lines, i + 1, j - 1, block);
            lastBlock = block;
            i = j;
            continue;
        }

        lastBlock = block;
        i++;
    }
}

workspace.addChangeListener((event) => {
    if (event.type === Blockly.Events.UI) return;

    let code = '';
    workspace.getTopBlocks(true).forEach(block => {
        if (block.type === 'js_hat') code += jsGen.forBlock['js_hat'](block, jsGen);
    });
    runUserCode(code);
});

document.getElementById('menuSave').addEventListener('click', () => {
    const jsonObj = Blockly.serialization.workspaces.save(workspace);
    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "jblocks_workspace.json";
    a.click();
});

document.getElementById('menuLoad').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = event => {
            workspace.clear();
            Blockly.serialization.workspaces.load(JSON.parse(event.target.result), workspace);
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
});

document.getElementById('menuImportJS').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = event => {
            workspace.clear();
            const hat = workspace.newBlock('js_hat');
            hat.initSvg();
            hat.render();
            const lines = event.target.result.split('\n');
            parseBlock(lines, 0, lines.length, hat);
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
});

document.getElementById('menuExportSB3').addEventListener('click', async () => {
    const JSZip = window.JSZip;

    if (!JSZip) {
        console.error('JSZip is not loaded.');
        return;
    }

    const zip = new JSZip();

    const projectJson = {
        targets: [
            {
                isStage: true,
                name: "Stage",
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                comments: {},
                currentCostume: 0,
                costumes: [{
                    name: "backdrop1",
                    dataFormat: "svg",
                    assetId: "cd21514d0531fdffb22204e0ec5ed84a",
                    md5ext: "cd21514d0531fdffb22204e0ec5ed84a.svg",
                    rotationCenterX: 240,
                    rotationCenterY: 180
                }],
                sounds: [],
                volume: 100,
                layerOrder: 0
            },
            {
                isStage: false,
                name: "Sprite1",
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                comments: {},
                currentCostume: 0,
                costumes: [{
                    name: "costume1",
                    bitmapResolution: 1,
                    dataFormat: "svg",
                    assetId: "4d45a484633a5369e85831f9cb9c7a4e",
                    md5ext: "4d45a484633a5369e85831f9cb9c7a4e.svg",
                    rotationCenterX: 22.61983,
                    rotationCenterY: 56.691514
                }],
                sounds: [],
                volume: 100,
                layerOrder: 1,
                visible: true,
                x: 0,
                y: 0,
                size: 100,
                direction: 90,
                draggable: false,
                rotationStyle: "all around"
            }
        ],

        monitors: [],

        extensions: ["js"],

        // KEEP YOUR EXISTING extensionURLs HERE
        extensionURLs: {
            "js": "data:text/javascript;base64,KGZ1bmN0aW9uIChTY3JhdGNoKSB7DQogICAgJ3VzZSBzdHJpY3QnOw0KDQogICAgY29uc3QgY29udGV4dCA9IHt9Ow0KDQogICAgY2xhc3MgSlNCbG9ja3NFeHRlbnNpb24gew0KICAgICAgICBjb25zdHJ1Y3RvcihydW50aW1lKSB7DQogICAgICAgICAgICB0aGlzLnJ1bnRpbWUgPSBydW50aW1lOw0KICAgICAgICAgICAgdGhpcy5nbG9iYWxDb2RlQnVmZmVyID0gIiI7DQogICAgICAgIH0NCg0KICAgICAgICBnZXRJbmZvKCkgew0KICAgICAgICAgICAgcmV0dXJuIHsNCiAgICAgICAgICAgICAgICBpZDogJ2pzJywNCiAgICAgICAgICAgICAgICBuYW1lOiAnSlNCbG9ja3MnLA0KICAgICAgICAgICAgICAgIGJsb2NrczogWw0KICAgICAgICAgICAgICAgICAgICB7DQogICAgICAgICAgICAgICAgICAgICAgICBibG9ja1R5cGU6IFNjcmF0Y2guQmxvY2tUeXBlLlhNTCwNCiAgICAgICAgICAgICAgICAgICAgICAgIHhtbDogYDxibG9jayB0eXBlPSJldmVudF93aGVuZmxhZ2NsaWNrZWQiPjwvYmxvY2s+YA0KICAgICAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgICAgICB7DQogICAgICAgICAgICAgICAgICAgICAgICBvcGNvZGU6ICdjYmxvY2snLA0KICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tUeXBlOiBTY3JhdGNoLkJsb2NrVHlwZS5DT05ESVRJT05BTCwNCiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdbQjBdJywNCiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yMTogMzAwLA0KICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IzOiAnIzdDNDQ3QycsDQogICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IHsNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBCMDogew0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBTY3JhdGNoLkFyZ3VtZW50VHlwZS5OVUxMLA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICAgICAgICAgIH0sDQogICAgICAgICAgICAgICAgICAgICAgICBicmFuY2hDb3VudDogMQ0KICAgICAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgICAgICB7DQogICAgICAgICAgICAgICAgICAgICAgICBvcGNvZGU6ICdnZW5lcmljJywNCiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrVHlwZTogU2NyYXRjaC5CbG9ja1R5cGUuQ09NTUFORCwNCiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdbQUREMF0nLA0KICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IxOiAyMzAsDQogICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjM6ICcjNDQ0RDdDJywNCiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogew0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFERDA6IHsNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogU2NyYXRjaC5Bcmd1bWVudFR5cGUuTlVMTCwNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIH0sDQogICAgICAgICAgICAgICAgICAgIHsNCiAgICAgICAgICAgICAgICAgICAgICAgIG9wY29kZTogJ2V4cHInLA0KICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tUeXBlOiBTY3JhdGNoLkJsb2NrVHlwZS5SRVBPUlRFUiwNCiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdbRVhQUl0nLA0KICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IxOiAxMjAsDQogICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IHsNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFWFBSOiB7DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFNjcmF0Y2guQXJndW1lbnRUeXBlLlNUUklORywNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAnMSArIDEnDQogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgICAgICB7DQogICAgICAgICAgICAgICAgICAgICAgICBvcGNvZGU6ICdldmFsQ29kZScsDQogICAgICAgICAgICAgICAgICAgICAgICBibG9ja1R5cGU6IFNjcmF0Y2guQmxvY2tUeXBlLkNPTU1BTkQsDQogICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnZXhlYycNCiAgICAgICAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgICAgICAgIi0tLSIsDQogICAgICAgICAgICAgICAgICAgIHsNCiAgICAgICAgICAgICAgICAgICAgICAgIG9wY29kZTogJ2dldENvZGUnLA0KICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tUeXBlOiBTY3JhdGNoLkJsb2NrVHlwZS5SRVBPUlRFUiwNCiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdjb2RlJw0KICAgICAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgICAgICB7DQogICAgICAgICAgICAgICAgICAgICAgICBvcGNvZGU6ICdjbGVhckNvZGUnLA0KICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tUeXBlOiBTY3JhdGNoLkJsb2NrVHlwZS5DT01NQU5ELA0KICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ2NsZWFyJw0KICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgXQ0KICAgICAgICAgICAgfTsNCiAgICAgICAgfQ0KDQogICAgICAgIGdlbmVyaWMoYXJncykgew0KICAgICAgICAgICAgaWYgKGFyZ3MuQUREMCkgew0KICAgICAgICAgICAgICAgIHRoaXMuZ2xvYmFsQ29kZUJ1ZmZlciArPSBhcmdzLkFERDAgKyAiXG4iOw0KICAgICAgICAgICAgfQ0KICAgICAgICAgICAgcmV0dXJuIGFyZ3MuQUREMDsNCiAgICAgICAgfQ0KDQogICAgICAgIGV4cHIoYXJncykgew0KICAgICAgICAgICAgcmV0dXJuIGFyZ3MuRVhQUjsNCiAgICAgICAgfQ0KDQogICAgICAgIGNibG9jayhhcmdzLCB1dGlsKSB7DQogICAgICAgICAgICBpZiAoYXJncy5CMCkgew0KICAgICAgICAgICAgICAgIHRoaXMuZ2xvYmFsQ29kZUJ1ZmZlciArPSBhcmdzLkIwICsgIiB7XG4iOw0KICAgICAgICAgICAgfQ0KICAgICAgICAgICAgdXRpbC5zdGFydEJyYW5jaCgxLCB0cnVlKTsNCiAgICAgICAgICAgIHRoaXMuZ2xvYmFsQ29kZUJ1ZmZlciArPSAifVxuIjsNCiAgICAgICAgICAgIHJldHVybiB0cnVlOw0KICAgICAgICB9DQoNCiAgICAgICAgZ2V0Q29kZSgpIHsNCiAgICAgICAgICAgIHJldHVybiB0aGlzLmdsb2JhbENvZGVCdWZmZXI7DQogICAgICAgIH0NCg0KICAgICAgICBldmFsQ29kZShhcmdzLCB1dGlsKSB7DQogICAgICAgICAgICBpZiAoIXRoaXMuZ2xvYmFsQ29kZUJ1ZmZlci50cmltKCkpIHsNCiAgICAgICAgICAgICAgICByZXR1cm47DQogICAgICAgICAgICB9DQoNCiAgICAgICAgICAgIHRyeSB7DQogICAgICAgICAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoY29udGV4dCwgdXRpbCkgew0KICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZhbCh0aGlzLmdsb2JhbENvZGVCdWZmZXIpOw0KICAgICAgICAgICAgICAgIH0pLmNhbGwodGhpcywgY29udGV4dCwgdXRpbCk7DQogICAgICAgICAgICB9IGNhdGNoIChlcnIpIHsNCiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCJFdmFsIEVycm9yOiIsIGVycik7DQogICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcigNCiAgICAgICAgICAgICAgICAgICAgIkdlbmVyYXRlZCBjb2RlOlxuIiArDQogICAgICAgICAgICAgICAgICAgIHRoaXMuZ2xvYmFsQ29kZUJ1ZmZlcg0KICAgICAgICAgICAgICAgICk7DQogICAgICAgICAgICB9DQogICAgICAgIH0NCg0KICAgICAgICBjbGVhckNvZGUoKSB7DQogICAgICAgICAgICB0aGlzLmdsb2JhbENvZGVCdWZmZXIgPSAiIjsNCiAgICAgICAgfQ0KICAgIH0NCg0KICAgIFNjcmF0Y2guZXh0ZW5zaW9ucy5yZWdpc3RlcigNCiAgICAgICAgbmV3IEpTQmxvY2tzRXh0ZW5zaW9uKFNjcmF0Y2gudm0pDQogICAgKTsNCg0KfSkoU2NyYXRjaCk7"
        },

        meta: {
            semver: "3.0.0",
            vm: "0.2.0",
            agent: "",
            platform: {
                name: "JSBlocks",
                url: "https://kylekart.github.io/jsblocks/nb"
            }
        }
    };

    const spriteBlocks = projectJson.targets[1].blocks;
    const topBlocks = workspace.getTopBlocks(true);

    let idCounter = 0;

    const generateId = () => `jsb${idCounter++}`;

    const idMap = new Map();

    const getOpcode = block => {
        if (block.type === 'js_hat') {
            return 'event_whenflagclicked';
        }

        return block.type;
    };

    /*
     * Some Blockly input names need to become the names
     * used by the Scratch project format.
     */
    const getScratchInputName = (block, input) => {
        if (block.type === 'js_cblock') {
            if (input.name === 'DO0') {
                return 'SUBSTACK';
            }

            if (input.name.startsWith('B0_')) {
                return 'B0';
            }
        }

        return input.name;
    };

    /*
     * FIRST PASS
     *
     * Register absolutely every Blockly block.
     *
     * Nothing gets deleted here.
     */
    const registerBlocks = block => {
        if (!block || idMap.has(block.id)) {
            return;
        }

        const scratchId = generateId();

        idMap.set(block.id, scratchId);

        const isTopLevel = !block.getParent();

        let x = 0;
        let y = 0;

        if (
            isTopLevel &&
            typeof block.getRelativeToSurfaceXY === 'function'
        ) {
            const pos = block.getRelativeToSurfaceXY();

            x = Math.round(pos.x);
            y = Math.round(pos.y);
        }

        spriteBlocks[scratchId] = {
            opcode: getOpcode(block),
            next: null,
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: isTopLevel,
            ...(isTopLevel ? { x, y } : {})
        };

        /*
         * This is important:
         * getChildren() includes the blocks nested inside inputs.
         */
        block.getChildren(false).forEach(child => {
            registerBlocks(child);
        });
    };

    /*
     * Register EVERYTHING before doing any linking.
     */
    topBlocks.forEach(registerBlocks);

    /*
     * SECOND PASS
     *
     * Build next/parent/input relationships.
     */
    const linkBlockStructure = block => {
        if (!block) {
            return;
        }

        const scratchId = idMap.get(block.id);

        if (!scratchId) {
            return;
        }

        const scratchBlock = spriteBlocks[scratchId];

        /*
         * NEXT CONNECTION
         */
        const nextBlock = block.getNextBlock();

        if (nextBlock) {
            const nextScratchId = idMap.get(nextBlock.id);

            if (nextScratchId) {
                scratchBlock.next = nextScratchId;
                spriteBlocks[nextScratchId].parent = scratchId;
            }
        }

        /*
         * INPUTS
         */
        block.inputList.forEach(input => {
            if (!input.connection) {
                return;
            }

            const targetBlock = input.connection.targetBlock();

            if (!targetBlock) {
                return;
            }

            const targetScratchId = idMap.get(targetBlock.id);

            if (!targetScratchId) {
                return;
            }

            const inputName = getScratchInputName(block, input);

            spriteBlocks[targetScratchId].parent = scratchId;

            /*
             * js_expr is stored as an inline string input.
             *
             * Example:
             *
             * "EXPR": [
             *     1,
             *     [10, "if (true)"]
             * ]
             */
            if (targetBlock.type === 'js_expr') {
                const field = targetBlock.getField('EXPR');

                const value = field
                    ? field.getValue()
                    : '';

                scratchBlock.inputs[inputName] = [
                    1,
                    [10, value]
                ];

                return;
            }

            /*
             * Statement inputs.
             *
             * Your valid project uses 2 for these.
             */
            if (
                input.type === Blockly.NEXT_STATEMENT ||
                inputName === 'SUBSTACK' ||
                inputName === 'B0' ||
                inputName.startsWith('DO') ||
                inputName.startsWith('ADD')
            ) {
                scratchBlock.inputs[inputName] = [
                    2,
                    targetScratchId
                ];

                return;
            }

            /*
             * Normal value input.
             */
            if (input.type === Blockly.INPUT_VALUE) {
                scratchBlock.inputs[inputName] = [
                    1,
                    targetScratchId
                ];
            }
        });

        /*
         * Recurse into ALL children.
         */
        block.getChildren(false).forEach(child => {
            linkBlockStructure(child);
        });
    };

    topBlocks.forEach(linkBlockStructure);

    /*
     * ---------------------------------------------------------
     * INSERT clearCode AFTER THE GREEN FLAG
     * ---------------------------------------------------------
     */

    const hat = topBlocks.find(block => block.type === 'js_hat');

    if (!hat) {
        console.error('No js_hat block found.');
        return;
    }

    const hatId = idMap.get(hat.id);

    if (!hatId) {
        console.error('Could not find exported hat.');
        return;
    }

    const oldHatNext = spriteBlocks[hatId].next;

    const clearId = generateId();

    spriteBlocks[clearId] = {
        opcode: 'js_clearCode',
        next: oldHatNext,
        parent: hatId,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false
    };

    spriteBlocks[hatId].next = clearId;

    if (oldHatNext && spriteBlocks[oldHatNext]) {
        spriteBlocks[oldHatNext].parent = clearId;
    }

    /*
     * ---------------------------------------------------------
     * INSERT evalCode AT THE VERY END
     * ---------------------------------------------------------
     */

    let lastId = hatId;

    while (
        spriteBlocks[lastId] &&
        spriteBlocks[lastId].next
    ) {
        lastId = spriteBlocks[lastId].next;
    }

    const evalId = generateId();

    spriteBlocks[evalId] = {
        opcode: 'js_evalCode',
        next: null,
        parent: lastId,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false
    };

    spriteBlocks[lastId].next = evalId;

    /*
     * ---------------------------------------------------------
     * SVGs
     * ---------------------------------------------------------
     */

    const defaultStageSvg =
        `<svg version="1.1" width="480" height="360" xmlns="http://www.w3.org/2000/svg"></svg>`;

    const defaultSpriteSvg =
        `<svg version="1.1" width="480" height="360" xmlns="http://www.w3.org/2000/svg"></svg>`;

    zip.file(
        "project.json",
        JSON.stringify(projectJson, null, 2)
    );

    zip.file(
        "cd21514d0531fdffb22204e0ec5ed84a.svg",
        defaultStageSvg
    );

    zip.file(
        "4d45a484633a5369e85831f9cb9c7a4e.svg",
        defaultSpriteSvg
    );

    try {
        const content = await zip.generateAsync({
            type: "blob"
        });

        const url = URL.createObjectURL(content);

        const a = document.createElement('a');

        a.href = url;
        a.download = 'project.sb3';

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (error) {
        console.error('Failed to generate SB3:', error);
    }
});