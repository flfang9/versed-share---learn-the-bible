import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Share,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useChapter } from "@/utils/bible/useChapter";
import { useDeviceId } from "@/utils/bible/useDeviceId";
import { useHighlights } from "@/utils/bible/useHighlights";
import { useFavorites } from "@/utils/bible/useFavorites";
import { useChatVerses } from "@/utils/bible/useChatVerses";
import { useLastLocation } from "@/utils/bible/useLastLocation";
import { BibleHeader } from "@/components/BibleReader/BibleHeader";
import { SettingsPanel } from "@/components/BibleReader/SettingsPanel";
import { VerseList } from "@/components/BibleReader/VerseList";
import { VerseActionBar } from "@/components/BibleReader/VerseActionBar";
import { HighlightModal } from "@/components/BibleReader/HighlightModal";
import { BookChapterModal } from "@/components/BibleReader/BookChapterModal";
import { VersionModal } from "@/components/BibleReader/VersionModal";
import { JourneyBanner } from "@/components/BibleReader/JourneyBanner";
import { DayContextCard } from "@/components/BibleReader/DayContextCard";
import { ReflectionCard } from "@/components/BibleReader/ReflectionCard";
import { CelebrationToast } from "@/components/BibleReader/CelebrationToast";
import { FloatingMarkDone } from "@/components/BibleReader/FloatingMarkDone";
import { CompletionAnimation } from "@/components/BibleReader/CompletionAnimation";
import { ConfettiOverlay } from "@/components/BibleReader/ConfettiOverlay";
import { MainIdeaCard } from "@/components/BibleReader/MainIdeaCard";
import { QuestionCard } from "@/components/BibleReader/QuestionCard";
import { useBibleReader } from "@/hooks/useBibleReader";
import { useNavigationParams } from "@/hooks/useNavigationParams";
import { useScrollPersistence } from "@/hooks/useScrollPersistence";
import { useVerseActions } from "@/hooks/useVerseActions";
import { useJourneyIntegration } from "@/hooks/useJourneyIntegration";
import { useCelebrationAnimations } from "@/hooks/useCelebrationAnimations";
import { useJourneyCelebrations } from "@/hooks/useJourneyCelebrations";
import { useAutoComplete } from "@/hooks/useAutoComplete";
import { useChapterNavigation } from "@/hooks/useChapterNavigation";
import { useLogReadingActivity } from "@/utils/stats/useReadingStats";
import { useMainIdea } from "@/hooks/useMainIdea";
import { useConceptQuestions } from "@/hooks/useConceptQuestions";
// ADD: shared spacer so scroll area clears the glass tab bar
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";
// REMOVE: AsyncStorage note plumbing (notes now sync via backend)
// import AsyncStorage from "@react-native-async-storage/async-storage";
import VerseNoteModal from "@/components/BibleReader/VerseNoteModal";
// NEW: synced notes
import { useNotes } from "@/utils/bible/useNotes";
import { getVerseNumber } from "@/utils/bible/verseUtils";

export default function BibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, size, setSize, version, setVersion, theme } =
    useReadingPrefs();

  const deviceId = useDeviceId();
  const bottomScrollSpacer = useBottomScrollSpacer();

  const startRef = useRef(Date.now());
  const { mutateAsync: logActivity } = useLogReadingActivity();

  const {
    book,
    setBook,
    chapter,
    setChapter,
    showSettings,
    setShowSettings,
    showBookModal,
    setShowBookModal,
    showVersionModal,
    setShowVersionModal,
    selectedVerse,
    setSelectedVerse,
    showHighlightModal,
    setShowHighlightModal,
    scrolledEnough,
    setScrolledEnough,
    scrollRef,
    restoreDoneRef,
    saveTimerRef,
    scrollKey,
  } = useBibleReader({ version });

  const { hasDeepLink, params } = useNavigationParams({ setBook, setChapter });

  const { loaded: lastLocLoaded } = useLastLocation({
    book,
    chapter,
    setBook,
    setChapter,
    skipLoad: hasDeepLink,
  });

  const { data, isLoading, error } = useChapter({
    version,
    book,
    chapter,
    enabled: lastLocLoaded,
  });

  useScrollPersistence({
    hasDeepLink,
    lastLocLoaded,
    data,
    scrollRef,
    restoreDoneRef,
    scrollKey,
  });

  useEffect(() => {
    if (error) console.error("[Bible] chapter error", error);
  }, [error]);

  const verses = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.verses)) return data.verses;
    if (data?.chapter && Array.isArray(data.chapter.verses))
      return data.chapter.verses;
    if (data?.verse) return [data];
    return [];
  }, [data]);

  useEffect(() => {
    const startedAt = startRef.current;
    return () => {
      try {
        const elapsed = Math.max(
          0,
          Math.round((Date.now() - startedAt) / 1000),
        );
        const verseCount = Array.isArray(verses) ? verses.length : 0;
        if ((elapsed > 0 || verseCount > 0) && deviceId) {
          const result = logActivity({
            deviceId,
            version,
            book,
            chapter,
            verses: verseCount,
            timeSeconds: Math.min(elapsed, 8 * 60 * 60),
          });
          // Silently handle errors - endpoint may not exist yet
          if (result && typeof result.catch === "function") {
            result.catch((e) => {
              // Only log non-404 errors
              if (!e.message?.includes('[404]')) {
                console.error("[Bible] activity log failed", e);
              }
            });
          }
        }
      } catch (e) {
        console.error("[Bible] activity cleanup failed", e);
      }
      startRef.current = Date.now();
    };
  }, [deviceId, version, book, chapter, verses?.length, logActivity]);

  const { highlightMap, upsertHighlight, deleteHighlight } = useHighlights({
    deviceId,
    version,
    book,
    chapter,
  });

  const { favSet, toggleFavorite } = useFavorites({ version, book, chapter });


  const chatVerses = useChatVerses({ version, book, chapter, data });

  const { handlePrev, handleNext } = useChapterNavigation({
    book,
    chapter,
    setBook,
    setChapter,
    setSelectedVerse,
  });

  const {
    onVersePress,
    onAskAI,
    onHighlight,
    chooseColor,
    removeHighlight,
  } = useVerseActions({
    selectedVerse,
    verses,
    version,
    book,
    chapter,
    setShowHighlightModal,
    upsertHighlight,
    deleteHighlight,
  });

  const handleVersePress = (v) => {
    const num = onVersePress(v);
    setSelectedVerse(num);
  };

  const {
    journeyId,
    dayNumber,
    journey,
    plannedLoc,
    dayMeta,
    dayCountLabel,
    isOnPlannedChapter,
    alreadyCompleted,
    completedCount,
    completeDay,
    revertDay,
    lastAchievementId,
    progressByJourney,
  } = useJourneyIntegration({ params, book, chapter });

  const {
    toast,
    setToast,
    showConfetti,
    confettiPiecesRef,
    completionAnim,
    triggerCompletionAnimation,
    triggerConfetti,
  } = useCelebrationAnimations();

  useJourneyCelebrations({
    alreadyCompleted,
    journeyId,
    dayNumber,
    completedCount,
    journey,
    lastAchievementId,
    toast,
    setToast,
    triggerCompletionAnimation,
    triggerConfetti,
  });

  const { onScroll } = useAutoComplete({
    journeyId,
    dayNumber,
    isOnPlannedChapter,
    alreadyCompleted,
    completeDay,
    hasDeepLink,
    scrollKey,
    scrolledEnough,
    setScrolledEnough,
  });

  const goToPlanned = () => {
    if (plannedLoc) {
      setBook(plannedLoc.book);
      setChapter(plannedLoc.chapter);
    }
  };

  const onMarkDone = () => {
    if (!journeyId || !dayNumber) return;
    if (!isOnPlannedChapter) {
      goToPlanned();
      return;
    }
    if (alreadyCompleted) return;
    try {
      completeDay(journeyId, dayNumber);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      router.replace(`/journey/${encodeURIComponent(journeyId)}`);
    } catch (e) {
      console.error("[Bible] manual complete failed", e);
    }
  };

  const onUndo = () => {
    try {
      if (!toast?.undo) return;
      const { journeyId: j, dayNumber: d } = toast.undo;
      revertDay(j, d);
      setToast({ type: "success", text: "Completion undone" });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e) {
      console.error("[Bible] undo failed", e);
    }
  };

  const onToggleFavorite = () => {
    if (selectedVerse == null) return;
    try {
      toggleFavorite.mutate(Number(selectedVerse));
    } catch (e) {
      console.error("[Bible] favorite toggle failed", e);
    }
  };

  const isFavorite =
    selectedVerse != null && favSet?.has(Number(selectedVerse));

  const {
    showMainIdea,
    mainIdeaText,
    onAskMainIdea,
    openMainIdeaInChat,
    onSaveInsight,
    savedInsight,
    savingInsight,
    isLoading: mainIdeaLoading,
    isError: mainIdeaError,
  } = useMainIdea({ version, book, chapter });

  const {
    qStarted,
    qLoading,
    qError,
    qHearts,
    qIdx,
    qChosen,
    qFinished,
    qCorrectCount,
    questions,
    currentQ,
    answered,
    onStartQuestions: _onStartQuestions, // rename to avoid shadowing
    onChoose,
    onNextQ,
    resetQuestions,
  } = useConceptQuestions({ book, chapter });

  // helper: get selected verse text/ref
  const getSelectedVerseContent = () => {
    if (selectedVerse == null || !Array.isArray(verses)) return null;
    const vObj = verses.find((vv, idx) => {
      const num = getVerseNumber(vv, idx);
      return num === selectedVerse;
    });
    const text = vObj?.text || vObj?.verseText || vObj?.content || "";
    const ref = `${book} ${chapter}:${selectedVerse} (${version})`;
    return { text, ref };
  };

  const onShareVerse = async () => {
    try {
      const info = getSelectedVerseContent();
      if (!info) return;

      const createCard = () => {
        try {
          router.push(
            `/(tabs)/share?ref=${encodeURIComponent(info.ref)}&text=${encodeURIComponent(info.text)}`,
          );
        } catch (navErr) {
          console.error(
            "[Bible] share composer navigation failed, falling back",
            navErr,
          );
        }
      };

      const shareInMessages = async () => {
        try {
          const body = encodeURIComponent(`${info.ref}\n\n${info.text}`);
          const url = `sms:&body=${body}`; // iOS Messages composer
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
            return;
          }
        } catch (e) {
          console.error("[Bible] open iMessage failed, falling back", e);
        }
        // Fallback to native share sheet if Messages can't be opened
        await Share.share({ message: `${info.ref}\n\n${info.text}` });
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Create Card", "Share in Messages", "Cancel"],
            cancelButtonIndex: 2,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) createCard();
            else if (buttonIndex === 1) shareInMessages();
          },
        );
      } else {
        // Non‑iOS: go straight to card creator (existing behavior)
        createCard();
      }
    } catch (e) {
      console.error("[Bible] share failed", e);
    }
  };

  const onCopyVerse = async () => {
    try {
      const info = getSelectedVerseContent();
      if (!info) return;
      const content = `${info.ref}\n${info.text}`;
      await Clipboard.setStringAsync(content);
      // Reuse toast to notify copy
      setToast({ type: "success", text: "Copied verse" });
    } catch (e) {
      console.error("[Bible] copy failed", e);
    }
  };

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInitial, setNoteInitial] = useState("");

  // NEW: use backend-synced notes
  const { notesSet, notesMap, upsertNote, deleteNote } = useNotes({
    deviceId,
    version,
    book,
    chapter,
  });

  const handleAddNote = async () => {
    try {
      if (selectedVerse == null) return;
      const existing = notesMap.get(Number(selectedVerse)) || "";
      setNoteInitial(existing);
      setShowNoteModal(true);
    } catch (e) {
      console.error("[Bible] load note failed", e);
      setNoteInitial("");
      setShowNoteModal(true);
    }
  };

  const handleSaveNote = async (text) => {
    try {
      if (selectedVerse == null) return;
      const trimmed = String(text || "").trim();
      if (trimmed.length === 0) {
        await deleteNote.mutateAsync({ verse: Number(selectedVerse) });
      } else {
        await upsertNote.mutateAsync({ verse: Number(selectedVerse), text });
      }
      setShowNoteModal(false);
      setToast({ type: "success", text: "Note saved" });
    } catch (e) {
      console.error("[Bible] save note failed", e);
      setShowNoteModal(false);
    }
  };

  const openConceptQuestions = () => {
    try {
      router.push(
        `/quiz?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(String(chapter))}`,
      );
    } catch (e) {
      console.error("[Bible] open concept questions failed", e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={mode === "night" ? "light" : "dark"} />

      <BibleHeader
        theme={theme}
        insets={insets}
        onPrev={handlePrev}
        book={book}
        chapter={chapter}
        onBookPress={() => {
          try {
            router.push("/bible/books");
          } catch (e) {
            console.error("[Bible] open books page failed", e);
            setShowBookModal(true);
          }
        }}
        version={version}
        onVersionPress={() => setShowVersionModal(true)}
        onSettingsPress={() => setShowSettings((s) => !s)}
      />

      {showSettings && (
        <SettingsPanel
          theme={theme}
          mode={mode}
          setMode={setMode}
          size={size}
          setSize={setSize}
        />
      )}

      <JourneyBanner
        journey={journey}
        dayNumber={dayNumber}
        isOnPlannedChapter={isOnPlannedChapter}
        alreadyCompleted={alreadyCompleted}
        onGoToPlanned={goToPlanned}
        onMarkDone={onMarkDone}
        theme={theme}
        progressByJourney={progressByJourney}
        journeyId={journeyId}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomScrollSpacer }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {journey && dayNumber && progressByJourney && (
          <DayContextCard
            journey={journey}
            dayNumber={dayNumber}
            dayMeta={dayMeta}
            dayCountLabel={dayCountLabel}
            theme={theme}
          />
        )}

        <MainIdeaCard
          mode={mode}
          onAskMainIdea={onAskMainIdea}
          isLoading={mainIdeaLoading}
          isError={mainIdeaError}
          showMainIdea={showMainIdea}
          mainIdeaText={mainIdeaText}
          openMainIdeaInChat={openMainIdeaInChat}
          onSaveInsight={onSaveInsight}
          savedInsight={savedInsight}
          savingInsight={savingInsight}
        />

        <View
          style={{
            marginHorizontal: 12,
            marginTop: 6,
            backgroundColor: mode === "night" ? "#1C1E28" : "#FFF8E8",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: mode === "night" ? "#2A2E3F" : "#E8DCC8",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
            paddingVertical: 10,
          }}
        >
          <VerseList
            isLoading={isLoading}
            error={error}
            verses={verses}
            book={book}
            chapter={chapter}
            version={version}
            theme={theme}
            size={size}
            selectedVerse={selectedVerse}
            chatVerses={chatVerses}
            highlightMap={highlightMap}
            favSet={favSet}
            onVersePress={handleVersePress}
            // notes presence from backend
            notesSet={notesSet}
          />
        </View>

        <QuestionCard
          mode={mode}
          scrolledEnough={scrolledEnough}
          qStarted={qStarted}
          qLoading={qLoading}
          qError={qError}
          qFinished={qFinished}
          qHearts={qHearts}
          qIdx={qIdx}
          questions={questions}
          currentQ={currentQ}
          answered={answered}
          qChosen={qChosen}
          qCorrectCount={qCorrectCount}
          onStartQuestions={openConceptQuestions}
          onChoose={onChoose}
          onNextQ={onNextQ}
          resetQuestions={resetQuestions}
          onSaveInsight={onSaveInsight}
        />

        {journey && dayNumber && progressByJourney && (
          <ReflectionCard
            journey={journey}
            dayNumber={dayNumber}
            dayMeta={dayMeta}
            theme={theme}
          />
        )}
      </ScrollView>

      <VerseActionBar
        theme={theme}
        insets={insets}
        selectedVerse={selectedVerse}
        onClose={() => setSelectedVerse(null)}
        onAskAI={onAskAI}
        onHighlight={onHighlight}
        onToggleFavorite={onToggleFavorite}
        isFavorite={!!isFavorite}
        onShare={onShareVerse}
        onCopy={onCopyVerse}
        onAddNote={handleAddNote}
        onChooseHighlightColor={chooseColor}
        onRemoveHighlight={removeHighlight}
        currentHighlightColor={
          selectedVerse != null
            ? highlightMap.get(Number(selectedVerse)) || null
            : null
        }
        headerRef={
          selectedVerse != null
            ? `${book} ${chapter}:${selectedVerse} (${version})`
            : undefined
        }
      />

      {/* Note modal */}
      <VerseNoteModal
        visible={showNoteModal}
        theme={theme}
        insets={insets}
        initialText={noteInitial}
        onSave={handleSaveNote}
        onClose={() => setShowNoteModal(false)}
      />

      <HighlightModal
        visible={showHighlightModal}
        theme={theme}
        insets={insets}
        selectedVerse={selectedVerse}
        highlightMap={highlightMap}
        onChooseColor={chooseColor}
        onRemoveHighlight={removeHighlight}
        onClose={() => setShowHighlightModal(false)}
      />

      <BookChapterModal
        visible={showBookModal}
        theme={theme}
        insets={insets}
        book={book}
        chapter={chapter}
        onBookChange={setBook}
        onChapterChange={setChapter}
        onClose={() => setShowBookModal(false)}
      />

      <VersionModal
        visible={showVersionModal}
        theme={theme}
        insets={insets}
        version={version}
        onVersionChange={setVersion}
        onClose={() => setShowVersionModal(false)}
      />

      <CelebrationToast toast={toast} onUndo={onUndo} insets={insets} />

      <FloatingMarkDone
        scrolledEnough={scrolledEnough}
        journeyId={journeyId}
        dayNumber={dayNumber}
        isOnPlannedChapter={isOnPlannedChapter}
        alreadyCompleted={alreadyCompleted}
        onMarkDone={onMarkDone}
        insets={insets}
      />

      <CompletionAnimation completionAnim={completionAnim} theme={theme} />

      <ConfettiOverlay
        showConfetti={showConfetti}
        confettiPiecesRef={confettiPiecesRef}
      />
    </View>
  );
}
