import { io } from "socket.io-client";
import { EventBus } from "./EventBus";

class NetworkManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.isHost = false;
        this.players = []; 
        this.playerName = "Agent Inconnu"; 
        
        // LOGIQUE IP AUTOMATIQUE 
        const hostname = window.location.hostname;
        this.serverUrl = `http://${hostname}:3000`;
    }

    connect() {
        if (this.socket) return;

        console.log("Tentative de connexion Socket vers :", this.serverUrl);
        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
            console.log("Connecté au serveur Socket.io ! ID:", this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error("Erreur de connexion Socket:", err);
        });

        this.socket.on('player-joined', (data) => {
            console.log("Un joueur a rejoint !", data);
            EventBus.emit('player-joined', data);
        });

        this.socket.on('player-left', () => {
            console.log("Un joueur est parti !");
            EventBus.emit('player-left');
        });

        this.socket.on('update-room-players', (playersList) => {
            console.log("Mise à jour liste joueurs reçue :", playersList);
            this.players = playersList; 
            EventBus.emit('update-room-players', playersList);
        });

        this.socket.on('game-update', (data) => {
            EventBus.emit('network-action', data);
        });

        this.socket.on('game-started', () => {
            console.log("GO ! Tout le monde part !");
            EventBus.emit('game-started'); 
        });

        this.socket.on('update-ready-count', (data) => {
            EventBus.emit('update-ready-count', data);
        });

        this.socket.on('all-players-ready', () => {
            EventBus.emit('all-players-ready');
        });

        this.socket.on('room-closed', (reason) => {
            EventBus.emit('room-closed', reason);
        });
    }

    // CreateRoom prend maintenant un playerName
    createRoom(playerName) {
        if (!this.socket) this.connect();
        this.players = []; 
        this.playerName = playerName; 
        this.socket.emit('create-room', playerName);
        this.isHost = true;

        return new Promise((resolve) => {
            this.socket.once('room-created', (code) => {
                this.roomCode = code;
                resolve(code);
            });
        });
    }

    // JoinRoom prend maintenant code ET playerName
    joinRoom(code, playerName) {
        if (!this.socket) this.connect();
        this.players = []; 
        this.playerName = playerName; 
        this.socket.emit('join-room', { roomCode: code, playerName: playerName });
        this.isHost = false;

        return new Promise((resolve, reject) => {
            this.socket.once('join-success', (roomCode) => {
                this.roomCode = roomCode;
                resolve(true);
            });
            
            this.socket.once('error', (msg) => {
                reject(msg);
            });
        });
    }

    sendStartGame() {
        if (this.socket && this.roomCode) {
            this.socket.emit('start-game', this.roomCode);
        }
    }

    sendPlayerReady() {
        if (this.socket && this.roomCode) {
            this.socket.emit('player-ready', this.roomCode);
        }
    }

    sendAction(actionName, payload = {}) {
        if (this.socket && this.roomCode) {
            this.socket.emit('game-action', {
                roomCode: this.roomCode,
                action: actionName,
                payload: payload
            });
        }
    }

    leaveRoom() {
        if (this.socket && this.roomCode) {
            this.socket.emit('leave-room', this.roomCode);
            this.roomCode = null;
            this.isHost = false;
            this.players = []; 
        }
    }
}

export const Network = new NetworkManager();