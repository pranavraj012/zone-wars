# Level Selection System Guide

## ✅ How It Works

### 1. **Game Start Flow**
```
Main Menu (shows automatically on load)
    ↓
Press ENTER on "Start Game"
    ↓
Level Selection Screen (4 themes in 2x2 grid)
    ↓
Use Arrow Keys to select theme
    ↓
Press ENTER to start game with selected theme
    ↓
Game plays with chosen visual theme
```

### 2. **Four Visual Themes**

All themes use the **EXACT SAME PLATFORM LAYOUT** - only visuals change!

#### 🌙 Classic Arena
- Background: Dark blue (#2a2a3e)
- Platforms: Gray (#666)
- No particles
- Default theme

#### ☀️ Sunny Desert
- Background: Sky blue gradient (#87CEEB)
- Platforms: Sandy brown (#D2691E)
- Animated sun with rays
- Floating clouds
- Golden sparkle particles

#### ❄️ Frozen Tundra
- Background: Deep cold blue (#1a3a52)
- Platforms: Ice blue (#B0E0E6)
- Northern lights effect
- Ice crystal decorations
- Falling snowflakes

#### 🔥 Volcanic Cavern
- Background: Dark red (#2e1a1a)
- Platforms: Dark stone (#6b3636)
- Glowing lava cracks
- Animated lava bubbles
- Rising ember particles

### 3. **Platform Layout (Same for All Themes)**

```
   [ZONE D]           [ZONE E]      <- Upper level
        \               /
         \             /
          [platforms]               <- Mid level
             \     /
         [ZONE C - Center]          <- Main hill
            /       \
           /         \
    [ZONE A]         [ZONE B]       <- Ground level
```

**Total Platforms:** 16 platforms
- **5 capture zones** (colored with capture bars)
- **11 movement platforms** (regular platforms in theme color)

**All zones are reachable** - the layout is tested and balanced!

### 4. **Controls**

**Main Menu:**
- W/S or Arrow Up/Down: Navigate menu
- Enter: Select

**Level Selection:**
- Arrow Keys (all 4 directions): Navigate 2x2 grid
- Enter: Select theme and start
- ESC: Go back to main menu

**In Game:**
- ESC: Pause
- Player 1: A/D move, W jump, Shift shoot
- Player 2: Arrows move/jump, Enter shoot

**Pause Menu:**
- ESC: Resume
- M: Return to main menu (can select different theme!)
- R: Restart current match

### 5. **Debug Console Logs**

Open browser console (F12) to see:
- "Selected menu item: 0" when clicking Start Game
- "Showing level select screen"
- "Level list: [...]" showing all 4 themes
- "Rendering level select" when drawing the selection screen
- "Selected level: {...}" when you pick a theme
- "Loading level: [Theme Name]"
- "Created platforms: 16"

## 🎮 Testing Checklist

1. Open `index.html` in browser
2. Main menu should appear
3. Press Enter on "Start Game"
4. See 4 theme cards in 2x2 grid
5. Arrow keys highlight different themes
6. Selected theme has gold border and "SELECTED" text
7. Press Enter to start
8. Game loads with correct theme visuals
9. All 5 zones are reachable and colored
10. Regular platforms match theme color
11. Press ESC to pause
12. Press M to return to menu
13. Select different theme
14. New theme's visuals apply to same platform layout

## 🔧 Technical Details

### File Structure
- `LevelManager.js`: Handles all 4 themes and creates platforms
- `UIManager.js`: Renders level selection screen
- `Game.js`: Loads platforms from LevelManager

### Key Methods
- `LevelManager.createPlatforms()`: Creates the 16-platform layout (same for all)
- `LevelManager.getCurrentLevel()`: Gets current theme data
- `LevelManager.renderBackground()`: Draws theme-specific background
- `Game.loadCurrentLevel()`: Loads platforms when theme changes
- `UIManager.renderLevelSelect()`: Draws the 2x2 theme selection grid

### Platform Coordinates (Fixed for All Themes)
```javascript
// Ground
Platform(0, 570, 1200, 30) - Full width ground

// Zone A - Lower Left
Platform(80, 520, 140, 20)   - Step
Platform(80, 480, 140, 35)   - ZONE A (Gold)

// Zone B - Lower Right  
Platform(980, 520, 140, 20)  - Step
Platform(980, 480, 140, 35)  - ZONE B (Lime)

// Center climb supports
Platform(280, 470, 100, 15)
Platform(820, 470, 100, 15)

// Mid platforms
Platform(320, 390, 120, 20)
Platform(760, 390, 120, 20)

// ZONE C - Center (Cyan)
Platform(520, 340, 160, 35)

// Upper platforms
Platform(200, 250, 100, 20)
Platform(900, 250, 100, 20)

// ZONE D - Upper Left (Magenta)
Platform(340, 200, 120, 35)

// ZONE E - Upper Right (Orange)
Platform(740, 200, 120, 35)

// Access platforms
Platform(450, 280, 80, 15)
Platform(670, 280, 80, 15)
```

All coordinates are identical across all 4 themes!
