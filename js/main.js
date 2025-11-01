// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    console.log('=== 2-Player Domination Game v4.0 - LOADED ===');
    console.log('Press ENTER on "Start Game" to see level selection');
    
    // Start the game loop
    game.run();
});
