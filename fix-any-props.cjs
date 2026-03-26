const fs = require('fs');
const glob = require('glob');

glob.sync('src/components/**/*.tsx').forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/export type ([A-Za-z]+Props) = .*?;/g, "export type $1 = any;");
  fs.writeFileSync(file, content);
});

console.log('Props set to any');