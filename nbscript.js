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
        vmFrame.contentWindow.postMessage({
            type: "eval",
            code: userCode
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
  if (e.data.type === "eval") { /* VM handles internal eval */ }
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
        if (line.endsWith('{')) {
            const headerText = line.slice(0, -1).trim();
            const cblock = workspace.newBlock('js_cblock');
            cblock.initSvg();
            cblock.render();
            
            const exprBlock = workspace.newBlock('js_expr');
            exprBlock.setFieldValue(headerText, 'EXPR');
            exprBlock.initSvg();
            exprBlock.render();
            cblock.getInput('B0_ADD0').connection.connect(exprBlock.outputConnection);

            if (!lastBlock) parentBlock.getInput('DO').connection.connect(cblock.previousConnection);
            else lastBlock.nextConnection.connect(cblock.previousConnection);
            
            let depth = 1;
            let j = i + 1;
            while (j < end && depth > 0) {
                if (lines[j].includes('{')) depth++;
                if (lines[j].includes('}')) depth--;
                j++;
            }
            parseBlock(lines, i + 1, j - 1, cblock);
            lastBlock = cblock;
            i = j;
            continue;
        }
        if (line === '}') return;
        
        const g = workspace.newBlock('js_generic');
        g.initSvg();
        g.render();
        
        const exprBlock = workspace.newBlock('js_expr');
        exprBlock.setFieldValue(line.replace(/;$/, ''), 'EXPR');
        exprBlock.initSvg();
        exprBlock.render();
        g.getInput('ADD0').connection.connect(exprBlock.outputConnection);

        if (!lastBlock) parentBlock.getInput('DO').connection.connect(g.previousConnection);
        else lastBlock.nextConnection.connect(g.previousConnection);
        lastBlock = g;
        i++;
    }
}

document.getElementById('menuRun').addEventListener('click', () => {
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