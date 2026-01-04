// ============================================
// TURN TIMER OVERLAY v1.0
// A Roll20 API Script
// ============================================
// Features:
// - Draggable map overlay showing current turn & timer
// - Auto-advance to next turn when timer expires
// - Color-coded countdown (green → orange → red)
// - Chat commands for full control
// - Configurable timer duration
// - Sound/visual notification options
// ============================================

var TurnTimerOverlay = TurnTimerOverlay || (function() {
    'use strict';

    // ==========================================
    // CONFIGURATION - Customize these settings
    // ==========================================
    const DEFAULT_CONFIG = {
        // Timer settings
        defaultDuration: 60,        // Default turn time in seconds
        warningThreshold: 30,       // Seconds remaining to show warning (orange)
        dangerThreshold: 10,        // Seconds remaining to show danger (red)
        autoAdvance: true,          // Auto-advance to next turn when timer ends
        
        // Display settings
        fontSize: 56,
        fontFamily: "Arial",
        defaultColor: "#00FF00",    // Green
        warningColor: "#FFA500",    // Orange
        dangerColor: "#FF0000",     // Red
        pausedColor: "#AAAAAA",     // Gray when paused
        
        // Position (initial placement)
        initialLeft: 200,
        initialTop: 150,
        
        // Notifications
        announceInChat: true,       // Announce turn changes in chat
        whisperToGM: false,         // Whisper announcements to GM only
        showTimeWarnings: true,     // Show warnings at 30s and 10s
        
        // Icons/Emojis
        turnIcon: "🎯",
        timerIcon: "⏱️",
        pausedIcon: "⏸️",
        warningIcon: "⚠️"
    };

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const initializeState = function() {
        state.TurnTimerOverlay = state.TurnTimerOverlay || {};
        state.TurnTimerOverlay.config = state.TurnTimerOverlay.config || Object.assign({}, DEFAULT_CONFIG);
        state.TurnTimerOverlay.overlayId = state.TurnTimerOverlay.overlayId || null;
        state.TurnTimerOverlay.isRunning = state.TurnTimerOverlay.isRunning || false;
        state.TurnTimerOverlay.isPaused = state.TurnTimerOverlay.isPaused || false;
        state.TurnTimerOverlay.remainingTime = state.TurnTimerOverlay.remainingTime || 0;
        state.TurnTimerOverlay.currentTurnName = state.TurnTimerOverlay.currentTurnName || "";
        state.TurnTimerOverlay.savedPosition = state.TurnTimerOverlay.savedPosition || null;
    };

    const getConfig = function() {
        return state.TurnTimerOverlay.config;
    };

    const setConfig = function(key, value) {
        if (state.TurnTimerOverlay.config.hasOwnProperty(key)) {
            state.TurnTimerOverlay.config[key] = value;
            return true;
        }
        return false;
    };

    // ==========================================
    // TURN ORDER UTILITIES
    // ==========================================
    const getTurnOrder = function() {
        const turnorder = Campaign().get("turnorder");
        if (!turnorder || turnorder === "[]") {
            return [];
        }
        return JSON.parse(turnorder);
    };

    const setTurnOrder = function(turns) {
        Campaign().set("turnorder", JSON.stringify(turns));
    };

    const getCurrentTurn = function() {
        const turns = getTurnOrder();
        if (turns.length === 0) {
            return null;
        }
        return turns[0];
    };

    const getCurrentTurnName = function() {
        const currentTurn = getCurrentTurn();
        
        if (!currentTurn) {
            return "No Turn";
        }
        
        // Custom turn entry (not a token)
        if (currentTurn.id === "-1") {
            return currentTurn.custom || "Custom Turn";
        }
        
        // Token-based turn
        const token = getObj("graphic", currentTurn.id);
        if (!token) {
            return currentTurn.custom || "Unknown";
        }
        
        // Try to get character name first
        const characterId = token.get("represents");
        if (characterId) {
            const character = getObj("character", characterId);
            if (character) {
                return character.get("name");
            }
        }
        
        // Fall back to token name
        return token.get("name") || "Unnamed Token";
    };

    const advanceToNextTurn = function() {
        const turns = getTurnOrder();
        
        if (turns.length <= 1) {
            sendNotification("No more turns in the turn order!");
            return false;
        }
        
        // Move first turn to end of list
        const completedTurn = turns.shift();
        turns.push(completedTurn);
        setTurnOrder(turns);
        
        return true;
    };

    // ==========================================
    // OVERLAY MANAGEMENT
    // ==========================================
    const getOverlayPosition = function() {
        const config = getConfig();
        
        // Try to use saved position first
        if (state.TurnTimerOverlay.savedPosition) {
            return state.TurnTimerOverlay.savedPosition;
        }
        
        // Try to get position from existing overlay
        if (state.TurnTimerOverlay.overlayId) {
            const overlay = getObj("text", state.TurnTimerOverlay.overlayId);
            if (overlay) {
                return {
                    left: overlay.get("left"),
                    top: overlay.get("top")
                };
            }
        }
        
        // Fall back to default position
        return {
            left: config.initialLeft,
            top: config.initialTop
        };
    };

    const saveOverlayPosition = function() {
        if (state.TurnTimerOverlay.overlayId) {
            const overlay = getObj("text", state.TurnTimerOverlay.overlayId);
            if (overlay) {
                state.TurnTimerOverlay.savedPosition = {
                    left: overlay.get("left"),
                    top: overlay.get("top")
                };
            }
        }
    };

    const createOverlay = function(turnName, seconds, isPaused) {
        const config = getConfig();
        
        // Save position of existing overlay before removing
        saveOverlayPosition();
        
        // Remove existing overlay
        removeOverlay();
        
        const position = getOverlayPosition();
        const displayText = buildDisplayText(turnName, seconds, isPaused);
        const color = isPaused ? config.pausedColor : getColorForTime(seconds);
        
        const overlay = createObj("text", {
            _pageid: Campaign().get("playerpageid"),
            layer: "objects",
            left: position.left,
            top: position.top,
            text: displayText,
            font_size: config.fontSize,
            font_family: config.fontFamily,
            color: color,
            controlledby: "all"
        });
        
        state.TurnTimerOverlay.overlayId = overlay.id;
        
        return overlay;
    };

    const updateOverlay = function(turnName, seconds, isPaused) {
        const config = getConfig();
        
        if (!state.TurnTimerOverlay.overlayId) {
            return createOverlay(turnName, seconds, isPaused);
        }
        
        const overlay = getObj("text", state.TurnTimerOverlay.overlayId);
        if (!overlay) {
            return createOverlay(turnName, seconds, isPaused);
        }
        
        const displayText = buildDisplayText(turnName, seconds, isPaused);
        const color = isPaused ? config.pausedColor : getColorForTime(seconds);
        
        overlay.set({
            text: displayText,
            color: color
        });
        
        return overlay;
    };

    const removeOverlay = function() {
        if (state.TurnTimerOverlay.overlayId) {
            const overlay = getObj("text", state.TurnTimerOverlay.overlayId);
            if (overlay) {
                // Save position before removing
                state.TurnTimerOverlay.savedPosition = {
                    left: overlay.get("left"),
                    top: overlay.get("top")
                };
                overlay.remove();
            }
            state.TurnTimerOverlay.overlayId = null;
        }
    };

    const buildDisplayText = function(turnName, seconds, isPaused) {
        const config = getConfig();
        const timeStr = formatTime(seconds);
        
        let text = config.turnIcon + " " + turnName + "\n";
        
        if (isPaused) {
            text += config.pausedIcon + " " + timeStr + " (PAUSED)";
        } else {
            text += config.timerIcon + " " + timeStr;
        }
        
        return text;
    };

    // ==========================================
    // TIME UTILITIES
    // ==========================================
    const formatTime = function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins + ":" + (secs < 10 ? "0" : "") + secs;
    };

    const getColorForTime = function(seconds) {
        const config = getConfig();
        
        if (seconds <= config.dangerThreshold) {
            return config.dangerColor;
        } else if (seconds <= config.warningThreshold) {
            return config.warningColor;
        }
        return config.defaultColor;
    };

    // ==========================================
    // TIMER CONTROL
    // ==========================================
    let timerInterval = null;

    const startTimer = function(duration) {
        const config = getConfig();
        const turns = getTurnOrder();
        
        if (turns.length === 0) {
            sendNotification("Cannot start timer: Turn order is empty!");
            return false;
        }
        
        // Stop any existing timer
        stopTimer(true); // silent stop
        
        const turnName = getCurrentTurnName();
        const time = duration || config.defaultDuration;
        
        state.TurnTimerOverlay.isRunning = true;
        state.TurnTimerOverlay.isPaused = false;
        state.TurnTimerOverlay.remainingTime = time;
        state.TurnTimerOverlay.currentTurnName = turnName;
        
        // Create the overlay
        createOverlay(turnName, time, false);
        
        // Announce turn start
        if (config.announceInChat) {
            sendNotification(turnName + "'s turn has started! (" + formatTime(time) + ")");
        }
        
        // Start the countdown
        timerInterval = setInterval(function() {
            tick();
        }, 1000);
        
        return true;
    };

    const stopTimer = function(silent) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        state.TurnTimerOverlay.isRunning = false;
        state.TurnTimerOverlay.isPaused = false;
        state.TurnTimerOverlay.remainingTime = 0;
        
        removeOverlay();
        
        if (!silent) {
            sendNotification("Timer stopped.");
        }
    };

    const pauseTimer = function() {
        if (!state.TurnTimerOverlay.isRunning) {
            sendNotification("No timer is running.");
            return;
        }
        
        if (state.TurnTimerOverlay.isPaused) {
            // Resume
            state.TurnTimerOverlay.isPaused = false;
            updateOverlay(
                state.TurnTimerOverlay.currentTurnName,
                state.TurnTimerOverlay.remainingTime,
                false
            );
            
            timerInterval = setInterval(function() {
                tick();
            }, 1000);
            
            sendNotification("Timer resumed.");
        } else {
            // Pause
            state.TurnTimerOverlay.isPaused = true;
            
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            updateOverlay(
                state.TurnTimerOverlay.currentTurnName,
                state.TurnTimerOverlay.remainingTime,
                true
            );
            
            sendNotification("Timer paused at " + formatTime(state.TurnTimerOverlay.remainingTime));
        }
    };

    const tick = function() {
        const config = getConfig();
        
        if (!state.TurnTimerOverlay.isRunning || state.TurnTimerOverlay.isPaused) {
            return;
        }
        
        state.TurnTimerOverlay.remainingTime--;
        
        const remaining = state.TurnTimerOverlay.remainingTime;
        const turnName = state.TurnTimerOverlay.currentTurnName;
        
        // Update the overlay
        updateOverlay(turnName, remaining, false);
        
        // Time warnings
        if (config.showTimeWarnings) {
            if (remaining === config.warningThreshold) {
                sendNotification(config.warningIcon + " " + turnName + " - " + remaining + " seconds remaining!");
            } else if (remaining === config.dangerThreshold) {
                sendNotification(config.warningIcon + " " + turnName + " - " + remaining + " seconds remaining!");
            }
        }
        
        // Timer expired
        if (remaining <= 0) {
            handleTimerExpired();
        }
    };

    const handleTimerExpired = function() {
        const config = getConfig();
        const turnName = state.TurnTimerOverlay.currentTurnName;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        sendNotification(turnName + "'s turn has ended!");
        
        if (config.autoAdvance) {
            // Small delay before advancing
            setTimeout(function() {
                if (advanceToNextTurn()) {
                    // Start timer for next turn
                    startTimer();
                } else {
                    stopTimer(true);
                }
            }, 1000);
        } else {
            state.TurnTimerOverlay.isRunning = false;
            removeOverlay();
        }
    };

    const nextTurn = function() {
        if (advanceToNextTurn()) {
            const wasRunning = state.TurnTimerOverlay.isRunning;
            
            if (wasRunning) {
                startTimer();
            } else {
                sendNotification("Advanced to: " + getCurrentTurnName());
            }
        }
    };

    const previousTurn = function() {
        const turns = getTurnOrder();
        
        if (turns.length <= 1) {
            sendNotification("No previous turns available!");
            return;
        }
        
        // Move last turn to beginning
        const lastTurn = turns.pop();
        turns.unshift(lastTurn);
        setTurnOrder(turns);
        
        const wasRunning = state.TurnTimerOverlay.isRunning;
        
        if (wasRunning) {
            startTimer();
        } else {
            sendNotification("Went back to: " + getCurrentTurnName());
        }
    };

    // ==========================================
    // CHAT NOTIFICATIONS
    // ==========================================
    const sendNotification = function(message) {
        const config = getConfig();
        
        if (!config.announceInChat && !config.whisperToGM) {
            return;
        }
        
        const prefix = config.whisperToGM ? "/w gm " : "";
        sendChat("Turn Timer", prefix + message);
    };

    // ==========================================
    // CHAT COMMAND HANDLER
    // ==========================================
    const handleChatMessage = function(msg) {
        if (msg.type !== "api") return;
        
        const args = msg.content.split(" ");
        const command = args[0].toLowerCase();
        
        if (command !== "!tt" && command !== "!turntimer") {
            return;
        }
        
        const subCommand = args[1] ? args[1].toLowerCase() : "help";
        
        switch (subCommand) {
            case "start":
                const duration = parseInt(args[2]) || null;
                startTimer(duration);
                break;
                
            case "stop":
                stopTimer();
                break;
                
            case "pause":
            case "resume":
                pauseTimer();
                break;
                
            case "next":
                nextTurn();
                break;
                
            case "prev":
            case "previous":
                previousTurn();
                break;
                
            case "add":
                const addTime = parseInt(args[2]) || 30;
                if (state.TurnTimerOverlay.isRunning) {
                    state.TurnTimerOverlay.remainingTime += addTime;
                    updateOverlay(
                        state.TurnTimerOverlay.currentTurnName,
                        state.TurnTimerOverlay.remainingTime,
                        state.TurnTimerOverlay.isPaused
                    );
                    sendNotification("Added " + addTime + " seconds.");
                }
                break;
                
            case "set":
                const setTime = parseInt(args[2]);
                if (setTime && state.TurnTimerOverlay.isRunning) {
                    state.TurnTimerOverlay.remainingTime = setTime;
                    updateOverlay(
                        state.TurnTimerOverlay.currentTurnName,
                        state.TurnTimerOverlay.remainingTime,
                        state.TurnTimerOverlay.isPaused
                    );
                    sendNotification("Timer set to " + formatTime(setTime));
                }
                break;
                
            case "config":
                handleConfigCommand(args, msg);
                break;
                
            case "status":
                showStatus(msg);
                break;
                
            case "help":
            default:
                showHelp(msg);
                break;
        }
    };

    const handleConfigCommand = function(args, msg) {
        const config = getConfig();
        const setting = args[2] ? args[2].toLowerCase() : null;
        const value = args[3];
        
        if (!setting) {
            // Show current config
            let configMsg = "&{template:default} {{name=Turn Timer Config}}";
            configMsg += " {{Duration=" + config.defaultDuration + "s}}";
            configMsg += " {{Warning=" + config.warningThreshold + "s}}";
            configMsg += " {{Danger=" + config.dangerThreshold + "s}}";
            configMsg += " {{Auto Advance=" + config.autoAdvance + "}}";
            configMsg += " {{Chat Announce=" + config.announceInChat + "}}";
            configMsg += " {{Whisper GM=" + config.whisperToGM + "}}";
            sendChat("Turn Timer", "/w " + msg.who + " " + configMsg);
            return;
        }
        
        switch (setting) {
            case "duration":
                setConfig("defaultDuration", parseInt(value) || 60);
                break;
            case "warning":
                setConfig("warningThreshold", parseInt(value) || 30);
                break;
            case "danger":
                setConfig("dangerThreshold", parseInt(value) || 10);
                break;
            case "autoadvance":
                setConfig("autoAdvance", value === "true" || value === "on");
                break;
            case "announce":
                setConfig("announceInChat", value === "true" || value === "on");
                break;
            case "whisper":
                setConfig("whisperToGM", value === "true" || value === "on");
                break;
            case "fontsize":
                setConfig("fontSize", parseInt(value) || 56);
                break;
            case "reset":
                state.TurnTimerOverlay.config = Object.assign({}, DEFAULT_CONFIG);
                sendChat("Turn Timer", "/w " + msg.who + " Configuration reset to defaults.");
                return;
            default:
                sendChat("Turn Timer", "/w " + msg.who + " Unknown setting: " + setting);
                return;
        }
        
        sendChat("Turn Timer", "/w " + msg.who + " Setting updated: " + setting + " = " + value);
    };

    const showStatus = function(msg) {
        const s = state.TurnTimerOverlay;
        let statusMsg = "&{template:default} {{name=Turn Timer Status}}";
        statusMsg += " {{Running=" + s.isRunning + "}}";
        statusMsg += " {{Paused=" + s.isPaused + "}}";
        statusMsg += " {{Current Turn=" + (s.currentTurnName || "None") + "}}";
        statusMsg += " {{Time Remaining=" + formatTime(s.remainingTime) + "}}";
        sendChat("Turn Timer", "/w " + msg.who + " " + statusMsg);
    };

    const showHelp = function(msg) {
        const helpText = "/w " + msg.who + " " +
            "&{template:default} {{name=Turn Timer Help}}" +
            " {{!tt start [seconds]=Start timer (default: 60s)}}" +
            " {{!tt stop=Stop timer and remove overlay}}" +
            " {{!tt pause=Pause/Resume timer}}" +
            " {{!tt next=Advance to next turn}}" +
            " {{!tt prev=Go to previous turn}}" +
            " {{!tt add [seconds]=Add time to current timer}}" +
            " {{!tt set [seconds]=Set timer to specific time}}" +
            " {{!tt status=Show current status}}" +
            " {{!tt config=Show/change settings}}" +
            " {{Config Options=duration, warning, danger, autoadvance, announce, whisper, fontsize, reset}}";
        
        sendChat("Turn Timer", helpText);
    };

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    const handleTurnOrderChange = function() {
        // Only update if timer is running and not paused
        if (state.TurnTimerOverlay.isRunning && !state.TurnTimerOverlay.isPaused) {
            const newTurnName = getCurrentTurnName();
            
            // Check if turn actually changed (not just reordering)
            if (newTurnName !== state.TurnTimerOverlay.currentTurnName) {
                // Turn changed externally (e.g., via Roll20 UI)
                state.TurnTimerOverlay.currentTurnName = newTurnName;
                state.TurnTimerOverlay.remainingTime = getConfig().defaultDuration;
                
                updateOverlay(newTurnName, state.TurnTimerOverlay.remainingTime, false);
                sendNotification(newTurnName + "'s turn! (" + formatTime(state.TurnTimerOverlay.remainingTime) + ")");
            }
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================
    const registerEventHandlers = function() {
        on("chat:message", handleChatMessage);
        on("change:campaign:turnorder", handleTurnOrderChange);
    };

    const checkVersion = function() {
        log("=".repeat(50));
        log("Turn Timer Overlay v1.0 loaded successfully!");
        log("Type !tt help for commands");
        log("=".repeat(50));
    };

    // ==========================================
    // PUBLIC API
    // ==========================================
    return {
        init: function() {
            initializeState();
            registerEventHandlers();
            checkVersion();
        },
        
        // Expose methods for external scripts
        start: startTimer,
        stop: stopTimer,
        pause: pauseTimer,
        next: nextTurn,
        previous: previousTurn,
        getCurrentTurnName: getCurrentTurnName,
        getConfig: getConfig,
        setConfig: setConfig
    };
})();

// ==========================================
// READY EVENT
// ==========================================
on("ready", function() {
    TurnTimerOverlay.init();
});
