module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add a plugin to transform react_1.use to react_1.useContext
      function() {
        return {
          visitor: {
            CallExpression(path) {
              // Transform (0, react_1.use)(...) to (0, react_1.useContext)(...)
              if (
                path.node.callee.type === 'SequenceExpression' &&
                path.node.callee.expressions.length === 2 &&
                path.node.callee.expressions[0].type === 'NumericLiteral' &&
                path.node.callee.expressions[0].value === 0 &&
                path.node.callee.expressions[1].type === 'MemberExpression' &&
                path.node.callee.expressions[1].object.name === 'react_1' &&
                path.node.callee.expressions[1].property.name === 'use'
              ) {
                path.node.callee.expressions[1].property.name = 'useContext';
                console.log('[Babel Plugin] Transformed react_1.use to react_1.useContext');
              }
            }
          }
        };
      }
    ]
  };
};
