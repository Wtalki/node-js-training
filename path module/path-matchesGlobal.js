import minimatch from 'minimatch';

const result = minimatch('src/App.vue', '**/*.vue');
console.log(result); // 👉 true
