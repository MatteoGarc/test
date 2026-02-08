const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 

const app = express();
const server = http.createServer(app);

const PORT = 3000;
const MAX_PLAYERS = 5; 

// Config Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');

// --- FONCTIONS UTILITAIRES ---

// Lire les scores
const getScores = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur de lecture:", err);
        return [];
    }
};

//ecrire les scores
const saveScores = (scores) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
    } catch (err) {
        console.error("Erreur d'écriture:", err);
    }
};

// --- ROUTES API ---

// récupérer les scores
app.get('/api/scores', (req, res) => {
    let scores = getScores();
    scores.sort((a, b) => a.temps - b.temps);
    res.json(scores.slice(0, 10));
});

// enregistrer un nouveau score
app.post('/api/score', (req, res) => {
    const { pseudo, temps } = req.body;
    if (!pseudo || !temps) {
        return res.status(400).json({ error: "Pseudo et temps requis" });
    }
    const newScore = {
        pseudo: pseudo,
        temps: parseInt(temps),
        date: new Date().toISOString()
    };
    const scores = getScores();
    scores.push(newScore);
    saveScores(scores);
    console.log(`Nouveau score enregistré : ${pseudo} - ${temps}s`);
    res.json({ success: true, message: "Score sauvegardé" });
});

// --- GESTION SOCKET.IO (MULTIJOUEUR) ---

// Stockage des salles en mémoire
const rooms = {};

io.on('connection', (socket) => {
    console.log(`[Socket] Nouvelle connexion : ${socket.id}`);

    // Créer une salle
    socket.on('create-room', (playerName) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        rooms[roomCode] = {
            hostId: socket.id,
            players: [{ id: socket.id, name: playerName || "Agent 1" }], // Ajout Nom
            readyPlayers: new Set()
        };
        
        socket.join(roomCode);
        socket.emit('room-created', roomCode);
        
        // Envoi immédiat de la liste
        io.to(roomCode).emit('update-room-players', rooms[roomCode].players);
        
        console.log(`[+] Salle créée : ${roomCode} (Hôte: ${socket.id})`);
        console.log(`Current Rooms:`, Object.keys(rooms)); // DEBUG
    });

    // Rejoindre une salle
    socket.on('join-room', (data) => {
        // data peut être { roomCode, playerName }
        const roomCode = typeof data === 'object' ? data.roomCode : data;
        const name = (typeof data === 'object' ? data.playerName : null) || "Agent X";

        // On nettoie l'entrée (Majuscule + supprime les espaces invisibles)
        const code = (roomCode || "").trim().toUpperCase();
        console.log(`[?] Tentative de rejoindre : '${code}' par ${socket.id}`);
        console.log(`Sales disponibles :`, Object.keys(rooms)); // DEBUG

        if (rooms[code]) {
            // VÉRIFICATION LIMITE
            if (rooms[code].players.length >= MAX_PLAYERS) {
                socket.emit('error', "La salle est pleine (Max 5).");
                return;
            }

            socket.join(code);
            rooms[code].players.push({ id: socket.id, name: name }); // Ajout Nom
            
            // Notifier l'hôte (optionnel)
            io.to(rooms[code].hostId).emit('player-joined', { playerId: socket.id });

            // Mise à jour de la liste pour tout le monde
            io.to(code).emit('update-room-players', rooms[code].players);
            
            // Confirmer au joueur
            socket.emit('join-success', code);
            console.log(`[V] Succès : Joueur a rejoint ${code}`);
        } else {
            console.log(`[X] Erreur : Salle introuvable`);
            socket.emit('error', 'Code invalide ou salle fermée.');
        }
    });

    socket.on('start-game', (roomCode) => {
        console.log(`[!] Lancement de la partie dans la salle ${roomCode}`);
        // On envoie le signal 'game-started' à TOUT LE MONDE dans la salle
        io.to(roomCode).emit('game-started');
    });

    // Quitter la salle
    socket.on('leave-room', (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;

        // Si c'est l'hôte qui part
        if (socket.id === room.hostId) {
            console.log(`[EXIT] L'hôte a fermé la salle ${roomCode}`);
            io.to(roomCode).emit('room-closed', "Le chef de mission a abandonné le poste.");
            delete rooms[roomCode];
        } 
        // Si c'est un simple joueur
        else {
            console.log(`[EXIT] Un joueur quitte la salle ${roomCode}`);
            socket.to(roomCode).emit('player-left');
            
            room.players = room.players.filter(p => p.id !== socket.id);
            if (room.readyPlayers) room.readyPlayers.delete(socket.id);
            
            socket.leave(roomCode);
            
            // Mise à jour de la liste pour les restants
            io.to(roomCode).emit('update-room-players', room.players);
        }
    });

    socket.on('player-ready', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            // On initialise le Set des joueurs prêts si besoin
            if (!room.readyPlayers) room.readyPlayers = new Set();
            
            // On ajoute ce joueur à la liste des prêts
            room.readyPlayers.add(socket.id);

            const readyCount = room.readyPlayers.size;
            const totalPlayers = room.players.length;

            console.log(`[Wait] Salle ${roomCode} : ${readyCount}/${totalPlayers} prêts.`);

            // On dit à tout le monde d'afficher "1/2"
            io.to(roomCode).emit('update-ready-count', { ready: readyCount, total: totalPlayers });

            // Si tout le monde est là, on lance VRAIMENT le jeu
            if (readyCount >= totalPlayers) {
                console.log(`[GO] Tout le monde est prêt dans ${roomCode} !`);
                io.to(roomCode).emit('all-players-ready');
            }
        }
    });

    // Relayer les actions de jeu
    socket.on('game-action', (data) => {
        const { roomCode, action, payload } = data;
        // Envoi à tous sauf l'expéditeur
        socket.to(roomCode).emit('game-update', { action, payload });
    });

    socket.on('disconnect', () => {
        console.log(`Déconnexion Socket : ${socket.id}`);
        // TODO: Gérer la déconnexion brutale (supprimer de la liste players)
    });
});

// DÉMARRAGE SERVEUR 

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Serveur Backend démarré sur http://localhost:${PORT}`);
        console.log(`Fichier de données visé : ${DATA_FILE}`);
        console.log(`Socket.io est prêt`);
    });
}

module.exports = app;