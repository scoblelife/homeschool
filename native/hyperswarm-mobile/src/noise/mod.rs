//! Noise Protocol implementation for encrypted connections
//!
//! Uses the Noise_XX pattern for mutual authentication:
//! - Both parties prove they have a static keypair
//! - Forward secrecy via ephemeral keys
//! - Encrypted after first message

use crate::peer::PeerId;
use crate::transport::Connection;
use crate::{Error, Result};

use snow::{Builder, HandshakeState, TransportState};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Noise protocol pattern
const NOISE_PATTERN: &str = "Noise_XX_25519_ChaChaPoly_SHA256";

/// Maximum message size
const MAX_MESSAGE_SIZE: usize = 65535;

/// Noise session for encrypted communication
pub struct NoiseSession {
    is_initiator: bool,
    static_keypair: snow::Keypair,
    handshake: Option<HandshakeState>,
    transport: Option<TransportState>,
}

impl NoiseSession {
    /// Create a new session as initiator (client)
    pub fn new_initiator() -> Result<Self> {
        let builder = Builder::new(NOISE_PATTERN.parse().unwrap());
        let static_keypair = builder.generate_keypair()
            .map_err(|e| Error::Noise(e.to_string()))?;

        let handshake = builder
            .local_private_key(&static_keypair.private)
            .build_initiator()
            .map_err(|e| Error::Noise(e.to_string()))?;

        Ok(Self {
            is_initiator: true,
            static_keypair,
            handshake: Some(handshake),
            transport: None,
        })
    }

    /// Create a new session as responder (server)
    pub fn new_responder() -> Result<Self> {
        let builder = Builder::new(NOISE_PATTERN.parse().unwrap());
        let static_keypair = builder.generate_keypair()
            .map_err(|e| Error::Noise(e.to_string()))?;

        let handshake = builder
            .local_private_key(&static_keypair.private)
            .build_responder()
            .map_err(|e| Error::Noise(e.to_string()))?;

        Ok(Self {
            is_initiator: false,
            static_keypair,
            handshake: Some(handshake),
            transport: None,
        })
    }

    /// Perform the Noise handshake over a connection
    pub async fn handshake(mut self, mut conn: Connection) -> Result<(PeerId, SecureConnection)> {
        let mut handshake = self.handshake.take()
            .ok_or(Error::InvalidState("Handshake already completed".into()))?;

        let mut buf = vec![0u8; MAX_MESSAGE_SIZE];

        // XX pattern:
        // -> e
        // <- e, ee, s, es
        // -> s, se

        if self.is_initiator {
            // Step 1: Send e
            let len = handshake.write_message(&[], &mut buf)
                .map_err(|e| Error::HandshakeFailed(e.to_string()))?;
            conn.send(&buf[..len]).await?;

            // Step 2: Receive e, ee, s, es
            let msg = conn.recv().await?;
            handshake.read_message(&msg, &mut buf)
                .map_err(|e| Error::HandshakeFailed(e.to_string()))?;

            // Step 3: Send s, se
            let len = handshake.write_message(&[], &mut buf)
                .map_err(|e| Error::HandshakeFailed(e.to_string()))?;
            conn.send(&buf[..len]).await?;
        } else {
            // Step 1: Receive e
            let msg = conn.recv().await?;
            handshake.read_message(&msg, &mut buf)
                .map_err(|e| Error::HandshakeFailed(e.to_string()))?;

            // Step 2: Send e, ee, s, es
            let len = handshake.write_message(&[], &mut buf)
                .map_err(|e| Error::HandshakeFailed(e.to_string()))?;
            conn.send(&buf[..len]).await?;

            // Step 3: Receive s, se
            let msg = conn.recv().await?;
            handshake.read_message(&msg, &mut buf)
                .map_err(|e| Error::HandshakeFailed(e.to_string()))?;
        }

        // Get remote static public key
        let remote_static = handshake.get_remote_static()
            .ok_or(Error::HandshakeFailed("No remote static key".into()))?;
        let peer_id = PeerId::from_public_key(remote_static);

        // Convert to transport mode
        let transport = handshake.into_transport_mode()
            .map_err(|e| Error::HandshakeFailed(e.to_string()))?;

        let secure_conn = SecureConnection::new(conn, transport, self.is_initiator);

        Ok((peer_id, secure_conn))
    }

    /// Get local public key
    pub fn local_public_key(&self) -> &[u8] {
        &self.static_keypair.public
    }
}

/// Encrypted connection after handshake
pub struct SecureConnection {
    inner: Arc<Mutex<SecureConnectionInner>>,
    remote_addr: std::net::SocketAddr,
}

struct SecureConnectionInner {
    conn: Connection,
    transport: TransportState,
    is_initiator: bool,
}

impl SecureConnection {
    fn new(conn: Connection, transport: TransportState, is_initiator: bool) -> Self {
        let remote_addr = conn.remote_addr();
        Self {
            inner: Arc::new(Mutex::new(SecureConnectionInner {
                conn,
                transport,
                is_initiator,
            })),
            remote_addr,
        }
    }

    /// Send encrypted data
    pub async fn send(&self, data: &[u8]) -> Result<()> {
        let mut inner = self.inner.lock().await;
        let mut buf = vec![0u8; data.len() + 16]; // AEAD tag

        let len = inner.transport.write_message(data, &mut buf)
            .map_err(|e| Error::Noise(e.to_string()))?;

        inner.conn.send(&buf[..len]).await
    }

    /// Receive and decrypt data
    pub async fn recv(&self) -> Result<Vec<u8>> {
        let mut inner = self.inner.lock().await;
        let msg = inner.conn.recv().await?;

        let mut buf = vec![0u8; msg.len()];
        let len = inner.transport.read_message(&msg, &mut buf)
            .map_err(|e| Error::Noise(e.to_string()))?;

        buf.truncate(len);
        Ok(buf)
    }

    /// Get remote address
    pub fn remote_addr(&self) -> std::net::SocketAddr {
        self.remote_addr
    }

    /// Clone the connection (for splitting send/recv)
    pub fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            remote_addr: self.remote_addr,
        }
    }
}
