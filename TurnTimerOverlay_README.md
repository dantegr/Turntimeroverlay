# Turn Timer Overlay v1.1
## A Roll20 API Script for Turn-Based Combat

A standalone, draggable turn timer overlay for Roll20 that displays the current player's name and a countdown timer directly on the map.

---

## Features

- **Draggable Overlay** - Players and GM can drag the timer anywhere on the map
- **End Turn Button** - Draggable button to end turn early (just drag it!)
- **Current Turn Display** - Shows whose turn it is with character/token name
- **Countdown Timer** - Visual countdown with color coding
  - 🟢 Green: Plenty of time
  - 🟠 Orange: Warning (30 seconds default)
  - 🔴 Red: Danger (10 seconds default)
- **Auto-Advance** - Automatically moves to next turn when timer expires
- **Pause/Resume** - Pause the timer without losing progress
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
6. The API sandbox will restart and you'll see "Turn Timer Overlay v1.0 loaded successfully!" in the API console

---

## Commands

All commands start with `!tt` or `!turntimer`

| Command | Description |
|---------|-------------|
| `!tt start` | Start timer with default duration (60s) |
| `!tt start 90` | Start timer with 90 seconds |
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
| `duration` | 60 | Default turn time in seconds |
| `warning` | 30 | When to show orange warning |
| `danger` | 10 | When to show red danger |
| `autoadvance` | true | Auto-advance when timer ends |
| `button` | true | Show the End Turn button |
| `announce` | true | Announce turns in chat |
| `whisper` | false | Whisper announcements to GM only |
| `fontsize` | 56 | Size of overlay text |
| `reset` | - | Reset all settings to defaults |

### Examples

```
!tt config duration 90        // Set default timer to 90 seconds
!tt config autoadvance false  // Disable auto-advance
!tt config button false       // Hide the End Turn button
!tt config whisper true       // Only GM sees announcements
!tt config fontsize 72        // Make overlay larger
!tt config reset              // Reset everything to defaults
```

---

## Usage Example

### Basic Combat Flow

1. **Set up turn order** in Roll20's turn tracker (add tokens, roll initiative)
2. **Start the timer**: `!tt start` or `!tt start 90` for 90 seconds
3. **Timer appears** on the map showing current character and countdown
4. **Drag the overlay** to your preferred position (it will remember the spot)
5. When timer expires, it **auto-advances** to the next turn
6. **Use controls** as needed:
   - `!tt pause` if someone needs to step away
   - `!tt add 30` to give extra time
   - `!tt next` to skip a turn
   - `!tt stop` to end combat

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
⏱️ 0:45

⏭️ END TURN
```

When paused:
```
🎯 Gandalf the Grey
⏸️ 0:45 (PAUSED)

⏭️ END TURN
```

### End Turn Button

The **⏭️ END TURN** button appears below the timer. To end your turn early:
1. Simply **drag the button** in any direction
2. The script detects the movement and advances to the next turn
3. The button resets automatically for the next player

This allows players to end their turn without needing chat commands!

---

## Tips

1. **Position the overlay** in a corner that doesn't obstruct gameplay
2. **Use larger font size** (`!tt config fontsize 72`) for streaming or large displays
3. **Disable auto-advance** (`!tt config autoadvance false`) if you prefer manual control
4. **Whisper to GM** (`!tt config whisper true`) for a quieter experience
5. **Create macros** for common actions to avoid typing commands

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

## License

Free to use and modify. Attribution appreciated but not required.

---

## Changelog

### v1.1
- Added draggable "End Turn" button
- Button follows timer overlay when dragged
- Button automatically triggers next turn when moved
- New config option: `button` to show/hide the End Turn button

### v1.0
- Initial release
- Draggable text overlay
- Auto-advance functionality
- Pause/resume support
- Configuration system
- Chat command interface
