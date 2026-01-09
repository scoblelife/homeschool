//! DHT RPC protocol

use super::routing::{Node, RoutingTable};
use crate::{Error, Result};

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::net::UdpSocket;
use tokio::sync::RwLock;
use tokio::time::timeout;

const RPC_TIMEOUT: Duration = Duration::from_secs(5);
const MAX_PACKET_SIZE: usize = 1024;

/// RPC message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RpcMessage {
    Ping {
        sender_id: [u8; 32],
    },
    Pong {
        sender_id: [u8; 32],
    },
    FindNode {
        sender_id: [u8; 32],
        target: [u8; 32],
    },
    Nodes {
        sender_id: [u8; 32],
        nodes: Vec<NodeInfo>,
    },
    Announce {
        sender_id: [u8; 32],
        topic: [u8; 32],
        port: u16,
    },
    FindPeers {
        sender_id: [u8; 32],
        topic: [u8; 32],
    },
    Peers {
        sender_id: [u8; 32],
        peers: Vec<PeerAddr>,
        nodes: Vec<NodeInfo>,
    },
}

/// Compact node info for transmission
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    pub id: [u8; 32],
    pub addr: String,
}

impl From<&Node> for NodeInfo {
    fn from(node: &Node) -> Self {
        Self {
            id: node.id,
            addr: node.address.to_string(),
        }
    }
}

/// Compact peer address
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerAddr {
    pub addr: String,
}

/// DHT RPC handler
pub struct DhtRpc {
    socket: Arc<UdpSocket>,
    local_id: [u8; 32],
    routing_table: Arc<RwLock<RoutingTable>>,
    // topic -> set of peer addresses
    topic_peers: Arc<RwLock<std::collections::HashMap<[u8; 32], HashSet<SocketAddr>>>>,
}

impl DhtRpc {
    pub fn new(
        socket: Arc<UdpSocket>,
        local_id: [u8; 32],
        routing_table: Arc<RwLock<RoutingTable>>,
    ) -> Self {
        Self {
            socket,
            local_id,
            routing_table,
            topic_peers: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Send a ping to an address
    pub async fn ping(&self, addr: SocketAddr) -> Result<()> {
        let msg = RpcMessage::Ping {
            sender_id: self.local_id,
        };
        self.send(&msg, addr).await?;

        // Wait for pong
        let response = self.recv_from(addr).await?;
        match response {
            RpcMessage::Pong { sender_id } => {
                // Add to routing table
                let node = Node::new(sender_id, addr);
                self.routing_table.write().await.add(node);
                Ok(())
            }
            _ => Err(Error::Dht("Unexpected response to ping".into())),
        }
    }

    /// Announce presence on a topic
    pub async fn announce(&self, addr: SocketAddr, topic: &[u8; 32]) -> Result<()> {
        let local_port = self.socket.local_addr()?.port();
        let msg = RpcMessage::Announce {
            sender_id: self.local_id,
            topic: *topic,
            port: local_port,
        };
        self.send(&msg, addr).await
    }

    /// Find peers for a topic
    pub async fn find_peers(
        &self,
        addr: SocketAddr,
        topic: &[u8; 32],
    ) -> Result<(Vec<SocketAddr>, Vec<Node>)> {
        let msg = RpcMessage::FindPeers {
            sender_id: self.local_id,
            topic: *topic,
        };
        self.send(&msg, addr).await?;

        let response = self.recv_from(addr).await?;
        match response {
            RpcMessage::Peers { sender_id, peers, nodes } => {
                // Add sender to routing table
                let node = Node::new(sender_id, addr);
                self.routing_table.write().await.add(node);

                // Parse peer addresses
                let peer_addrs: Vec<SocketAddr> = peers
                    .iter()
                    .filter_map(|p| p.addr.parse().ok())
                    .collect();

                // Parse closer nodes
                let closer_nodes: Vec<Node> = nodes
                    .iter()
                    .filter_map(|n| {
                        n.addr.parse().ok().map(|addr| Node::new(n.id, addr))
                    })
                    .collect();

                Ok((peer_addrs, closer_nodes))
            }
            _ => Err(Error::Dht("Unexpected response to find_peers".into())),
        }
    }

    /// Handle incoming RPC messages
    pub async fn handle_incoming(
        &self,
        routing_table: &Arc<RwLock<RoutingTable>>,
        announcements: &Arc<RwLock<HashSet<[u8; 32]>>>,
    ) -> Result<()> {
        let mut buf = [0u8; MAX_PACKET_SIZE];
        let (len, from) = self.socket.recv_from(&mut buf).await?;

        let msg: RpcMessage = serde_json::from_slice(&buf[..len])
            .map_err(|e| Error::Dht(format!("Failed to parse message: {}", e)))?;

        match msg {
            RpcMessage::Ping { sender_id } => {
                // Add to routing table
                let node = Node::new(sender_id, from);
                routing_table.write().await.add(node);

                // Send pong
                let response = RpcMessage::Pong {
                    sender_id: self.local_id,
                };
                self.send(&response, from).await?;
            }

            RpcMessage::FindNode { sender_id, target } => {
                // Add sender to routing table
                let node = Node::new(sender_id, from);
                routing_table.write().await.add(node);

                // Find closest nodes
                let closest = routing_table.read().await.closest(&target, 20);
                let nodes: Vec<NodeInfo> = closest.iter().map(|n| n.into()).collect();

                let response = RpcMessage::Nodes {
                    sender_id: self.local_id,
                    nodes,
                };
                self.send(&response, from).await?;
            }

            RpcMessage::Announce { sender_id, topic, port } => {
                // Add sender to routing table
                let node = Node::new(sender_id, from);
                routing_table.write().await.add(node);

                // Store peer for topic
                let peer_addr = SocketAddr::new(from.ip(), port);
                self.topic_peers
                    .write()
                    .await
                    .entry(topic)
                    .or_insert_with(HashSet::new)
                    .insert(peer_addr);
            }

            RpcMessage::FindPeers { sender_id, topic } => {
                // Add sender to routing table
                let node = Node::new(sender_id, from);
                routing_table.write().await.add(node);

                // Get peers for topic
                let peers: Vec<PeerAddr> = self.topic_peers
                    .read()
                    .await
                    .get(&topic)
                    .map(|addrs| {
                        addrs.iter().map(|a| PeerAddr { addr: a.to_string() }).collect()
                    })
                    .unwrap_or_default();

                // Get closer nodes
                let closest = routing_table.read().await.closest(&topic, 8);
                let nodes: Vec<NodeInfo> = closest.iter().map(|n| n.into()).collect();

                let response = RpcMessage::Peers {
                    sender_id: self.local_id,
                    peers,
                    nodes,
                };
                self.send(&response, from).await?;
            }

            _ => {
                // Ignore other messages (they're responses)
            }
        }

        Ok(())
    }

    // Internal: send a message
    async fn send(&self, msg: &RpcMessage, addr: SocketAddr) -> Result<()> {
        let data = serde_json::to_vec(msg)
            .map_err(|e| Error::Dht(format!("Failed to serialize: {}", e)))?;
        self.socket.send_to(&data, addr).await?;
        Ok(())
    }

    // Internal: receive from a specific address with timeout
    async fn recv_from(&self, expected_addr: SocketAddr) -> Result<RpcMessage> {
        let mut buf = [0u8; MAX_PACKET_SIZE];

        let result = timeout(RPC_TIMEOUT, async {
            loop {
                let (len, from) = self.socket.recv_from(&mut buf).await?;
                if from == expected_addr {
                    let msg: RpcMessage = serde_json::from_slice(&buf[..len])
                        .map_err(|e| Error::Dht(format!("Failed to parse: {}", e)))?;
                    return Ok(msg);
                }
                // Ignore messages from other addresses
            }
        }).await;

        match result {
            Ok(Ok(msg)) => Ok(msg),
            Ok(Err(e)) => Err(e),
            Err(_) => Err(Error::Timeout),
        }
    }
}
