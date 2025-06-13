const fs = require('fs');

const printAffectedPluginsSection = require('./levitate-show-affected-plugins');

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

const printSection = (title, items) => {
  let output = `<h4>${title}</h4>`;
  items.forEach((item) => {
    const language = item.declaration ? 'typescript' : 'diff';
    const code = item.declaration ? item.declaration : stripAnsi(item.diff);

    output += `<b>${item.name}</b><br>\n`;
    output += `<sub>${item.location}</sub><br>\n`;
    output += `<pre lang="${language}">\n${code}\n</pre><br>\n`;
  });
  return output;
};

let markdown = '';
const filteredChanges = data.changes.filter((change) => change?.diff?.length > 0);

if (data.removals.length > 0) {
  markdown += printSection('Removals', filteredRemovals);
}
if (filteredChanges.length > 0) {
  markdown += printSection('Changes', filteredChanges);
}

if (data.removals.length > 0 || filteredChanges.length > 0) {
  markdown += printAffectedPluginsSection({
    removals: data.removals,
    changes: filteredChanges,
  });
}

console.log(markdown);
