Blockly.Blocks['js_generic'] = {
    init() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput("console.log('Hello World!')"), "CODE");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(230);
    }
};

Blockly.Blocks['js_cblock'] = {
    init() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput("if (true)"), "HEADER");
        this.appendStatementInput("DO");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(120);
    }
};

Blockly.Blocks['js_hat'] = {
    init() {
        this.appendDummyInput().appendField("Run");
        this.appendStatementInput("DO");
        this.setColour(300);
    }
};

const jsGen = Blockly.JavaScript;
jsGen.forBlock = jsGen.forBlock || {};

jsGen.forBlock['js_generic'] = (block) => {
    const code = block.getFieldValue('CODE') || '';
    return code ? code + ';\n' : '';
};

jsGen.forBlock['js_cblock'] = (block, generator) => {
    const header = block.getFieldValue('HEADER') || '';
    const body = generator.statementToCode(block, 'DO');
    return `${header} {\n${body}}\n`;
};

jsGen.forBlock['js_hat'] = (block, generator) => {
    return generator.statementToCode(block, 'DO');
};

const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    trashcan: true,
    zoom: {
        controls: true,
        wheel: true,
        startScale: 1,
        maxScale: 3,
        minScale: 0.4
    },
    move: {
        scrollbars: true,
        drag: true,
        wheel: true
    },
    grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
    },
    renderer: 'geras',
    plugins: {
        backpack: Blockly.WorkspaceBackpack
    }
});

function runUserCode(userCode) {
    const canvas = document.getElementById('stage');
    const stage = canvas.getContext('2d');

    function clear() {
        stage.clearRect(0, 0, canvas.width, canvas.height);
    }

    const keys = {};

    window.addEventListener('keydown', e => {
        keys[e.key] = true;
    });

    window.addEventListener('keyup', e => {
        keys[e.key] = false;
    });

    function keyDown(key) {
        return !!keys[key];
    }

    const api = {
        stage,
        width: canvas.width,
        height: canvas.height,
        clear,
        keys,
        keyDown
    };

    const fn = new Function(
        'api',
        `
      const { stage, width, height, clear, keys, keyDown } = api;
      ${userCode}
    `
    );

    fn(api);
}

function loadJSIntoBlocks(jsCode) {
  workspace.clear();

  jsCode = jsCode
    .replace(/\r\n/g, '\n')
    .trim();

  const hat = workspace.newBlock('js_hat');
  hat.initSvg();
  hat.render();

  let currentParent = hat;
  let lastBlock = null;

  const lines = jsCode.split('\n');
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) { i++; continue; }

    if (line.endsWith('{')) {
      const header = line.slice(0, -1).trim();

      const cblock = workspace.newBlock('js_cblock');
      cblock.setFieldValue(header, 'HEADER');
      cblock.initSvg();
      cblock.render();

      if (!lastBlock) {
        currentParent.getInput('DO').connection.connect(cblock.previousConnection);
      } else {
        lastBlock.nextConnection.connect(cblock.previousConnection);
      }

      i++;
      let depth = 1;
      let bodyLines = [];

      while (i < lines.length && depth > 0) {
        let l = lines[i];
        if (l.includes('{')) depth++;
        if (l.includes('}')) depth--;
        if (depth > 0) bodyLines.push(l.trim());
        i++;
      }

      let prev = null;
      bodyLines.forEach(bl => {
        if (!bl) return;
        const g = workspace.newBlock('js_generic');
        g.setFieldValue(bl.replace(/;$/, ''), 'CODE');
        g.initSvg();
        g.render();

        if (!prev) {
          cblock.getInput('DO').connection.connect(g.previousConnection);
        } else {
          prev.nextConnection.connect(g.previousConnection);
        }
        prev = g;
      });

      lastBlock = cblock;
      continue;
    }

    const g = workspace.newBlock('js_generic');
    g.setFieldValue(line.replace(/;$/, ''), 'CODE');
    g.initSvg();
    g.render();

    if (!lastBlock) {
      currentParent.getInput('DO').connection.connect(g.previousConnection);
    } else {
      lastBlock.nextConnection.connect(g.previousConnection);
    }

    lastBlock = g;
    i++;
  }
}

document.getElementById('menuRun').addEventListener('click', () => {
    let code = '';
    workspace.getTopBlocks(true).forEach(block => {
        if (block.type === 'js_hat') {
            code += jsGen.forBlock['js_hat'](block, jsGen);
        }
    });
    console.log('Generated JS:\n' + code);
    try { runUserCode(code); } catch (e) { alert(e.message); }
});

document.getElementById('menuSave').addEventListener('click', () => {
    const jsonObj = Blockly.serialization.workspaces.save(workspace);
    const jsonText = JSON.stringify(jsonObj, null, 2);

    const filename = prompt("Enter filename to save:", "jblocks_workspace.json");
    if (!filename) return;

    const blob = new Blob([jsonText], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.json') ? filename : filename + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
});

document.getElementById('menuLoad').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            try {
                const jsonObj = JSON.parse(event.target.result);
                workspace.clear();
                Blockly.serialization.workspaces.load(jsonObj, workspace);
            } catch (err) {
                alert("Error loading JSON: " + err.message);
                console.error("Error loading JSON:", err);
            }
        };

        reader.readAsText(file);
    };
    input.click();
});