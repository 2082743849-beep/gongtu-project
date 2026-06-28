var fs = require('fs');
var path = "C:/Users/jiang'yun'xin/Desktop/知识就是力量/融合版/ui尝试改进首页 - workbuddy跑/智学成语-高级版.html";
var html = fs.readFileSync(path, 'utf8');

// 1. Check detail grid has 4 levels (level-1 to level-4), not 5
var lightLevels = html.match(/\.heatmap-cell\.level-\d+\s*\{[^}]*background:/g);
console.log('=== 详情格子色阶（全局）===');
if (lightLevels) lightLevels.forEach(function(l) { console.log('  ' + l.trim()); });

var darkLevels = html.match(/\.heatmap-cell\.level-\d+.*!important/g);
console.log('\n=== 详情格子色阶（.app-section）===');
if (darkLevels) darkLevels.forEach(function(l) { console.log('  ' + l.trim()); });

// 2. Check JS thresholds
var threshMatch = html.match(/if \(cnt >= 1\) lv = 1;[^;]+;/);
console.log('\n=== JS 阈值 ===');
if (threshMatch) console.log('  ' + threshMatch[0]);

// 3. Check bar chart colors (light mode)
var barLight = html.match(/\.heatmap-bar\.bar-(none|low|mid|high)\s*\{[^}]*background:/g);
console.log('\n=== 柱状图颜色（全局）===');
if (barLight) barLight.forEach(function(l) { console.log('  ' + l.trim()); });

// 4. Check bar chart colors (dark mode / .app-section)
var barDark = html.match(/\.heatmap-bar\.bar-(none|low|mid|high).*!important/g);
console.log('\n=== 柱状图颜色（.app-section）===');
if (barDark) barDark.forEach(function(l) { console.log('  ' + l.trim()); });

// 5. JS syntax check
var idx = html.lastIndexOf('<script>');
if (idx !== -1) {
  var m = html.substring(idx).match(/^<script>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      new Function(m[1]);
      console.log('\n✅ JS syntax OK');
    } catch(e) {
      console.log('\n❌ SYNTAX ERROR:', e.message);
    }
  }
}

// 6. Check that level-5 does NOT exist
var hasLevel5 = html.indexOf('level-5') !== -1;
console.log('\nlevel-5 是否存在（应该不存在）: ' + (hasLevel5 ? '❌ 还存在！' : '✅ 已删除'));
