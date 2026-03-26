const fs = require('fs');
const glob = require('glob');

glob.sync('src/components/**/*.tsx').forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import React from ['"]react['"];?/g, '');
  content = content.replace(/import React, \{([^}]+)\} from ['"]react['"];?/g, "import {$1} from 'react';");
  fs.writeFileSync(file, content);
});

glob.sync('src/pages/**/*.tsx').forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import React from ['"]react['"];?/g, '');
  content = content.replace(/import React, \{([^}]+)\} from ['"]react['"];?/g, "import {$1} from 'react';");
  fs.writeFileSync(file, content);
});

console.log('React removed');