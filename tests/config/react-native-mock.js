// Mock React Native for Jest tests
module.exports = {
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'web', select: (obj) => obj.default || obj.web },
};
