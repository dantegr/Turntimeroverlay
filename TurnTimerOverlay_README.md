# Turn Timer Overlay v1.2
## A Roll20 API Script for Turn-Based Combat

A standalone, draggable turn timer overlay for Roll20 that displays the current player's name and a countdown timer directly on the map.

---

## Features

- **Draggable Overlay** - Players and GM can drag the timer anywhere on the map
- **Current Turn Display** - Shows whose turn it is with token name
- **Countdown Timer** - Visual countdown with color coding
  - 🟢 Green: Plenty of time
  - 🟠 Orange: Warning (15 seconds default)
  - 🔴 Red: Danger (5 seconds default)
- **Auto-Advance** - Automatically moves to next turn when timer expires
- **Pause/Resume** - Pause the timer without losing progress
- **Silent by Default** - No chat spam, just the overlay
- **Chat Commands** - Full control via simple chat commands
- **Configurable** - Customize duration, colors, notifications, and more
- **Position Memory** - Remembers where you dragged it between turns

---

## Installation

1. In your Roll20 game, go to **Settings (⚙️) → API Scripts**
2. Click **"New Script"**
3. Name it `TurnTimerOverlay`
4. Copy and paste the entire contents of `TurnTimerOverlay.js`
5. Click **"Save Script"**
6. The API sandbox will restart and you'll see "Turn Timer Overlay v1.2 loaded successfully!" in the API console

---

## Commands

All commands start with `!tt` or `!turntimer`

| Command | Description |
|---------|-------------|
| `!tt start` | Start timer with default duration (30s) |
| `!tt start 60` | Start timer with 60 seconds |
| `!tt stop` | Stop timer and remove overlay |
| `!tt pause` | Pause/Resume the timer |
| `!tt next` | Skip to next turn |
| `!tt prev` | Go back to previous turn |
| `!tt add 30` | Add 30 seconds to current timer |
| `!tt set 45` | Set timer to exactly 45 seconds |
| `!tt status` | Show current timer status |
| `!tt config` | Show current configuration |
| `!tt help` | Show help message |

---

## Configuration

Use `!tt config [setting] [value]` to change settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `duration` | 30 | Default turn time in seconds |
| `warning` | 15 | When to show orange warning |
| `danger` | 5 | When to show red danger |
| `autoadvance` | true | Auto-advance when timer ends (if false, stays at 0:00) |
| `announce` | false | Announce turns in chat |
| `whisper` | false | Whisper announcements to GM only |
| `fontsize` | 56 | Size of overlay text |
| `reset` | - | Reset all settings to defaults |

### Examples

```
!tt config duration 60        // Set default timer to 60 seconds
!tt config autoadvance false  // Disable auto-advance
!tt config announce true      // Enable chat announcements
!tt config fontsize 72        // Make overlay larger
!tt config reset              // Reset everything to defaults
```

---

## Usage Example

### Basic Combat Flow (Auto-Advance ON - default)

1. **Set up turn order** in Roll20's turn tracker (add tokens, roll initiative)
2. **Start the timer**: `!tt start` or `!tt start 60` for 60 seconds
3. **Timer appears** on the map showing current character and countdown
4. **Drag the overlay** to your preferred position (it will remember the spot)
5. When timer expires, it **auto-advances** to the next turn
6. **Use controls** as needed:
   - `!tt pause` if someone needs to step away
   - `!tt add 30` to give extra time
   - `!tt next` to skip a turn
   - `!tt stop` to end combat

### Manual Advance Flow (Auto-Advance OFF)

1. Disable auto-advance: `!tt config autoadvance false`
2. **Start the timer**: `!tt start`
3. When timer hits **0:00**, the overlay stays visible
4. The GM manually advances with `!tt next` when ready
5. Timer restarts for the next player

### Recommended Macros

Create these macros for quick access:

**Start Combat Timer**
```
!tt start
```

**Quick Controls (Token Action)**
```
!tt ?{Action|Start,start|Stop,stop|Pause,pause|Next Turn,next|Previous,prev|Add 30s,add 30}
```

**GM Timer Menu**
```
/w gm &{template:default} {{name=Turn Timer}} {{[Start](!tt start) [Stop](!tt stop)}} {{[Pause](!tt pause) [Next](!tt next)}} {{[+30s](!tt add 30) [+60s](!tt add 60)}}
```

---

## Display Example

The overlay will appear like this on your map:

```
🎯 Gandalf the Grey
⏱️ 0:25
```

When paused:
```
🎯 Gandalf the Grey
⏸️ 0:25 (PAUSED)
```

---

## Tips

1. **Position the overlay** in a corner that doesn't obstruct gameplay
2. **Use larger font size** (`!tt config fontsize 72`) for streaming or large displays
3. **Disable auto-advance** (`!tt config autoadvance false`) if you prefer manual control
4. **Enable chat announcements** (`!tt config announce true`) if you want turn notifications
5. **Create macros** for common actions to avoid typing commands

---

## Known Limitations

- **No text stroke/outline**: Roll20's text objects don't support stroke styling. For better visibility, use a larger font size or position the overlay over a darker area of the map.
- **Position resets on page change**: If players move to a different page, the overlay position may reset.

---

## Troubleshooting

### Overlay not appearing
- Make sure the **Turn Order** has at least one entry
- Check that you're on the same page as your players
- Try `!tt stop` then `!tt start` again

### Timer not advancing automatically
- Check that `autoadvance` is enabled: `!tt config`
- Ensure there are multiple entries in the turn order

### Position keeps resetting
- The overlay saves position when you stop or advance turns
- If you refresh mid-countdown, it may reset to default position

### Commands not working
- Make sure the API script is running (check API console)
- Verify you're using `!tt` or `!turntimer`

---

## Compatibility

- Works alongside other combat scripts
- Does not require CombatMaster, CombatTracker, or any other scripts
- Uses standard Roll20 turn order - compatible with any initiative system

---

## Changelog

### v1.2
- Simplified codebase (removed button feature)
- Changed default timer to 30 seconds
- Adjusted warning threshold to 15 seconds
- Adjusted danger threshold to 5 seconds
- Disabled chat notifications by default (overlay only)
- When autoAdvance is off, overlay stays visible at 0:00
- Uses token name instead of character sheet name

### v1.0
- Initial release
- Draggable text overlay
- Auto-advance functionality
- Pause/resume support
- Configuration system
- Chat command interface
