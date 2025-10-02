import React, { ElementType, ReactNode, createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';

export interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string | ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
  testID?: string;
}

export default function TextType({
  text,
  as: Component = View as unknown as ElementType,
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 500,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  testID = 'text-type',
  ...props
}: TextTypeProps & { [key: string]: unknown }) {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);
  // startOnVisible is web-only in this implementation; native starts immediately
  const [isVisible, setIsVisible] = useState<boolean>(!startOnVisible || Platform.OS !== 'web');
  const cursorOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  const containerRef = useRef<View | null>(null);

  const textArray = useMemo<string[]>(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback((): number => {
    if (!variableSpeed) return typingSpeed;
    const min = Math.min(variableSpeed.min, variableSpeed.max);
    const max = Math.max(variableSpeed.min, variableSpeed.max);
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = useCallback((): string => {
    if (!textColors || textColors.length === 0) return '#111827';
    return textColors[currentTextIndex % textColors.length] ?? '#111827';
  }, [textColors, currentTextIndex]);

  useEffect(() => {
    if (!showCursor) return;
    const durationMs = cursorBlinkDuration <= 10 ? cursorBlinkDuration * 1000 : cursorBlinkDuration;
    console.log('[TextType] Starting cursor blink animation with duration (ms):', durationMs);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: durationMs, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: durationMs, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => {
      console.log('[TextType] Stopping cursor blink animation');
      loop.stop();
    };
  }, [showCursor, cursorBlinkDuration, cursorOpacity]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const currentText = textArray[currentTextIndex] ?? '';
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const run = () => {
      if (isDeleting) {
        if (displayedText.length === 0) {
          console.log('[TextType] Finished deleting, moving to next text index', currentTextIndex);
          setIsDeleting(false);
          if (onSentenceComplete) onSentenceComplete(textArray[currentTextIndex] ?? '', currentTextIndex);
          if (currentTextIndex === textArray.length - 1 && !loop) return;
          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          const delay = variableSpeed ? getRandomSpeed() : typingSpeed;
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev + processedText[currentCharIndex]);
            setCurrentCharIndex((prev) => prev + 1);
          }, delay);
        } else if (textArray.length > 1) {
          timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText.length === 0) {
      console.log('[TextType] Initial delay before starting typing:', initialDelay);
      timeout = setTimeout(run, initialDelay);
    } else {
      run();
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isVisible, isDeleting, displayedText, currentCharIndex, textArray, currentTextIndex, loop, pauseDuration, deletingSpeed, typingSpeed, initialDelay, reverseMode, variableSpeed, getRandomSpeed, onSentenceComplete]);

  useEffect(() => {
    if (!(startOnVisible && Platform.OS === 'web')) return;
    try {
      const el: any = containerRef.current as any;
      // On web, RNW views are real DOM nodes
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const node = el && ('nodeType' in el ? el : el?._node);
      if (!node) {
        setIsVisible(true);
        return;
      }
      const io = new (window as any).IntersectionObserver((entries: any[]) => {
        entries.forEach((entry: any) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      }, { threshold: 0.1 });
      io.observe(node);
      return () => io.disconnect();
    } catch {
      setIsVisible(true);
    }
  }, [startOnVisible]);

  const shouldHideCursor = hideCursorWhileTyping && (currentCharIndex < (textArray[currentTextIndex]?.length ?? 0) || isDeleting);

  const content = (
    <View style={styles.row}>
      <Text style={[styles.text, { color: getCurrentTextColor() }]} testID={`${testID}-content`}>
        {displayedText}
      </Text>
      {showCursor && (
        <Animated.Text
          accessibilityElementsHidden={shouldHideCursor}
          style={[styles.cursor, { opacity: shouldHideCursor ? 0 : cursorOpacity }]}
          testID={`${testID}-cursor`}
        >
          {typeof cursorCharacter === 'string' ? cursorCharacter : '|'}
        </Animated.Text>
      )}
    </View>
  );

  if (Component === (View as unknown as ElementType)) {
    return (
      <View ref={containerRef} style={styles.container} testID={testID}>
        {content}
      </View>
    );
  }

  return createElement(
    Component,
    { ref: containerRef as unknown as React.Ref<any>, style: styles.container, testID },
    content,
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'baseline' },
  text: { fontSize: 16, fontWeight: '700' as const },
  cursor: { fontSize: 16, marginLeft: 2 },
});
