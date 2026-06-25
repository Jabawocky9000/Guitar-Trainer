# Guitar Theory Trainer — Feature Specification

This document captures every feature of the app as of the initial commit.
It uses Gherkin (Given/When/Then) syntax so each behaviour can be verified
after any refactor. Organised by section matching the sidebar navigation.

---

## General: Layout & Navigation

```gherkin
Feature: App Layout
  The app has a header, sidebar navigation, and a main content area.

  Scenario: Header displays app identity
    Given the app is loaded
    Then the header shows a guitar emoji logo mark
    And the title reads "Guitar Theory Trainer"
    And the subtitle reads "For professional practice"

  Scenario: Sidebar navigation between sections
    Given the app is loaded
    Then the sidebar shows six navigation items grouped under four labels:
      | Group        | Item               |
      | Foundations  | Key signatures     |
      | Foundations  | Relative keys      |
      | Fretboard   | Note names         |
      | Visualiser  | Scale Map          |
      | Games       | Chords in a Key    |
      | Games       | Interval Training  |
    When the user clicks a navigation item
    Then that section becomes visible
    And the clicked nav button is highlighted
    And all other sections are hidden

  Scenario: Default section on load
    Given the app is loaded
    Then the "Key signatures" section is active by default

  Scenario: Responsive layout on mobile
    Given the viewport width is 640px or less
    Then the sidebar collapses to a horizontal scrollable row
    And the sidebar group labels are hidden
```

---

## 1. Key Signatures

```gherkin
Feature: Key Signatures Quiz
  Two-phase quiz: first identify the count of accidentals, then name them in order.

  Scenario: Stats tracking
    Given the Key Signatures section is active
    Then three stat cards are shown: "correct", "streak", and "attempted"
    And all start at 0

  Scenario: Filter modes
    Given the Key Signatures section is active
    Then three filter buttons are shown: "Sharps", "Flats", "Mixed"
    And "Sharps" is active by default
    When the user clicks a filter
    Then stats reset to 0
    And a new question is generated from the selected pool

  Scenario: Sharps pool
    Given the filter is set to "Sharps"
    Then questions are drawn from: C, G, D, A, E, B, F♯, C♯ major keys

  Scenario: Flats pool
    Given the filter is set to "Flats"
    Then questions are drawn from: F, B♭, E♭, A♭, D♭, G♭, C♭ major keys

  Scenario: Mixed pool
    Given the filter is set to "Mixed"
    Then questions are drawn from both sharp and flat keys

  Scenario: Phase 1 — count the accidentals
    Given a key is displayed (e.g. "G")
    And the key type label shows "MAJOR · SHARPS" (or FLATS / NO ACCIDENTALS)
    Then a question asks "How many accidentals does G major have?"
    And 8 answer buttons are shown (0 through 7, with 0 labelled "0 (C)")
    When the user clicks the correct count
    Then the button turns green
    And feedback shows "✓ Correct!"
    And the score and streak increment
    And the progress bar fills to 50%
    When the user clicks an incorrect count
    Then the clicked button turns red
    And the correct button turns green
    And feedback shows the correct count
    And the streak resets to 0

  Scenario: Phase 1 — key with 0 accidentals (C major)
    Given the displayed key is C major
    When the user correctly answers 0
    Then the progress bar fills to 100%
    And the "Next key →" button appears
    And the accidental-naming phase is skipped

  Scenario: Phase 2 — name the accidentals in order
    Given the user answered the count (correctly or not) for a key with 1+ accidentals
    Then after a short delay, the accidental naming section appears
    And the question asks to name the sharps (or flats) in order
    And 7 accidental buttons are shown (all sharps or all flats)
    When the user clicks accidentals to select them (toggle on/off)
    And clicks "Submit ✓"
    Then each correct accidental turns green
    And any wrong selection turns red
    And feedback shows the correct order (e.g. "F♯ → C♯ → G♯")
    And the progress bar fills to 100%
    And the "Next key →" button appears

  Scenario: Accidental order must match
    Given the key is D major (F♯, C♯)
    When the user selects C♯ then F♯ (wrong order)
    Then the submission is marked incorrect
    And the correct order "F♯ → C♯" is shown

  Scenario: Sharps order follows F C G D A E B
    Then sharp accidentals always follow the order: F♯, C♯, G♯, D♯, A♯, E♯, B♯

  Scenario: Flats order follows B E A D G C F
    Then flat accidentals always follow the order: B♭, E♭, A♭, D♭, G♭, C♭, F♭

  Scenario: Next key
    When the user clicks "Next key →"
    Then a new random key is selected from the current pool
    And all UI resets (feedback, progress, accidental section hidden)
```

---

## 2. Relative Keys

```gherkin
Feature: Relative Keys Quiz
  Identify the relative minor of a major key, or vice versa.

  Scenario: Stats tracking
    Given the Relative Keys section is active
    Then three stat cards show: "correct", "streak", "attempted" — all starting at 0

  Scenario: Filter modes
    Then three filters are shown: "Major → minor", "Minor → major", "Mixed"
    And "Major → minor" is active by default
    When the user changes the filter
    Then stats reset and a new question is generated

  Scenario: Major → minor question
    Given the filter is "Major → minor"
    Then the display shows a major key name (e.g. "G major")
    And the key signature info is shown (e.g. "1 SHARP · F♯")
    And the question asks "What is the relative minor of G major?"
    And 6 shuffled answer buttons are shown (1 correct + 5 distractors)

  Scenario: Minor → major question
    Given the filter is "Minor → major"
    Then the display shows a minor key name (e.g. "E minor")
    And the question asks "What is the relative major of E minor?"

  Scenario: Mixed mode
    Given the filter is "Mixed"
    Then each question randomly asks either direction

  Scenario: Correct answer
    When the user clicks the correct answer
    Then the button turns green
    And feedback shows "✓ Correct!"
    And score and streak increment

  Scenario: Wrong answer
    When the user clicks the wrong answer
    Then the clicked button turns red
    And the correct answer button turns green
    And feedback shows the correct answer with a hint:
      - For major→minor: "The relative minor is the 6th degree of the major scale."
      - For minor→major: "The relative major starts a minor 3rd above the minor tonic."
    And the streak resets to 0

  Scenario: Next question
    When the user clicks "Next →"
    Then a new random question appears with reset UI
```

---

## 3. Note Names

```gherkin
Feature: Note Names — Across Strings Mode
  Type the note name at a given fret across all 6 strings.

  Scenario: Mode toggle
    Given the Note Names section is active
    Then two mode buttons are shown: "Across Strings" (default) and "Single String"

  Scenario: Fret display
    Then a fret number is shown in a highlighted badge
    And 6 text inputs are displayed in a 3-column grid
    And strings are ordered low to high: 6th (E₂) → 1st (E₄)

  Scenario: Input behaviour
    When the user types a note name and presses Enter
    Then focus moves to the next string's input
    When Enter is pressed on the last input
    Then the "Check" action is triggered

  Scenario: Enharmonic acceptance
    Given the fret produces a note with enharmonic spellings
    Then any valid enharmonic spelling is accepted (e.g. "F#", "F♯", "Gb", "G♭")
    And input is case-insensitive (first letter is auto-capitalised)
    And "#" is accepted as "♯" and "b" as "♭"

  Scenario: Check notes
    When the user clicks "Check"
    Then each filled input is marked green (correct) or red (wrong)
    And feedback shows "X/Y correct" or "All 6 correct!"
    And empty inputs are ignored

  Scenario: Reveal notes
    When the user clicks "Reveal"
    Then all inputs are filled with the primary enharmonic spelling
    And all inputs turn green

  Scenario: Clear notes
    When the user clicks "Clear"
    Then all inputs are emptied and reset to default styling

  Scenario: New fret
    When the user clicks "New fret"
    Then a random fret (0–12) is selected
    And all inputs are cleared
    And the first input receives focus

  Scenario: Position dots only toggle
    Given the "Position dots only" toggle is off by default
    When the user enables it
    Then new frets are restricted to: 0, 3, 5, 7, 9, 12
    And the toggle turns purple
    And a new fret is immediately generated

  Scenario: Fourths cycle display
    Then a "Fourths cycle" card shows 12 notes: C, F, B♭, E♭, A♭, D♭, G♭, B, E, A, D, G
    And one note highlights at a time, cycling every 1.2 seconds
    And an info box explains standard tuning as mostly perfect fourths

  Scenario: Full fretboard reference diagram
    Then a full fretboard SVG diagram shows all note names for frets 1–12
    And natural notes are shown in brighter green
    And accidental notes show both enharmonic names (e.g. C♯ and D♭)
    When the user clicks "Hide diagram" toggle
    Then the fretboard diagram is hidden
    And the toggle label changes to "Show diagram"


Feature: Note Names — Single String Mode
  Identify a single note on a randomly chosen string and fret.

  Scenario: String selection
    Then 6 string toggle buttons are shown, all active by default
    And at least one string must remain active
    When the user deselects a string
    Then that string is excluded from questions

  Scenario: Dots-only toggle
    Given a "Fret restriction" toggle is shown
    When enabled, frets are restricted to: 0, 3, 5, 7, 8, 10, 12

  Scenario: Fretboard display
    Then an SVG fretboard shows all 6 strings
    And the active string is highlighted (brighter colour)
    And a question dot with "?" marks the target fret on the active string

  Scenario: Answer input
    Then a text input is shown with placeholder "e.g. F♯ or Gb"
    When the user types a note and clicks "Check" (or presses Enter)
    Then if correct: input turns green, feedback shows "✓ Correct!"
    And if wrong: input turns red, feedback shows the correct note(s)
    And the fretboard redraws showing the answer in the dot

  Scenario: Reveal
    When the user clicks "Reveal"
    Then the input fills with the correct note
    And the fretboard redraws showing the answer

  Scenario: New note
    When the user clicks "New note →"
    Then a new random string + fret combination is selected
    And the input clears and receives focus

  Scenario: Reference fretboard
    Then a reference fretboard with all note names is shown below
    And it can be toggled hidden/shown
```

---

## 4. Scale Map (Fretboard Visualiser)

```gherkin
Feature: Scale Map — Modes View
  Interactive fretboard showing C major / A minor modes across 15 frets.

  Scenario: View toggle
    Then three view options are shown: "Modes" (default), "Pentatonic", "Chords"

  Scenario: Key toggle (Modes view)
    Then "C major" and "A minor" toggle buttons are shown
    And "C major" is selected by default
    When the user selects "A minor"
    Then interval numbers are shown relative to A

  Scenario: Mode highlight pills
    Then 8 pills are shown: "None" + 7 modes (Ionian through Locrian)
    And each mode has a unique colour
    And "None" is selected by default (all scale notes shown as neutral grey)
    When the user clicks a mode pill
    Then that mode's fretboard pattern is highlighted in its colour
    And the "Numbers show" control appears with three options:
      "Mode root = 1", "C major", "A minor"
    And interval labels update based on the selected numbering
    When the user clicks the same mode pill again
    Then the highlight is removed (returns to "None")

  Scenario: Mode colours
    Then each mode has a distinct colour:
      | Mode       | Colour  |
      | Ionian     | Orange  |
      | Dorian     | Teal    |
      | Phrygian   | Red     |
      | Lydian     | Purple  |
      | Mixolydian | Pink    |
      | Aeolian    | Blue    |
      | Locrian    | Magenta |

  Scenario: Root note indicators
    Then root notes (1) have a thicker stroke and a dashed outer ring

  Scenario: Key label updates
    Then a label below the controls describes the current view
    And when a mode is highlighted, it shows the mode name, notes, and degrees

  Scenario: Blues scale toggle
    Given a "Blues scale" toggle is shown (off by default)
    When enabled
    Then D♯/E♭ (the blue note) is added to the fretboard in blue
    And a label shows its interval relative to the current context

  Scenario: Note names toggle
    Given a "Note names" toggle is shown (off by default)
    When enabled
    Then all dots show note names instead of interval numbers
    And enharmonic notes show both names (e.g. "C♯/D♭")


Feature: Scale Map — Pentatonic View
  Shows the 5-note pentatonic scale with 5 CAGED-system shapes.

  Scenario: Pentatonic base display
    Given the view is set to "Pentatonic"
    Then the fretboard shows C major pentatonic (C D E G A) or A minor pentatonic
    And dots are neutral grey with white text
    And the key toggle switches between C major and A minor perspectives

  Scenario: Shape highlight
    Then 6 pills are shown: "None" + 5 shapes (Shape One through Five)
    And each shape has a distinct colour
    When the user clicks a shape
    Then that shape's fret positions are highlighted in its colour
    And clicking again deselects it

  Scenario: Blues scale in pentatonic view
    When the blues toggle is enabled
    Then D♯/E♭ is shown as "♭3" (C major) or "♭5" (A minor)


Feature: Scale Map — Chords View
  Shows diatonic chord tones on the fretboard.

  Scenario: Chord pills
    Given the view is set to "Chords"
    Then 7 chord pills are shown (I through vii°) with their colours
    And none are selected by default (neutral grey dots for all C major notes)
    When the user clicks one or more chord pills
    Then the fretboard highlights those chord's tones in their colours
    And root notes get dashed outer rings
    And shared tones between chords show split pie-wedge dots

  Scenario: Diatonic 7ths toggle
    Given a "Add diatonic 7ths" toggle is shown
    When enabled
    Then 7th chord tones are added to highlighted chords
    And 7th-only tones appear as diamond shapes
    And tones that are both a triad and a 7th get an outer accent ring

  Scenario: Blues toggle hidden in chords view
    Given the view is "Chords"
    Then the blues scale toggle row is hidden
```

---

## 5. Chords in a Key

```gherkin
Feature: Chords in a Key
  Shows diatonic chords, secondary dominants, and tritone subs for any key.

  Scenario: Key selector
    Then a mode toggle shows "Major" (default) and "Minor"
    And 12 root note buttons are shown (C through B)
    And "C" is selected by default
    And a label shows "Showing: C Major"

  Scenario: Sevenths toggle
    Given a "Show diatonic seventh chords" toggle is shown (off by default)
    When enabled
    Then chord diagrams switch from triads to seventh chords

  Scenario: Diatonic chords grid
    Then 7 chord diagram cards are shown in a row
    And each shows an SVG chord diagram with:
      - Chord name (e.g. "C Major")
      - Roman numeral (e.g. "I")
      - Fret positions with finger numbers
      - Muted strings (X), open strings (O)
      - Barre indicators where applicable
      - Start fret label for non-first-position chords

  Scenario: C Major uses open voicings
    Given the key is C Major and sevenths are off
    Then open position voicings are used (C, Dm, Em, F, G, Am, Bdim)

  Scenario: Other keys use barre voicings
    Given the key is not C Major
    Then moveable barre chord shapes are used

  Scenario: Major key chord qualities
    Given the mode is "Major"
    Then the chord qualities follow: I, ii, iii, IV, V, vi, vii°
    And in seventh mode: Imaj7, ii7, iii7, IVmaj7, V7, vi7, vii°7

  Scenario: Minor key chord qualities
    Given the mode is "Minor"
    Then the chord qualities follow: i, ii°, III, iv, v, VI, VII
    And in seventh mode: im7, ii°7, IIImaj7, iv7, v7, VImaj7, VII7

  Scenario: Secondary dominants
    Then below a divider, 7 secondary dominant chords are shown
    And each is the V7 of the corresponding diatonic chord
    And a resolve label shows the target (e.g. "→ D (ii)")

  Scenario: Tritone substitutions
    Then below another divider, 7 tritone substitution chords are shown
    And each is the ♭II7 of the corresponding secondary dominant
    And a resolve label shows the same target as its secondary dominant

  Scenario: Info box
    Then an info box explains vertical reading:
      diatonic chord → secondary dominant → tritone sub

  Scenario: Colour coding
    Then all three rows (diatonic, secondary dominant, tritone sub)
    use the same 7-colour palette so each column shares a colour
```

---

## 6. Interval Training

```gherkin
Feature: Interval Training Quiz
  Given a starting note and interval, name the resulting note.

  Scenario: Interval selector
    Then 12 interval toggle buttons are shown (m2 through Oct)
    And all are active by default
    And at least one must remain active

  Scenario: Direction selector
    Then three direction buttons are shown: "↑ Ascending" (default), "↕ Both", "↓ Descending"

  Scenario: Question display
    Then the left column shows:
      - Starting note (large text, e.g. "A")
      - Interval (large accent text, e.g. "P4")
      - Direction indicator ("↑ Ascending" or "↓ Descending")

  Scenario: Answer input
    Then a text input is shown with placeholder "e.g. A or B♭"
    When the user types a note and clicks "Check" (or presses Enter)
    Then if correct: input turns green, feedback "✓ Correct!", score/streak increment
    And if wrong: input turns red, feedback shows correct note(s)
    And streak resets to 0

  Scenario: Reveal
    When the user clicks "Reveal"
    Then the input fills with the correct note
    And it counts as an attempt with streak reset

  Scenario: New question
    When the user clicks "New →"
    Then a new random root + interval + direction is selected
    And the input clears and receives focus

  Scenario: Score tracking
    Then "Correct", "Streak", and "Total" counters are shown

  Scenario: Interval reference table
    Then the right column shows a reference table with all 12 intervals:
      symbol, name, and semitone count

  Scenario: Enharmonic acceptance
    Then any valid enharmonic spelling is accepted
    And "#" → "♯" and "b" → "♭" conversion is handled

  Scenario: Ascending calculation
    Given direction is ascending
    Then the answer is: (root pitch class + semitones) mod 12

  Scenario: Descending calculation
    Given direction is descending
    Then the answer is: (root pitch class - semitones) mod 12


Feature: Interval Training — Fretboard Reference
  An interactive fretboard showing all intervals from a selectable root.

  Scenario: Root selector
    Then 12 root note buttons are shown
    And "A" (pc 9) is selected by default
    When the user clicks a different root
    Then the fretboard redraws with intervals relative to that root

  Scenario: Fretboard display
    Then an SVG fretboard shows all 12 chromatic notes on each string (frets 1–12)
    And each dot shows its interval label relative to the selected root
    And the root notes (1) are highlighted in gold
    And all other notes are shown in green

  Scenario: Toggle visibility
    Then a show/hide toggle is available
    And the fretboard is visible by default
```

---

## Music Theory Data

```gherkin
Feature: Music Theory Data Accuracy

  Scenario: Chromatic scale
    Then the chromatic scale uses: C, C♯, D, E♭, E, F, F♯, G, A♭, A, B♭, B

  Scenario: Standard guitar tuning
    Then string tuning is (low to high): E₂(40), A₂(45), D₃(50), G₃(55), B₃(59), E₄(64)
    And MIDI pitch values match standard tuning

  Scenario: Mode formulas
    Then the 7 modes have correct interval formulas:
      | Mode       | Formula                    |
      | Ionian     | 1 2 3 4 5 6 7              |
      | Dorian     | 1 2 ♭3 4 5 6 ♭7            |
      | Phrygian   | 1 ♭2 ♭3 4 5 ♭6 ♭7          |
      | Lydian     | 1 2 3 ♯4 5 6 7             |
      | Mixolydian | 1 2 3 4 5 6 ♭7             |
      | Aeolian    | 1 2 ♭3 4 5 ♭6 ♭7           |
      | Locrian    | 1 ♭2 ♭3 4 ♭5 ♭6 ♭7         |

  Scenario: Relative key pairs
    Then every major/minor relative pair is correct across all 13 key entries

  Scenario: Sharp key order
    Then sharps accumulate as: F♯, C♯, G♯, D♯, A♯, E♯, B♯

  Scenario: Flat key order
    Then flats accumulate as: B♭, E♭, A♭, D♭, G♭, C♭, F♭
```

---

## Visual Design

```gherkin
Feature: Visual Design System

  Scenario: Dark theme
    Then the app uses a dark colour scheme with:
      - Background: #0f0f0f
      - Surface: #1a1a1a
      - Accent (gold): #c8a96e
      - Text: #f0f0f0
      - Green for correct: #6db36d
      - Red for incorrect: #c45f5f
      - Purple for highlights: #8b7fd4

  Scenario: Typography
    Then the primary font is Inter (Google Fonts)
    And the monospace font is Inter Mono
    And the app uses a preconnected Google Fonts link

  Scenario: Feedback colours
    Then correct answers use green background/border/text
    And wrong answers use red background/border/text
    And selected (pre-submit) answers use raised background with accent border

  Scenario: Toggle switches
    Then all toggle switches use a consistent pill/thumb design
    And enabled state shows a coloured thumb moved right
    And disabled state shows a grey thumb on the left
```
