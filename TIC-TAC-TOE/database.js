/* ==========================================================
   database.js - a tiny "database" built on localStorage.
   It saves each player's win/loss/draw totals and a history
   of recent games, so the data survives page refreshes.
   ========================================================== */

class GameDatabase {
  // Constructor: set the storage key and load any saved data
  constructor(storageKey = "ticTacToeDB") {
    this.storageKey = storageKey;
    this.data = this.load();               // OBJECT: { players: {...}, history: [...] }
  }

  // Read saved data from localStorage (or start with an empty database)
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.log("Database could not be loaded:", err.message);
    }
    return { players: {}, history: [] };
  }

  // Write the current data back to localStorage
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (err) {
      console.log("Database could not be saved:", err.message);
    }
  }

  // Get a player's record, creating it the first time the name is used
  getPlayer(name) {
    if (!this.data.players[name]) {
      this.data.players[name] = { win: 0, loss: 0, draw: 0 };
    }
    return this.data.players[name];
  }

  // Save one finished game. result is "win", "loss" or "draw"
  recordResult(name, result) {
    this.getPlayer(name)[result]++;                    // update the player's totals
    this.data.history.push({                           // add a history row
      player: name,
      result: result,
      time: new Date().toLocaleTimeString()
    });
    this.data.history = this.data.history.slice(-20);  // keep only the last 20 games
    this.save();
    console.log(`Database saved: ${name} -> ${result}`);
  }

  // Get the most recent games for one player (newest first)
  getHistory(name, count = 5) {
    return this.data.history
      .filter(row => row.player === name)              // HIGHER-ORDER: filter
      .slice(-count)
      .reverse();
  }

  // Delete everything
  clear() {
    this.data = { players: {}, history: [] };
    this.save();
    console.log("Database cleared.");
  }
}