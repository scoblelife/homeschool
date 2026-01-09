//! Peer representation and management

use bytes::Bytes;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fmt;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::mpsc;

/// 32-byte peer identifier derived from public key
#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PeerId([u8; 32]);

impl PeerId {
    /// Create a new PeerId from bytes
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create a PeerId from a public key
    pub fn from_public_key(public_key: &[u8]) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(public_key);
        let result = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&result);
        Self(id)
    }

    /// Get the raw bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }

    /// Parse from hex string
    pub fn from_hex(s: &str) -> Option<Self> {
        let bytes = hex::decode(s).ok()?;
        if bytes.len() != 32 {
            return None;
        }
        let mut id = [0u8; 32];
        id.copy_from_slice(&bytes);
        Some(Self(id))
    }

    /// Get short representation (first 8 chars)
    pub fn short(&self) -> String {
        self.to_hex()[..8].to_string()
    }
}

impl fmt::Debug for PeerId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "PeerId({}...)", &self.to_hex()[..8])
    }
}

impl fmt::Display for PeerId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

/// Information about a connected peer
#[derive(Debug, Clone)]
pub struct PeerInfo {
    pub id: PeerId,
    pub address: SocketAddr,
    pub is_initiator: bool,
    pub connected_at: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
}

/// A connected peer with send capabilities
pub struct Peer {
    pub info: PeerInfo,
    sender: mpsc::Sender<Bytes>,
}

impl Peer {
    /// Create a new peer
    pub fn new(info: PeerInfo, sender: mpsc::Sender<Bytes>) -> Self {
        Self { info, sender }
    }

    /// Send data to this peer
    pub async fn send(&self, data: Bytes) -> crate::Result<()> {
        self.sender
            .send(data)
            .await
            .map_err(|_| crate::Error::SendFailed("Channel closed".into()))
    }

    /// Get the peer ID
    pub fn id(&self) -> PeerId {
        self.info.id
    }
}

// Add hex crate for encoding
mod hex {
    const HEX_CHARS: &[u8; 16] = b"0123456789abcdef";

    pub fn encode(bytes: impl AsRef<[u8]>) -> String {
        let bytes = bytes.as_ref();
        let mut s = String::with_capacity(bytes.len() * 2);
        for &b in bytes {
            s.push(HEX_CHARS[(b >> 4) as usize] as char);
            s.push(HEX_CHARS[(b & 0xf) as usize] as char);
        }
        s
    }

    pub fn decode(s: &str) -> Result<Vec<u8>, ()> {
        if s.len() % 2 != 0 {
            return Err(());
        }
        let mut bytes = Vec::with_capacity(s.len() / 2);
        for chunk in s.as_bytes().chunks(2) {
            let high = from_hex_char(chunk[0]).ok_or(())?;
            let low = from_hex_char(chunk[1]).ok_or(())?;
            bytes.push((high << 4) | low);
        }
        Ok(bytes)
    }

    fn from_hex_char(c: u8) -> Option<u8> {
        match c {
            b'0'..=b'9' => Some(c - b'0'),
            b'a'..=b'f' => Some(c - b'a' + 10),
            b'A'..=b'F' => Some(c - b'A' + 10),
            _ => None,
        }
    }
}
