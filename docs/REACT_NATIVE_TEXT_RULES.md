# React Native Text Rendering Rules

## 🎯 Golden Rule

**All text in React Native MUST be wrapped in a `<Text>` component.**

## ❌ Common Mistakes

### 1. Raw String in View
```typescript
// ❌ WRONG
<View>Hello World</View>

// ✅ CORRECT
<View>
  <Text>Hello World</Text>
</View>
```

### 2. Conditional Text
```typescript
// ❌ WRONG
<View>
  {isError && "An error occurred"}
</View>

// ✅ CORRECT
<View>
  {isError && <Text>An error occurred</Text>}
</View>

// ✅ ALSO CORRECT
<View>
  {isError ? <Text>An error occurred</Text> : null}
</View>
```

### 3. Text in Pressable/TouchableOpacity
```typescript
// ❌ WRONG
<Pressable>
  Click me
</Pressable>

// ✅ CORRECT
<Pressable>
  <Text>Click me</Text>
</Pressable>
```

### 4. Template Literals
```typescript
// ❌ WRONG
<View>
  {`Count: ${count}`}
</View>

// ✅ CORRECT
<View>
  <Text>{`Count: ${count}`}</Text>
</View>
```

### 5. Lone Punctuation
```typescript
// ❌ WRONG
<View>.</View>

// ✅ CORRECT
<View>
  <Text>.</Text>
</View>
```

## 🛡️ ESLint Protection

We use `eslint-plugin-react-native` with the `no-raw-text` rule:

```bash
npm run lint
```

This will catch raw text at development time before it causes runtime errors.

## 🔍 Why This Rule Exists

React Native is not HTML. It doesn't have a DOM. Text rendering is handled differently:

- **Web:** `<div>text</div>` works because browsers handle text nodes
- **Native:** Text must be explicitly rendered using platform-specific text components
- **React Native:** `<Text>` is the cross-platform abstraction for text rendering

## 📚 Valid Text Containers

Only these components can contain text directly:

- `<Text>`
- `<TextInput>` (for placeholder and value)

All other components (`View`, `Pressable`, `TouchableOpacity`, `ScrollView`, etc.) require text to be wrapped in `<Text>`.

## 🎨 Styling Text

```typescript
// Text with styles
<Text style={styles.heading}>
  Welcome
</Text>

// Nested text for different styles
<Text style={styles.paragraph}>
  This is <Text style={styles.bold}>bold</Text> text.
</Text>

// Text with inline styles
<Text style={{ color: '#333', fontSize: 16 }}>
  Styled text
</Text>
```

## 🔗 More Information

- [React Native Text Component](https://reactnative.dev/docs/text)
- [ESLint Plugin React Native](https://github.com/Intellicode/eslint-plugin-react-native)
