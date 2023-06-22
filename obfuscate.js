const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const inputDir = path.join(__dirname, 'api', 'static', 'clean-js');
const outputDir = path.join(__dirname, 'api', 'static', 'js');

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Obfuscate each JavaScript file in the input directory
fs.readdirSync(inputDir).forEach((file) => {
  if (path.extname(file) === '.js') {
    const inputFile = path.join(inputDir, file);
    const outputFile = path.join(outputDir, file);

    const inputCode = fs.readFileSync(inputFile, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(inputCode);

    fs.writeFileSync(outputFile, obfuscationResult.getObfuscatedCode());
    console.log(`Obfuscated file: ${outputFile}`);
  }
});