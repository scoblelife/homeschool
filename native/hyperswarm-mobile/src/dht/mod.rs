//! DHT - Kademlia-based Distributed Hash Table
//!
//! Implements peer discovery using a Kademlia DHT with:
//! - XOR distance metric
//! - K-buckets for routing
//! - Iterative lookups
//! - Topic announcements

mod routing;
mod rpc;

use crate::{Error, Result};
use routing::RoutingTable;
use rpc::{DhtRpc, RpcMessage};

use std::collections::HashSet;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::UdpSocket;
use tokio::sync::RwLock;

/// DHT configuration
#[derive(Clone)]
pub struct DhtConfig {
    /// Bootstrap nodes to connect to initially
    pub bootstrap_nodes: Vec<SocketAddr>,
    /// Local node ID (32 bytes)
    pub node_id: [u8; 32],
}

/// DHT instance for peer discovery
pub struct Dht {
    config: DhtConfig,
    routing_table: Arc<RwLock<RoutingTable>>,
    socket: Option<Arc<UdpSocket>>,
    rpc: Option<Arc<DhtRpc>>,
    announcements: Arc<RwLock<HashSet<[u8; 32]>>>,
    running: Arc<RwLock<bool>>,
}

impl Dht {
    /// Create a new DHT instance
    pub fn new(config: DhtConfig) -> Self {
        let routing_table = RoutingTable::new(config.node_id);

        Self {
            config,
            routing_table: Arc::new(RwLock::new(routing_table)),
            socket: None,
            rpc: None,
            announcements: Arc::new(RwLock::new(HashSet::new())),
            running: Arc::new(RwLock::new(false)),
        }
    }

    /// Start the DHT
    pub async fn start(&mut self) -> Result<()> {
        let mut running = self.running.write().await;
        if *running {
            return Ok(());
        }

        // Bind UDP socket
        let socket = UdpSocket::bind("0.0.0.0:0").await?;
        let socket = Arc::new(socket);
        self.socket = Some(socket.clone());

        // Create RPC handler
        let rpc = DhtRpc::new(
            socket.clone(),
            self.config.node_id,
            self.routing_table.clone(),
        );
        let rpc = Arc::new(rpc);
        self.rpc = Some(rpc.clone());

        // Start RPC listener
        self.spawn_rpc_listener(rpc.clone());

        // Bootstrap from known nodes
        for addr in &self.config.bootstrap_nodes {
            if let Err(e) = rpc.ping(*addr).await {
                log::warn!("Failed to ping bootstrap node {}: {}", addr, e);
            }
        }

        *running = true;
        Ok(())
    }

    /// Stop the DHT
    pub async fn stop(&mut self) {
        let mut running = self.running.write().await;
        *running = false;
        self.socket = None;
        self.rpc = None;
    }

    /// Announce presence on a topic
    pub async fn announce(&self, topic: &[u8; 32]) -> Result<()> {
        self.announcements.write().await.insert(*topic);

        if let Some(rpc) = &self.rpc {
            // Find nodes close to topic
            let nodes = self.routing_table.read().await.closest(topic, 20);

            // Announce to each
            for node in nodes {
                if let Err(e) = rpc.announce(node.address, topic).await {
                    log::debug!("Failed to announce to {}: {}", node.address, e);
                }
            }
        }

        Ok(())
    }

    /// Stop announcing on a topic
    pub async fn unannounce(&self, topic: &[u8; 32]) -> Result<()> {
        self.announcements.write().await.remove(topic);
        Ok(())
    }

    /// Look up peers for a topic
    pub async fn lookup(&self, topic: &[u8; 32]) -> Result<Vec<SocketAddr>> {
        let rpc = self.rpc.as_ref().ok_or(Error::SwarmNotRunning)?;

        // Start with closest known nodes
        let initial_nodes = self.routing_table.read().await.closest(topic, 3);

        let mut queried = HashSet::new();
        let mut results = Vec::new();
        let mut to_query: Vec<_> = initial_nodes.into_iter().collect();

        // Iterative lookup
        for _ in 0..3 {
            let mut new_nodes = Vec::new();

            for node in to_query.drain(..) {
                if queried.contains(&node.id) {
                    continue;
                }
                queried.insert(node.id);

                match rpc.find_peers(node.address, topic).await {
                    Ok((peers, closer_nodes)) => {
                        results.extend(peers);
                        new_nodes.extend(closer_nodes);
                    }
                    Err(e) => {
                        log::debug!("Find peers failed for {}: {}", node.address, e);
                    }
                }
            }

            if new_nodes.is_empty() {
                break;
            }

            to_query = new_nodes;
        }

        Ok(results)
    }

    /// Get the local node ID
    pub fn node_id(&self) -> [u8; 32] {
        self.config.node_id
    }

    // Internal: spawn RPC listener
    fn spawn_rpc_listener(&self, rpc: Arc<DhtRpc>) {
        let routing_table = self.routing_table.clone();
        let announcements = self.announcements.clone();
        let running = self.running.clone();

        tokio::spawn(async move {
            while *running.read().await {
                if let Err(e) = rpc.handle_incoming(&routing_table, &announcements).await {
                    log::error!("RPC error: {}", e);
                }
            }
        });
    }
}
