//! Swarm - Main entry point for P2P networking

use crate::dht::{Dht, DhtConfig};
use crate::noise::NoiseSession;
use crate::peer::{Peer, PeerId, PeerInfo};
use crate::transport::{Connection, Transport};
use crate::{Error, Result};

use bytes::Bytes;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::{mpsc, RwLock};

/// Topic - a 32-byte identifier for peer discovery
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct Topic([u8; 32]);

impl Topic {
    /// Create a topic from raw bytes
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create a topic by hashing a string
    pub fn from_string(s: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(s.as_bytes());
        let result = hasher.finalize();
        let mut topic = [0u8; 32];
        topic.copy_from_slice(&result);
        Self(topic)
    }

    /// Get the raw bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

/// Configuration for the swarm
#[derive(Clone)]
pub struct SwarmConfig {
    /// Local device ID
    pub device_id: String,
    /// Bootstrap nodes for DHT
    pub bootstrap_nodes: Vec<SocketAddr>,
    /// Port to listen on (0 for random)
    pub listen_port: u16,
    /// Enable server mode (accept incoming connections)
    pub server: bool,
    /// Enable client mode (make outgoing connections)
    pub client: bool,
}

impl Default for SwarmConfig {
    fn default() -> Self {
        Self {
            device_id: uuid::Uuid::new_v4().to_string(),
            bootstrap_nodes: vec![],
            listen_port: 0,
            server: true,
            client: true,
        }
    }
}

/// Events emitted by the swarm
#[derive(Debug, Clone)]
pub enum SwarmEvent {
    /// Swarm is ready and listening
    Ready { address: SocketAddr },
    /// A new peer connected
    PeerConnected { peer_id: PeerId, address: SocketAddr },
    /// A peer disconnected
    PeerDisconnected { peer_id: PeerId },
    /// Data received from a peer
    Data { peer_id: PeerId, data: Bytes },
    /// Error occurred
    Error { message: String },
}

/// The main Swarm manager
pub struct Swarm {
    config: SwarmConfig,
    local_peer_id: PeerId,
    dht: Arc<RwLock<Dht>>,
    transport: Arc<Transport>,
    peers: Arc<RwLock<HashMap<PeerId, Arc<Peer>>>>,
    topics: Arc<RwLock<HashMap<Topic, bool>>>,
    event_tx: mpsc::Sender<SwarmEvent>,
    event_rx: Option<mpsc::Receiver<SwarmEvent>>,
    running: Arc<RwLock<bool>>,
}

impl Swarm {
    /// Create a new swarm
    pub fn new(config: SwarmConfig) -> Result<Self> {
        // Generate local peer ID from device ID
        let local_peer_id = PeerId::from_public_key(config.device_id.as_bytes());

        // Create DHT
        let dht_config = DhtConfig {
            bootstrap_nodes: config.bootstrap_nodes.clone(),
            node_id: *local_peer_id.as_bytes(),
        };
        let dht = Dht::new(dht_config);

        // Create transport
        let transport = Transport::new(config.listen_port)?;

        // Create event channel
        let (event_tx, event_rx) = mpsc::channel(100);

        Ok(Self {
            config,
            local_peer_id,
            dht: Arc::new(RwLock::new(dht)),
            transport: Arc::new(transport),
            peers: Arc::new(RwLock::new(HashMap::new())),
            topics: Arc::new(RwLock::new(HashMap::new())),
            event_tx,
            event_rx: Some(event_rx),
            running: Arc::new(RwLock::new(false)),
        })
    }

    /// Get the local peer ID
    pub fn local_peer_id(&self) -> PeerId {
        self.local_peer_id
    }

    /// Take the event receiver (can only be called once)
    pub fn take_event_receiver(&mut self) -> Option<mpsc::Receiver<SwarmEvent>> {
        self.event_rx.take()
    }

    /// Start the swarm
    pub async fn start(&self) -> Result<()> {
        let mut running = self.running.write().await;
        if *running {
            return Err(Error::AlreadyConnected);
        }
        *running = true;
        drop(running);

        // Start transport listener
        let local_addr = self.transport.start().await?;

        // Emit ready event
        let _ = self.event_tx.send(SwarmEvent::Ready { address: local_addr }).await;

        // Start DHT
        self.dht.write().await.start().await?;

        // Start connection handler
        self.spawn_connection_handler();

        Ok(())
    }

    /// Stop the swarm
    pub async fn stop(&self) -> Result<()> {
        let mut running = self.running.write().await;
        if !*running {
            return Ok(());
        }
        *running = false;

        // Close all peer connections
        let peers = self.peers.read().await;
        for (peer_id, _) in peers.iter() {
            let _ = self.event_tx.send(SwarmEvent::PeerDisconnected { peer_id: *peer_id }).await;
        }
        drop(peers);

        self.peers.write().await.clear();

        // Stop DHT
        self.dht.write().await.stop().await;

        Ok(())
    }

    /// Join a topic for peer discovery
    pub async fn join(&self, topic: Topic) -> Result<()> {
        let running = self.running.read().await;
        if !*running {
            return Err(Error::SwarmNotRunning);
        }
        drop(running);

        // Register topic
        self.topics.write().await.insert(topic, true);

        // Announce on DHT
        self.dht.write().await.announce(topic.as_bytes()).await?;

        // Look for peers
        self.spawn_peer_discovery(topic);

        Ok(())
    }

    /// Leave a topic
    pub async fn leave(&self, topic: Topic) -> Result<()> {
        self.topics.write().await.remove(&topic);
        self.dht.write().await.unannounce(topic.as_bytes()).await?;
        Ok(())
    }

    /// Send data to a specific peer
    pub async fn send(&self, peer_id: PeerId, data: Bytes) -> Result<()> {
        let peers = self.peers.read().await;
        let peer = peers.get(&peer_id).ok_or(Error::PeerNotFound(peer_id.short()))?;
        peer.send(data).await
    }

    /// Broadcast data to all connected peers
    pub async fn broadcast(&self, data: Bytes) -> Result<()> {
        let peers = self.peers.read().await;
        for peer in peers.values() {
            let _ = peer.send(data.clone()).await;
        }
        Ok(())
    }

    /// Get list of connected peers
    pub async fn connected_peers(&self) -> Vec<PeerInfo> {
        let peers = self.peers.read().await;
        peers.values().map(|p| p.info.clone()).collect()
    }

    /// Check if swarm is running
    pub async fn is_running(&self) -> bool {
        *self.running.read().await
    }

    // Internal: spawn connection handler task
    fn spawn_connection_handler(&self) {
        let transport = self.transport.clone();
        let peers = self.peers.clone();
        let event_tx = self.event_tx.clone();
        let running = self.running.clone();

        tokio::spawn(async move {
            while *running.read().await {
                match transport.accept().await {
                    Ok(conn) => {
                        let peers = peers.clone();
                        let event_tx = event_tx.clone();

                        tokio::spawn(async move {
                            if let Err(e) = Self::handle_connection(conn, peers, event_tx).await {
                                log::error!("Connection error: {}", e);
                            }
                        });
                    }
                    Err(e) => {
                        log::error!("Accept error: {}", e);
                    }
                }
            }
        });
    }

    // Internal: handle a new connection
    async fn handle_connection(
        conn: Connection,
        peers: Arc<RwLock<HashMap<PeerId, Arc<Peer>>>>,
        event_tx: mpsc::Sender<SwarmEvent>,
    ) -> Result<()> {
        // Perform Noise handshake
        let mut noise = NoiseSession::new_responder()?;
        let (peer_id, mut secure_conn) = noise.handshake(conn).await?;

        // Create peer
        let (tx, mut rx) = mpsc::channel(100);
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let info = PeerInfo {
            id: peer_id,
            address: secure_conn.remote_addr(),
            is_initiator: false,
            connected_at: now,
            bytes_sent: 0,
            bytes_received: 0,
        };

        let peer = Arc::new(Peer::new(info, tx));
        peers.write().await.insert(peer_id, peer.clone());

        // Emit connected event
        let _ = event_tx.send(SwarmEvent::PeerConnected {
            peer_id,
            address: secure_conn.remote_addr(),
        }).await;

        // Spawn send task
        let send_conn = secure_conn.clone();
        tokio::spawn(async move {
            while let Some(data) = rx.recv().await {
                if send_conn.send(&data).await.is_err() {
                    break;
                }
            }
        });

        // Receive loop
        loop {
            match secure_conn.recv().await {
                Ok(data) => {
                    let _ = event_tx.send(SwarmEvent::Data {
                        peer_id,
                        data: Bytes::from(data),
                    }).await;
                }
                Err(_) => break,
            }
        }

        // Peer disconnected
        peers.write().await.remove(&peer_id);
        let _ = event_tx.send(SwarmEvent::PeerDisconnected { peer_id }).await;

        Ok(())
    }

    // Internal: spawn peer discovery task
    fn spawn_peer_discovery(&self, topic: Topic) {
        let dht = self.dht.clone();
        let transport = self.transport.clone();
        let peers = self.peers.clone();
        let event_tx = self.event_tx.clone();
        let running = self.running.clone();
        let local_peer_id = self.local_peer_id;

        tokio::spawn(async move {
            while *running.read().await {
                // Look up peers on DHT
                let peer_addrs = match dht.read().await.lookup(topic.as_bytes()).await {
                    Ok(addrs) => addrs,
                    Err(e) => {
                        log::error!("DHT lookup error: {}", e);
                        tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
                        continue;
                    }
                };

                // Try to connect to each peer
                for addr in peer_addrs {
                    // Skip if already connected
                    let existing_peers = peers.read().await;
                    let already_connected = existing_peers.values()
                        .any(|p| p.info.address == addr);
                    drop(existing_peers);

                    if already_connected {
                        continue;
                    }

                    // Connect
                    match transport.connect(addr).await {
                        Ok(conn) => {
                            let peers = peers.clone();
                            let event_tx = event_tx.clone();

                            tokio::spawn(async move {
                                if let Err(e) = Self::handle_outgoing_connection(
                                    conn, peers, event_tx
                                ).await {
                                    log::error!("Outgoing connection error: {}", e);
                                }
                            });
                        }
                        Err(e) => {
                            log::debug!("Failed to connect to {}: {}", addr, e);
                        }
                    }
                }

                // Wait before next lookup
                tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;
            }
        });
    }

    // Internal: handle outgoing connection
    async fn handle_outgoing_connection(
        conn: Connection,
        peers: Arc<RwLock<HashMap<PeerId, Arc<Peer>>>>,
        event_tx: mpsc::Sender<SwarmEvent>,
    ) -> Result<()> {
        // Perform Noise handshake as initiator
        let mut noise = NoiseSession::new_initiator()?;
        let (peer_id, mut secure_conn) = noise.handshake(conn).await?;

        // Create peer
        let (tx, mut rx) = mpsc::channel(100);
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let info = PeerInfo {
            id: peer_id,
            address: secure_conn.remote_addr(),
            is_initiator: true,
            connected_at: now,
            bytes_sent: 0,
            bytes_received: 0,
        };

        let peer = Arc::new(Peer::new(info, tx));
        peers.write().await.insert(peer_id, peer.clone());

        // Emit connected event
        let _ = event_tx.send(SwarmEvent::PeerConnected {
            peer_id,
            address: secure_conn.remote_addr(),
        }).await;

        // Spawn send task
        let send_conn = secure_conn.clone();
        tokio::spawn(async move {
            while let Some(data) = rx.recv().await {
                if send_conn.send(&data).await.is_err() {
                    break;
                }
            }
        });

        // Receive loop
        loop {
            match secure_conn.recv().await {
                Ok(data) => {
                    let _ = event_tx.send(SwarmEvent::Data {
                        peer_id,
                        data: Bytes::from(data),
                    }).await;
                }
                Err(_) => break,
            }
        }

        // Peer disconnected
        peers.write().await.remove(&peer_id);
        let _ = event_tx.send(SwarmEvent::PeerDisconnected { peer_id }).await;

        Ok(())
    }
}

// UUID generation (simple implementation)
mod uuid {
    use rand::Rng;

    pub struct Uuid([u8; 16]);

    impl Uuid {
        pub fn new_v4() -> Self {
            let mut bytes = [0u8; 16];
            rand::thread_rng().fill(&mut bytes);
            // Set version (4) and variant (RFC 4122)
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;
            Self(bytes)
        }

        pub fn to_string(&self) -> String {
            format!(
                "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
                self.0[0], self.0[1], self.0[2], self.0[3],
                self.0[4], self.0[5],
                self.0[6], self.0[7],
                self.0[8], self.0[9],
                self.0[10], self.0[11], self.0[12], self.0[13], self.0[14], self.0[15]
            )
        }
    }
}
