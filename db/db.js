const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "data.json");

function readJSONFile() {
  try {
    const fileContent = fs.readFileSync(dbPath, "utf8");
    // Check if the file is empty and return a default value or handle accordingly
    if (!fileContent) {
      console.log("File is empty, returning default value.");
      return []; // Or any other default value appropriate for your application
    }
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error);
    // Return a default value or rethrow the error depending on your error handling strategy
    return [];
  }
}

const writeJSONFile = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

module.exports = { readJSONFile, writeJSONFile };
