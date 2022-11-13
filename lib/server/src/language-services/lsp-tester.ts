import { getLanguageServiceManagerInstance } from "./language-services";


const TEST_INPUT_FILE = "/home/matsu/Projects/custom-elements-language-server/lib/server/test-project/src/test.ts";

const langService = getLanguageServiceManagerInstance();

console.log("Loading file ");
langService.getLanguageServiceForCurrentFile(TEST_INPUT_FILE)
console.log("Loading file again");
langService.getLanguageServiceForCurrentFile(TEST_INPUT_FILE)
