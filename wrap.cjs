const fs = require('fs');
let content = fs.readFileSync('src/pages/AuthPage.jsx', 'utf8');

const blocks = [
  "if (sessionUser && currentTab === 'overview')",
  "if (currentTab === 'coupons')",
  "if (sessionUser && currentTab === 'orders')",
  "if (sessionUser && currentTab === 'wishlist')",
  "if (currentTab === 'settings')",
  "if (!showAuthForm)" // wait, showAuthForm is the unauthenticated overview, we should also wrap it? No, unauth doesn't have sidebar.
];

blocks.forEach(block => {
  if (block === "if (!showAuthForm)") return;
  const startIndex = content.indexOf(block + " {");
  if (startIndex === -1) return;
  const returnIndex = content.indexOf("return (", startIndex);
  if (returnIndex === -1) return;
  
  // replace "return (" with "return wrapContent("
  content = content.substring(0, returnIndex) + "return wrapContent(" + content.substring(returnIndex + 8);
  
  // find the matching end of the return statement
  // we know it ends with ");\n  }" before the next block
  // Let's find the first ");\n  }" after returnIndex
  const endIndex = content.indexOf(");\n  }", returnIndex);
  if (endIndex !== -1) {
    content = content.substring(0, endIndex) + "));\n  }" + content.substring(endIndex + 6);
  }
});

fs.writeFileSync('src/pages/AuthPage.jsx', content);
