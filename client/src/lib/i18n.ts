// i18n – Language detection and translation system
// Supports: Czech (cs), German (de), English (en)
// Auto-detects from browser language, localStorage override available

type Language = 'cs' | 'de' | 'en';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Common UI
  'common.search': {
    cs: 'Hledat',
    de: 'Suchen',
    en: 'Search',
  },
  'common.sort': {
    cs: 'Řadit',
    de: 'Sortieren',
    en: 'Sort',
  },
  'common.alphabetical': {
    cs: 'Abecedně A–Z',
    de: 'Alphabetisch A–Z',
    en: 'Alphabetically A–Z',
  },
  'common.noResults': {
    cs: 'Žádné výsledky',
    de: 'Keine Ergebnisse',
    en: 'No results',
  },
  'common.upload': {
    cs: 'Nahrát',
    de: 'Hochladen',
    en: 'Upload',
  },
  'common.uploading': {
    cs: 'Nahrávám…',
    de: 'Wird hochgeladen…',
    en: 'Uploading…',
  },
  'common.close': {
    cs: 'Zavřít',
    de: 'Schließen',
    en: 'Close',
  },
  'common.save': {
    cs: 'Uložit',
    de: 'Speichern',
    en: 'Save',
  },
  'common.delete': {
    cs: 'Smazat',
    de: 'Löschen',
    en: 'Delete',
  },
  'common.cancel': {
    cs: 'Zrušit',
    de: 'Abbrechen',
    en: 'Cancel',
  },
  'common.selected': {
    cs: 'Vybráno',
    de: 'Ausgewählt',
    en: 'Selected',
  },
  'common.select': {
    cs: 'Vybrat',
    de: 'Wählen',
    en: 'Select',
  },

  // Beat folder modal
  'beatFolder.title.main': {
    cs: 'Složka s beatama',
    de: 'Beatmappe',
    en: 'Beat Folder',
  },
  'beatFolder.title.preview': {
    cs: 'Vybrat preview audio',
    de: 'Vorschau-Audio wählen',
    en: 'Select Preview Audio',
  },
  'beatFolder.description.main': {
    cs: 'Soubory uložené přímo na VPS',
    de: 'Dateien, die direkt auf dem VPS gespeichert sind',
    en: 'Files stored directly on VPS',
  },
  'beatFolder.description.preview': {
    cs: 'Vyberte soubor jako preview audio (MP3/WAV)',
    de: 'Wählen Sie eine Datei als Vorschau-Audio (MP3/WAV)',
    en: 'Select a file as preview audio (MP3/WAV)',
  },
  'beatFolder.empty': {
    cs: 'Složka je prázdná',
    de: 'Ordner ist leer',
    en: 'Folder is empty',
  },
  'beatFolder.emptyHint': {
    cs: 'Nahraj beaty tlačítkem výše nebo je sem přetáhni',
    de: 'Laden Sie Beats mit der Schaltfläche oben hoch oder ziehen Sie sie hierher',
    en: 'Upload beats with the button above or drag them here',
  },
  'beatFolder.loading': {
    cs: 'Načítám…',
    de: 'Wird geladen…',
    en: 'Loading…',
  },
  'beatFolder.files': {
    cs: 'souborů',
    de: 'Dateien',
    en: 'files',
  },
  'beatFolder.dragHint': {
    cs: 'Přetáhni soubory zde',
    de: 'Dateien hierher ziehen',
    en: 'Drag files here',
  },

  // Gallery uploads
  'gallery.uploadProgress': {
    cs: 'Nahrávám {count, plural, one {obrázek} other {# obrázků}}…',
    de: 'Wird hochgeladen {count, plural, one {Bild} other {# Bilder}}…',
    en: 'Uploading {count, plural, one {image} other {# images}}…',
  },
  'gallery.uploadProgress.short': {
    cs: 'Nahrávám',
    de: 'Wird hochgeladen',
    en: 'Uploading',
  },
  'gallery.title': {
    cs: 'Galerie obrázků',
    de: 'Bildergalerie',
    en: 'Image Gallery',
  },
  'gallery.deleteConfirm': {
    cs: 'Opravdu smazat obrázek?',
    de: 'Bild wirklich löschen?',
    en: 'Really delete image?',
  },

  // Waveform
  'waveform.title': {
    cs: 'Náhled waveformu',
    de: 'Wellenform-Vorschau',
    en: 'Waveform Preview',
  },
  'waveform.filename': {
    cs: 'Soubor:',
    de: 'Datei:',
    en: 'File:',
  },

  // Beat publishing
  'beat.publish': {
    cs: 'Zveřejnit beat',
    de: 'Beat veröffentlichen',
    en: 'Publish Beat',
  },
  'beat.publishModal.title': {
    cs: 'Přidat informace o beatu',
    de: 'Beat-Informationen hinzufügen',
    en: 'Add Beat Information',
  },
  'beat.publishModal.name': {
    cs: 'Název beatu',
    de: 'Beat-Name',
    en: 'Beat Name',
  },
  'beat.publishModal.bpm': {
    cs: 'BPM',
    de: 'BPM',
    en: 'BPM',
  },
  'beat.publishModal.key': {
    cs: 'Tónina',
    de: 'Tonart',
    en: 'Key',
  },
  'beat.publishModal.selectArtwork': {
    cs: 'Vybrat artwork',
    de: 'Artwork auswählen',
    en: 'Select Artwork',
  },
  'beat.publishModal.browseGallery': {
    cs: 'Procházet galerii',
    de: 'Galerie durchsuchen',
    en: 'Browse Gallery',
  },
  'beat.publishModal.publish': {
    cs: 'Zveřejnit',
    de: 'Veröffentlichen',
    en: 'Publish',
  },
};

export function detectLanguage(): Language {
  // Check localStorage override
  const stored = localStorage.getItem('language');
  if (stored === 'cs' || stored === 'de' || stored === 'en') {
    return stored;
  }

  // Detect from browser
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const lang = browserLang.split('-')[0].toLowerCase();

  if (lang === 'de') return 'de';
  if (lang === 'en') return 'en';
  // Default to Czech
  return 'cs';
}

export function setLanguage(lang: Language): void {
  localStorage.setItem('language', lang);
}

export function t(key: string, lang?: Language, count?: number): string {
  const currentLang = lang || detectLanguage();
  const translation = translations[key];

  if (!translation) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }

  let text = translation[currentLang];

  // Handle pluralization
  if (count !== undefined && text.includes('{count')) {
    text = text.replace(/{count, plural, one \{(.*?)\} other \{#(.*?)\}\}/g, (_, one, other) => {
      return count === 1 ? one : `${count}${other}`;
    });
  }

  return text;
}

export function useLanguage() {
  const lang = detectLanguage();
  return { lang, t: (key: string) => t(key, lang), setLanguage };
}
