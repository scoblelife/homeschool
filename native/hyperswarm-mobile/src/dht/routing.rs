//! Kademlia routing table with K-buckets

use std::collections::VecDeque;
use std::net::SocketAddr;
use std::time::{Duration, Instant};

/// Maximum nodes per bucket
const K: usize = 20;

/// Number of bits in node ID
const ID_BITS: usize = 256;

/// A node in the DHT
#[derive(Clone, Debug)]
pub struct Node {
    pub id: [u8; 32],
    pub address: SocketAddr,
    pub last_seen: Instant,
}

impl Node {
    pub fn new(id: [u8; 32], address: SocketAddr) -> Self {
        Self {
            id,
            address,
            last_seen: Instant::now(),
        }
    }

    pub fn touch(&mut self) {
        self.last_seen = Instant::now();
    }

    pub fn is_stale(&self, timeout: Duration) -> bool {
        self.last_seen.elapsed() > timeout
    }
}

/// K-bucket for storing nodes at a specific distance
struct KBucket {
    nodes: VecDeque<Node>,
}

impl KBucket {
    fn new() -> Self {
        Self {
            nodes: VecDeque::with_capacity(K),
        }
    }

    fn add(&mut self, node: Node) -> bool {
        // Check if node already exists
        if let Some(pos) = self.nodes.iter().position(|n| n.id == node.id) {
            // Move to end (most recently seen)
            self.nodes.remove(pos);
            self.nodes.push_back(node);
            return true;
        }

        // Add if bucket not full
        if self.nodes.len() < K {
            self.nodes.push_back(node);
            return true;
        }

        // Bucket is full - could ping oldest node here
        false
    }

    fn remove(&mut self, id: &[u8; 32]) {
        self.nodes.retain(|n| &n.id != id);
    }

    fn get(&self, id: &[u8; 32]) -> Option<&Node> {
        self.nodes.iter().find(|n| &n.id == id)
    }

    fn nodes(&self) -> impl Iterator<Item = &Node> {
        self.nodes.iter()
    }

    fn len(&self) -> usize {
        self.nodes.len()
    }
}

/// Kademlia routing table
pub struct RoutingTable {
    local_id: [u8; 32],
    buckets: Vec<KBucket>,
}

impl RoutingTable {
    /// Create a new routing table
    pub fn new(local_id: [u8; 32]) -> Self {
        let mut buckets = Vec::with_capacity(ID_BITS);
        for _ in 0..ID_BITS {
            buckets.push(KBucket::new());
        }

        Self { local_id, buckets }
    }

    /// Add or update a node
    pub fn add(&mut self, node: Node) -> bool {
        if node.id == self.local_id {
            return false;
        }

        let bucket_idx = self.bucket_index(&node.id);
        self.buckets[bucket_idx].add(node)
    }

    /// Remove a node
    pub fn remove(&mut self, id: &[u8; 32]) {
        let bucket_idx = self.bucket_index(id);
        self.buckets[bucket_idx].remove(id);
    }

    /// Get a node by ID
    pub fn get(&self, id: &[u8; 32]) -> Option<&Node> {
        let bucket_idx = self.bucket_index(id);
        self.buckets[bucket_idx].get(id)
    }

    /// Find the K closest nodes to a target
    pub fn closest(&self, target: &[u8; 32], count: usize) -> Vec<Node> {
        let mut all_nodes: Vec<_> = self.buckets
            .iter()
            .flat_map(|b| b.nodes())
            .cloned()
            .collect();

        // Sort by XOR distance to target
        all_nodes.sort_by(|a, b| {
            let dist_a = xor_distance(&a.id, target);
            let dist_b = xor_distance(&b.id, target);
            dist_a.cmp(&dist_b)
        });

        all_nodes.truncate(count);
        all_nodes
    }

    /// Get total number of nodes
    pub fn len(&self) -> usize {
        self.buckets.iter().map(|b| b.len()).sum()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    // Calculate which bucket a node belongs to
    fn bucket_index(&self, id: &[u8; 32]) -> usize {
        let distance = xor_distance(&self.local_id, id);
        leading_zeros(&distance).min(ID_BITS - 1)
    }
}

/// Calculate XOR distance between two IDs
fn xor_distance(a: &[u8; 32], b: &[u8; 32]) -> [u8; 32] {
    let mut result = [0u8; 32];
    for i in 0..32 {
        result[i] = a[i] ^ b[i];
    }
    result
}

/// Count leading zeros in a 256-bit number
fn leading_zeros(bytes: &[u8; 32]) -> usize {
    let mut zeros = 0;
    for byte in bytes {
        if *byte == 0 {
            zeros += 8;
        } else {
            zeros += byte.leading_zeros() as usize;
            break;
        }
    }
    zeros
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_xor_distance() {
        let a = [0u8; 32];
        let mut b = [0u8; 32];
        b[31] = 1;

        let dist = xor_distance(&a, &b);
        assert_eq!(dist[31], 1);
        assert_eq!(leading_zeros(&dist), 255);
    }

    #[test]
    fn test_routing_table() {
        let local_id = [0u8; 32];
        let mut table = RoutingTable::new(local_id);

        let mut node_id = [0u8; 32];
        node_id[0] = 0x80; // Far away
        let node = Node::new(node_id, "127.0.0.1:8080".parse().unwrap());

        assert!(table.add(node.clone()));
        assert_eq!(table.len(), 1);

        let closest = table.closest(&node_id, 1);
        assert_eq!(closest.len(), 1);
        assert_eq!(closest[0].id, node_id);
    }
}
