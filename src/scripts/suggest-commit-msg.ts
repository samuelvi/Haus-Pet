import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';

async function generateCommitPrompt() {
  try {
    // Get the list of staged files
    const { stdout: stagedFilesOutput } = await execa('git', ['diff', '--staged', '--name-only']);
    const stagedFiles = stagedFilesOutput.split('\n').filter(file => file.trim() !== '');

    if (stagedFiles.length === 0) {
      console.log('No staged files found. Please stage your changes before running this script.');
      return;
    }

    let prompt = 'Based on the following staged files and their content, please suggest a Conventional Commit message. Remember to follow the format: <type>(<scope>): <subject>\n\n';

    prompt += 'Staged files:\n';
    stagedFiles.forEach(file => {
      prompt += `- ${file}\n`;
    });

    prompt += '\n--- START OF FILE CONTENTS ---\n';

    for (const file of stagedFiles) {
      try {
        const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
        prompt += `\n--- File: ${file} ---\n`;
        prompt += content.substring(0, 2000); // Limit content to avoid being too long
        prompt += '\n--- End of File: ${file} ---\n';
      } catch (error) {
        prompt += `\n--- Could not read file: ${file} ---\n`;
      }
    }
    prompt += '\n--- END OF FILE CONTENTS ---\n';

    console.log('\n-------------------- COPY THE PROMPT BELOW AND PASTE IT TO THE AI --------------------\n');
    console.log(prompt);
    console.log('\n------------------------------------ END OF PROMPT ------------------------------------\n');

  } catch (error) {
    console.error('An error occurred while generating the commit prompt:', error);
  }
}

generateCommitPrompt();
