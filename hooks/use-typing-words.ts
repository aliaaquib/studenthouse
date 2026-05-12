"use client";

import { useEffect, useState } from "react";

export function useTypingWords(words: string[], typingSpeed = 95, deletingSpeed = 55, pause = 900) {
  const [typedWord, setTypedWord] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex] ?? "";
    const isWordComplete = typedWord === currentWord;
    const isWordDeleted = typedWord.length === 0;

    const timeout = window.setTimeout(() => {
      if (!deleting && !isWordComplete) {
        setTypedWord(currentWord.slice(0, typedWord.length + 1));
        return;
      }

      if (!deleting && isWordComplete) {
        setDeleting(true);
        return;
      }

      if (deleting && !isWordDeleted) {
        setTypedWord(currentWord.slice(0, typedWord.length - 1));
        return;
      }

      setDeleting(false);
      setWordIndex((index) => (index + 1) % words.length);
    }, isWordComplete && !deleting ? pause : deleting ? deletingSpeed : typingSpeed);

    return () => window.clearTimeout(timeout);
  }, [deleting, deletingSpeed, pause, typedWord, typingSpeed, wordIndex, words]);

  return typedWord;
}
