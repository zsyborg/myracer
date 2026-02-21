"""
Flask-SocketIO Server for Multiplayer 2D Racing Game

This server handles real-time multiplayer functionality for a 2D racing game
using Flask and Flask-SocketIO. It manages player connections, positions,
and broadcasts game events to all connected clients.
"""

import random
import os
from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit

# =============================================================================
# FLASK APPLICATION SETUP
# =============================================================================

# Create Flask application instance
app = Flask(__name__, 
            template_folder='static',
            static_folder='static')

# Configure Flask-SocketIO
# secret_key is required for Flask-SocketIO sessions
app.config['SECRET_KEY'] = 'racing-game-secret-key-12345'

# Initialize SocketIO with the Flask app
# cors_allowed_origins="*" allows connections from any origin (for development)
socketio = SocketIO(app, cors_allowed_origins="*")

# =============================================================================
# GAME STATE - PLAYER DICTIONARY
# =============================================================================

# Dictionary to store all connected players
# Key: player_id (socket ID), Value: {x, y, car_image}
# This is the main game state that gets synchronized across all clients
players = {}

# Track canvas/track dimensions for random player positioning
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# List of available car images
CAR_IMAGES = ['car1.png', 'car2.png', 'car3.png']

def get_random_car_image():
    """
    Select a random car image for a new player.
    Returns the filename of the car image.
    """
    return random.choice(CAR_IMAGES)

def get_random_position():
    """
    Generate a random starting position for a new player.
    Returns tuple (x, y) with some margin from edges.
    """
    # Keep players away from the very edges of the canvas
    margin = 50
    x = random.randint(margin, CANVAS_WIDTH - margin)
    y = random.randint(margin, CANVAS_HEIGHT - margin)
    return (x, y)

# =============================================================================
# HTTP ROUTES
# =============================================================================

@app.route('/')
def index():
    """
    Serve the main HTML game page at the root route.
    This is the entry point for the game.
    """
    return render_template('index.html')

# =============================================================================
# SOCKET.IO EVENT HANDLERS
# =============================================================================

@socketio.on('connect')
def handle_connect():
    """
    Event handler for when a client connects to the server.
    This is triggered when a new WebSocket connection is established.
    """
    print(f'Client connected: {request.sid}')
    # Note: We don't add players here - they must explicitly join via join_game

@socketio.on('disconnect')
def handle_disconnect():
    """
    Event handler for when a client disconnects from the server.
    Removes the player from the game and notifies all other clients.
    """
    player_id = request.sid
    
    # Check if the disconnected client was a player in the game
    if player_id in players:
        # Remove player from the game state
        player_data = players.pop(player_id)
        print(f'Player left: {player_id} (car: {player_data["car_image"]})')
        
        # Broadcast to all remaining clients that this player left
        emit('player_left', {'player_id': player_id}, broadcast=True)

@socketio.on('join_game')
def handle_join_game():
    """
    Event handler for when a player joins the game.
    
    When a player joins:
    1. Assign them a unique ID (their socket ID)
    2. Assign a random car image to their car
    3. Place them at a random starting position
    4. Send all existing players to the new player
    5. Broadcast the new player to all other players
    """
    player_id = request.sid
    
    # Generate random car image and position for the new player
    car_image = get_random_car_image()
    x, y = get_random_position()
    
    # Create player data dictionary
    player_data = {
        'id': player_id,
        'x': x,
        'y': y,
        'car_image': car_image
    }
    
    # Store player in the game state
    players[player_id] = player_data
    
    print(f'Player joined: {player_id} (car: {car_image}, position: ({x}, {y}))')
    
    # Send all existing players to the new player (so they can see everyone)
    emit('player_joined', {'all_players': players}, room=request.sid)
    
    # Broadcast the new player to all OTHER players (not back to sender)
    emit('player_joined', {'player': player_data}, broadcast=True, include_self=False)

@socketio.on('player_move')
def handle_player_move(data):
    """
    Event handler for when a player moves.
    
    Data expected: {'x': float, 'y': float}
    
    Updates the player's position in the server state and
    broadcasts the movement to all other players.
    """
    player_id = request.sid
    
    # Verify the player exists in our game state
    if player_id not in players:
        return  # Ignore moves from players who haven't joined
    
    # Extract new position from the data
    new_x = data.get('x')
    new_y = data.get('y')
    
    # Validate the position data
    if new_x is None or new_y is None:
        return
    
    # Update player position in server state
    players[player_id]['x'] = new_x
    players[player_id]['y'] = new_y
    
    # Broadcast the movement to all OTHER players
    # include_self=False means the moving player doesn't receive their own update
    emit('player_moved', {
        'player_id': player_id,
        'x': new_x,
        'y': new_y
    }, broadcast=True, include_self=False)

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@socketio.on_error()
def error_handler(e):
    """
    Global error handler for Socket.IO events.
    Logs errors for debugging purposes.
    """
    print(f'SocketIO Error: {e}')

@socketio.on_error_default
def default_error_handler(e):
    """
    Default error handler for Socket.IO events.
    Logs errors that aren't caught by specific handlers.
    """
    print(f'SocketIO Default Error: {e}')

# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == '__main__':
    """
    Start the Flask-SocketIO server.
    
    The server runs on host '0.0.0.0' to accept connections from any network interface.
    Port 5000 is the default Flask port.
    debug=True enables debug mode for development (shows detailed error messages).
    """
    print('=' * 60)
    print('Multiplayer Racing Game Server')
    print('=' * 60)
    print('Starting server on http://localhost:5000')
    print('Press Ctrl+C to stop the server')
    print('=' * 60)
    
    # Run the SocketIO server
    # debug=True enables auto-reload and detailed error pages
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
