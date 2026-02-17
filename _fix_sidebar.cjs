const fs = require('fs');
const p = 'C:/Users/grim/bounty/apps/web/src/components/dual-sidebar/sidebar.tsx';
let c = fs.readFileSync(p, 'utf8');
const nl = '\r\n';

// Replace renderNavItems declaration
const oldNav = 'const renderNavItems = (' + nl + '  items: ReturnType<typeof mainNavItems>,' + nl + '  pathname: string | null' + nl + ') => {';
const newNav = 'function NavItems({ items, pathname }: { items: ReturnType<typeof mainNavItems>; pathname: string | null }) {';
c = c.replace(oldNav, newNav);

// Fix closing of NavItems (}; -> })
c = c.replace('    </SidebarMenu>' + nl + '  );' + nl + '};' + nl + nl + 'function SettingsNav',
              '    </SidebarMenu>' + nl + '  );' + nl + '}' + nl + nl + 'function SettingsNav');

// Replace renderSettingsNav declaration
const oldSet = 'const renderSettingsNav = (' + nl + '  sections: ReturnType<typeof settingsNavSections>,' + nl + '  pathname: string | null' + nl + ') => {';
const newSet = 'function SettingsNav({ sections, pathname }: { sections: ReturnType<typeof settingsNavSections>; pathname: string | null }) {';
c = c.replace(oldSet, newSet);

// Fix closing of SettingsNav (}; -> })  
c = c.replace('    </>' + nl + '  );' + nl + '};' + nl + nl + '// ====',
              '    </>' + nl + '  );' + nl + '}' + nl + nl + '// ====');

// Replace usages
c = c.replace('{renderSettingsNav(settingsNav, pathname)}', '<SettingsNav sections={settingsNav} pathname={pathname} />');
c = c.replace('{renderNavItems(mainNav, pathname)}', '<NavItems items={mainNav} pathname={pathname} />');

fs.writeFileSync(p, c);
console.log('NavItems:', c.includes('function NavItems'));
console.log('SettingsNav:', c.includes('function SettingsNav'));
console.log('old renderNavItems gone:', !c.includes('renderNavItems'));
console.log('old renderSettingsNav gone:', !c.includes('renderSettingsNav'));
