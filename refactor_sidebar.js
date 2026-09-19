const fs = require('fs');
const file = 'src/components/app-shell/app-sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the collapsed return block
const collapsedStartStr = 'if (collapsed) {\n    return (';
const collapsedStartIndex = content.indexOf(collapsedStartStr);

const collapsedEndStr = '      </aside>\n    );\n  }\n\n  return (';
const collapsedEndIndex = content.indexOf(collapsedEndStr);

if (collapsedStartIndex === -1 || collapsedEndIndex === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

// Extract collapsed content (inside the <aside>)
const collapsedBlock = content.substring(collapsedStartIndex, collapsedEndIndex + collapsedEndStr.length);
const collapsedInnerStart = collapsedBlock.indexOf('<Link href="/chat"');
const collapsedInnerEnd = collapsedBlock.lastIndexOf('</aside>');
const collapsedInner = collapsedBlock.substring(collapsedInnerStart, collapsedInnerEnd).trim();

// Now extract the expanded content (inside the <aside> of the main return)
const expandedStartStr = '  return (\n    <aside className={cn("hidden h-[calc(100vh-1rem)] w-[230px] shrink-0 flex-col border border-border/40 bg-surface/40 backdrop-blur-xl rounded-2xl my-2 mx-2 lg:flex shadow-lg transition-transform duration-300 ease-in-out z-40", historySidebarOpen ? "-translate-x-[110%] absolute" : "translate-x-0 relative")}>\n';
const expandedStartIndex = content.indexOf(expandedStartStr);
const expandedInnerStart = expandedStartIndex + expandedStartStr.length;
const expandedInnerEnd = content.lastIndexOf('</aside>');
const expandedInner = content.substring(expandedInnerStart, expandedInnerEnd).trim();

// Build the new return statement
const newReturn = `  return (
    <aside className={cn(
      "hidden h-[calc(100vh-1rem)] shrink-0 flex-col border border-border/40 bg-surface/40 backdrop-blur-xl rounded-2xl my-2 mx-2 lg:flex shadow-lg transition-all duration-300 ease-in-out z-40 overflow-hidden relative",
      collapsed ? "w-[68px] items-center py-4" : "w-[230px]",
      historySidebarOpen ? (collapsed ? "-translate-x-[150%] absolute" : "-translate-x-[110%] absolute") : "translate-x-0 relative"
    )}>
      {collapsed ? (
        <>
          ${collapsedInner.split('\n').join('\n          ')}
        </>
      ) : (
        <>
          ${expandedInner.split('\n').join('\n          ')}
        </>
      )}
    </aside>
  );
}
`;

// Replace everything from if (collapsed) to the end of the file
const beforeIf = content.substring(0, collapsedStartIndex);
fs.writeFileSync(file, beforeIf + newReturn);
console.log("Done");
